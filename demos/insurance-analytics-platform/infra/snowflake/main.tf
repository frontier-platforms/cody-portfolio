# Cost guardrail: unlike Azure's budget (notify-only), a Snowflake resource monitor can
# actually suspend compute, not just alert. suspend_trigger stops new queries from
# starting at 80% of quota; suspend_immediate_trigger kills running queries at 100%.
resource "snowflake_resource_monitor" "main" {
  name         = "RM_INSURANCE_ANALYTICS"
  credit_quota = var.monitor_credit_quota
  frequency    = "MONTHLY"

  # frequency and start_timestamp are a package deal in this resource: setting one
  # requires the other. +10m guards against the gap between `plan` computing this
  # value and `apply` actually sending it — Snowflake rejects a start time that's
  # already passed by the time the SQL runs. ignore_changes stops every later
  # `plan` from showing a diff just because "now" moved on since creation.
  start_timestamp = formatdate("YYYY-MM-DD hh:mm", timeadd(timestamp(), "10m"))

  suspend_trigger           = 80
  suspend_immediate_trigger = 100

  lifecycle {
    ignore_changes = [start_timestamp]
  }
}

# snowflake_resource_monitor can't attach itself to the whole account — the provider's
# own docs say that's not supported yet and point to this raw-SQL escape hatch instead.
resource "snowflake_execute" "attach_monitor_to_account" {
  execute = "ALTER ACCOUNT SET RESOURCE_MONITOR = ${snowflake_resource_monitor.main.name}"
  revert  = "ALTER ACCOUNT UNSET RESOURCE_MONITOR"
}

# --- RAW landing zone for Airbyte ---

resource "snowflake_database" "raw" {
  name    = "RAW"
  comment = "Airbyte CDC lands raw, unmodified Postgres data here."
}

resource "snowflake_warehouse" "load_wh" {
  name           = "LOAD_WH"
  warehouse_size = "XSMALL"
  auto_suspend   = 60
}

resource "snowflake_account_role" "loader" {
  name    = "LOADER"
  comment = "Writes RAW. Used by Airbyte's service user."
}

# A machine identity, not a person - snowflake_service_user (not snowflake_user) has no
# password or MFA fields at all, matching the "service users use key-pair auth only" rule.
resource "snowflake_service_user" "airbyte_svc" {
  name              = "AIRBYTE_SVC"
  rsa_public_key    = var.airbyte_svc_public_key
  default_role      = snowflake_account_role.loader.name
  default_warehouse = snowflake_warehouse.load_wh.name
  comment           = "Airbyte's Postgres-to-Snowflake CDC connection."
}

resource "snowflake_grant_account_role" "loader_to_airbyte_svc" {
  role_name = snowflake_account_role.loader.name
  user_name = snowflake_service_user.airbyte_svc.name
}

resource "snowflake_grant_privileges_to_account_role" "loader_on_raw" {
  account_role_name = snowflake_account_role.loader.name
  privileges        = ["USAGE", "CREATE SCHEMA"]
  on_account_object {
    object_type = "DATABASE"
    object_name = snowflake_database.raw.name
  }
}

resource "snowflake_grant_privileges_to_account_role" "loader_on_load_wh" {
  account_role_name = snowflake_account_role.loader.name
  privileges        = ["USAGE"]
  on_account_object {
    object_type = "WAREHOUSE"
    object_name = snowflake_warehouse.load_wh.name
  }
}

# --- ACCOUNTADMIN read access to what Airbyte lands ---
#
# ACCOUNTADMIN is an administrative role (manage users, warehouses, billing, grants
# themselves) - it does NOT get automatic SELECT on data it doesn't own, same as any
# other role. That's the error fixed by hand in Snowsight after the first sync; this
# codifies it so a fresh apply doesn't need that manual step repeated.
#
# AIRBYTE is LOADER's schema, not Terraform's: Airbyte creates it itself on first sync
# (CREATE SCHEMA IF NOT EXISTS, via the CREATE SCHEMA grant on RAW). So it's referenced
# here as a plain qualified-name string, not a snowflake_schema resource. One real
# consequence: on a from-scratch apply (schema doesn't exist yet), these three grants
# will fail with "does not exist or not authorized" until after Airbyte's first sync has
# run at least once. Harmless re-run after that first sync fixes it; not worth solving
# with an artificial dependency for a practice project.
locals {
  airbyte_schema_fqn = "\"${snowflake_database.raw.name}\".\"AIRBYTE\""
}

resource "snowflake_grant_privileges_to_account_role" "accountadmin_usage_on_airbyte_schema" {
  account_role_name = "ACCOUNTADMIN"
  privileges        = ["USAGE"]
  on_schema {
    schema_name = local.airbyte_schema_fqn
  }
}

resource "snowflake_grant_privileges_to_account_role" "accountadmin_select_on_airbyte_tables" {
  account_role_name = "ACCOUNTADMIN"
  privileges        = ["SELECT"]
  on_schema_object {
    all {
      object_type_plural = "TABLES"
      in_schema          = local.airbyte_schema_fqn
    }
  }
}

# Covers tables Airbyte adds later (new streams, new source tables) without a repeat
# manual grant - mirrors the ALTER DEFAULT PRIVILEGES pattern already used on the
# Postgres side for the same reason.
resource "snowflake_grant_privileges_to_account_role" "accountadmin_select_on_future_airbyte_tables" {
  account_role_name = "ACCOUNTADMIN"
  privileges        = ["SELECT"]
  on_schema_object {
    future {
      object_type_plural = "TABLES"
      in_schema          = local.airbyte_schema_fqn
    }
  }
}

# --- Phase 4: dbt's databases, warehouse and role ---
#
# ANALYTICS_DEV is where personal dbt dev schemas live (one per developer, e.g.
# DBT_CODY) - cheap to let it diverge from prod since nobody else reads from it.
# ANALYTICS_PROD is what the scheduled task and any front end actually query.
# Both stay empty of tables until dbt creates its own schemas in them, same as
# AIRBYTE under RAW - that's why TRANSFORMER gets CREATE SCHEMA, not a fixed schema
# list.
resource "snowflake_database" "analytics_dev" {
  name    = "ANALYTICS_DEV"
  comment = "dbt development target - personal schemas, one per developer."
}

resource "snowflake_database" "analytics_prod" {
  name    = "ANALYTICS_PROD"
  comment = "dbt production target - what the scheduled task and front ends read."
}

resource "snowflake_warehouse" "transform_wh" {
  name           = "TRANSFORM_WH"
  warehouse_size = "XSMALL"
  auto_suspend   = 60
}

resource "snowflake_account_role" "transformer" {
  name    = "TRANSFORMER"
  comment = "Reads RAW, writes the analytics databases, runs the dbt project."
}

# Granted to your own Terraform-authenticating user, not a new service user - local
# dbt dev just needs your existing key-pair login to carry this role. A dedicated
# dbt/CI service user (dbt_svc or reusing ci_svc) is a Phase 8 concern, once
# `snow dbt deploy` is wired into GitHub Actions.
resource "snowflake_grant_account_role" "transformer_to_self" {
  role_name = snowflake_account_role.transformer.name
  user_name = var.username
}

resource "snowflake_grant_privileges_to_account_role" "transformer_on_transform_wh" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["USAGE"]
  on_account_object {
    object_type = "WAREHOUSE"
    object_name = snowflake_warehouse.transform_wh.name
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_on_analytics_dbs" {
  for_each = {
    dev  = snowflake_database.analytics_dev.name
    prod = snowflake_database.analytics_prod.name
  }

  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["USAGE", "CREATE SCHEMA"]
  on_account_object {
    object_type = "DATABASE"
    object_name = each.value
  }
}

# Same shape as the ACCOUNTADMIN grants above, just for TRANSFORMER - staging models
# need SELECT on RAW.AIRBYTE to read what Airbyte lands.
resource "snowflake_grant_privileges_to_account_role" "transformer_usage_on_raw_db" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["USAGE"]
  on_account_object {
    object_type = "DATABASE"
    object_name = snowflake_database.raw.name
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_usage_on_airbyte_schema" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["USAGE"]
  on_schema {
    schema_name = local.airbyte_schema_fqn
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_select_on_airbyte_tables" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["SELECT"]
  on_schema_object {
    all {
      object_type_plural = "TABLES"
      in_schema          = local.airbyte_schema_fqn
    }
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_select_on_future_airbyte_tables" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["SELECT"]
  on_schema_object {
    future {
      object_type_plural = "TABLES"
      in_schema          = local.airbyte_schema_fqn
    }
  }
}

# --- TRANSFORMER read access to LEGACY.PUBLIC ---
#
# The Phase 4 parity tests join dbt's marts against LEGACY.PUBLIC.EARNED_PREMIUM_MONTHLY
# and PREMIUM_BORDEREAU directly in SQL (a plain cross-database query - Snowflake
# doesn't need anything special for that within one account). LEGACY is hand-created
# in Snowsight, not Terraform (docs/adr/0002), same situation as RAW.AIRBYTE: referenced
# here as a quoted string, not a resource reference, with the same USAGE+SELECT(+future)
# shape as the Airbyte grants above.
locals {
  legacy_schema_fqn = "\"LEGACY\".\"PUBLIC\""
}

resource "snowflake_grant_privileges_to_account_role" "transformer_usage_on_legacy_db" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["USAGE"]
  on_account_object {
    object_type = "DATABASE"
    object_name = "LEGACY"
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_usage_on_legacy_schema" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["USAGE"]
  on_schema {
    schema_name = local.legacy_schema_fqn
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_select_on_legacy_tables" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["SELECT"]
  on_schema_object {
    all {
      object_type_plural = "TABLES"
      in_schema          = local.legacy_schema_fqn
    }
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_select_on_future_legacy_tables" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["SELECT"]
  on_schema_object {
    future {
      object_type_plural = "TABLES"
      in_schema          = local.legacy_schema_fqn
    }
  }
}

# --- TRANSFORMER: create the DBT PROJECT object in ANALYTICS_PROD.PROD ---
#
# PROD is hand-created (snow dbt deploy needs it to already exist before it can create
# a DBT PROJECT object inside it - CREATE <object> IN SCHEMA doesn't auto-vivify the
# schema the way CREATE SCHEMA itself would), same situation as AIRBYTE and LEGACY:
# referenced as a string, not a resource. CREATE DBT PROJECT is a real, distinct schema
# privilege (confirmed against Snowflake's dbt-projects-on-snowflake access-control
# docs) - USAGE/CREATE SCHEMA at the database level isn't enough on its own.
resource "snowflake_grant_privileges_to_account_role" "transformer_create_dbt_project_on_prod_schema" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["CREATE DBT PROJECT"]
  on_schema {
    schema_name = "\"ANALYTICS_PROD\".\"PROD\""
  }
}

# --- ACCOUNTADMIN: USAGE on the DBT PROJECT object itself ---
#
# The object was created by TRANSFORMER (snow dbt deploy ran under that connection's
# role), not by ACCOUNTADMIN - same "ACCOUNTADMIN doesn't auto-inherit access to what
# it doesn't own" situation as the RAW.AIRBYTE grants in Phase 2. The task that calls
# EXECUTE DBT PROJECT runs as whatever role owns the task (ACCOUNTADMIN, since it was
# created in Snowsight under that role), and the calling role needs USAGE on the
# object even though the actual dbt build itself runs as TRANSFORMER (set in
# dbt_projects_profiles.yml) - two separate privilege checks, confirmed by the task's
# own failure message.
resource "snowflake_grant_privileges_to_account_role" "accountadmin_usage_on_dbt_project" {
  account_role_name = "ACCOUNTADMIN"
  privileges        = ["USAGE"]
  on_schema_object {
    object_type = "DBT PROJECT"
    object_name = "\"ANALYTICS_PROD\".\"PROD\".\"INSURANCE_ANALYTICS\""
  }
}

# TRANSFORMER was granted to your personal user (transformer_to_self, above), which is
# why your manual EXECUTE DBT PROJECT test worked - an interactive Snowsight session is
# tied to your user, and your user holds TRANSFORMER directly. A TASK has no such user
# context: it runs purely as its owning role (ACCOUNTADMIN, since the task was created
# under that role), so when EXECUTE DBT PROJECT tries to internally activate TRANSFORMER
# (per dbt_projects_profiles.yml), there's no user for Snowflake to check it against.
# Granting the role to ACCOUNTADMIN itself (role-to-role, not role-to-user) makes
# TRANSFORMER assumable from any ACCOUNTADMIN execution context, task or human.
resource "snowflake_grant_account_role" "transformer_to_accountadmin" {
  role_name        = snowflake_account_role.transformer.name
  parent_role_name = "ACCOUNTADMIN"
}

# --- Phase 5: reporting/tenant roles and the warehouse they query with ---

resource "snowflake_warehouse" "bi_wh" {
  name           = "BI_WH"
  warehouse_size = "XSMALL"
  auto_suspend   = 60
}

# Internal reporting role - sees ALL tenants (the row access policy in Phase 5b
# exempts this role, same as TRANSFORMER), unlike the client-facing TENANT_* roles
# below. This is what an internal analyst or Lightdash's own service user would use.
resource "snowflake_account_role" "reporter" {
  name    = "REPORTER"
  comment = "Reads prod marts and semantic views. Sees all tenants (exempt from the row access policy)."
}

# Not a data-access role in the usual sense - PII_READER is purely an exemption flag
# referenced inside the masking policy body (Phase 5c): whichever role holds it sees
# real PII, everyone else sees the masked value. Granted to TRANSFORMER so dbt's own
# builds always operate on real values - masking should only ever apply at the final
# human-facing query, never inside the pipeline itself.
resource "snowflake_account_role" "pii_reader" {
  name    = "PII_READER"
  comment = "Exemption role for the PII masking policy. Sees unmasked PII wherever granted."
}

resource "snowflake_grant_account_role" "pii_reader_to_transformer" {
  role_name        = snowflake_account_role.pii_reader.name
  parent_role_name = snowflake_account_role.transformer.name
}

# One role per tenant, client-facing - each sees only its own tenant_id, enforced by
# the row access policy in Phase 5b, not by anything here. for_each instead of three
# near-identical resources: the roles are structurally identical, only their name
# differs, and which tenant_id maps to which role is the policy's job, not the role's.
resource "snowflake_account_role" "tenant" {
  for_each = toset(["A", "B", "C"])
  name     = "TENANT_${each.key}"
  comment  = "Client-facing role for Tenant ${each.key} - restricted to its own tenant by the row access policy (Phase 5b)."
}

locals {
  # REPORTER and the three TENANT_* roles all need the same baseline access (a
  # warehouse to query with, USAGE on the database/schema holding the marts) - only
  # REPORTER additionally gets SELECT on the tables themselves (below). Tenant roles
  # are deliberately withheld from table-level SELECT here: CLAUDE.md's "secure views
  # for anything client-facing" means they should only ever see the secure views built
  # in Phase 5d, never the raw mart tables directly.
  # for_each requires a set or map, not a list - concat() alone produces a list.
  reporting_roles = toset(concat(
    [snowflake_account_role.reporter.name],
    [for r in snowflake_account_role.tenant : r.name]
  ))
}

resource "snowflake_grant_privileges_to_account_role" "reporting_roles_on_bi_wh" {
  for_each          = local.reporting_roles
  account_role_name = each.value
  privileges        = ["USAGE"]
  on_account_object {
    object_type = "WAREHOUSE"
    object_name = snowflake_warehouse.bi_wh.name
  }
}

resource "snowflake_grant_privileges_to_account_role" "reporting_roles_on_analytics_prod_db" {
  for_each          = local.reporting_roles
  account_role_name = each.value
  privileges        = ["USAGE"]
  on_account_object {
    object_type = "DATABASE"
    object_name = snowflake_database.analytics_prod.name
  }
}

# PROD_MARTS is dbt's schema (created by TRANSFORMER on first build), not Terraform's -
# same "hand-created, reference as a string" situation as AIRBYTE/LEGACY/PROD.
resource "snowflake_grant_privileges_to_account_role" "reporting_roles_usage_on_prod_marts_schema" {
  for_each          = local.reporting_roles
  account_role_name = each.value
  privileges        = ["USAGE"]
  on_schema {
    schema_name = "\"ANALYTICS_PROD\".\"PROD_MARTS\""
  }
}

resource "snowflake_grant_privileges_to_account_role" "reporter_select_on_prod_marts_tables" {
  account_role_name = snowflake_account_role.reporter.name
  privileges        = ["SELECT"]
  on_schema_object {
    all {
      object_type_plural = "TABLES"
      in_schema          = "\"ANALYTICS_PROD\".\"PROD_MARTS\""
    }
  }
}

resource "snowflake_grant_privileges_to_account_role" "reporter_select_on_future_prod_marts_tables" {
  account_role_name = snowflake_account_role.reporter.name
  privileges        = ["SELECT"]
  on_schema_object {
    future {
      object_type_plural = "TABLES"
      in_schema          = "\"ANALYTICS_PROD\".\"PROD_MARTS\""
    }
  }
}

# VIEWS are a distinct grantable object type from TABLES in Snowflake - the "all/future
# TABLES" grants above don't cover the rpt_* secure views, which is exactly why this is
# separate. REPORTER + all three TENANT_* roles get this (unlike the TABLES grant,
# REPORTER-only above) - the secure views (Phase 5d) are the one thing tenant roles are
# actually meant to query; the raw fct_*/bdx_* tables are deliberately off-limits to
# them.
resource "snowflake_grant_privileges_to_account_role" "reporting_roles_select_on_prod_marts_views" {
  for_each          = local.reporting_roles
  account_role_name = each.value
  privileges        = ["SELECT"]
  on_schema_object {
    all {
      object_type_plural = "VIEWS"
      in_schema          = "\"ANALYTICS_PROD\".\"PROD_MARTS\""
    }
  }
}

resource "snowflake_grant_privileges_to_account_role" "reporting_roles_select_on_future_prod_marts_views" {
  for_each          = local.reporting_roles
  account_role_name = each.value
  privileges        = ["SELECT"]
  on_schema_object {
    future {
      object_type_plural = "VIEWS"
      in_schema          = "\"ANALYTICS_PROD\".\"PROD_MARTS\""
    }
  }
}

# --- Phase 7: Lightdash's Snowflake connection ---
#
# Reuses REPORTER rather than inventing a new role - "reads prod marts and semantic
# views, sees all tenants" is exactly what Lightdash's connection needs, and there's no
# reason for Lightdash to have its own narrower or broader access than any other
# internal reporting tool would.
resource "snowflake_service_user" "lightdash_svc" {
  name              = "LIGHTDASH_SVC"
  rsa_public_key    = var.lightdash_svc_public_key
  default_role      = snowflake_account_role.reporter.name
  default_warehouse = snowflake_warehouse.bi_wh.name
  comment           = "Lightdash's Snowflake connection. Database/schema are specified directly in Lightdash's own connection config, not here."
}

resource "snowflake_grant_account_role" "reporter_to_lightdash_svc" {
  role_name = snowflake_account_role.reporter.name
  user_name = snowflake_service_user.lightdash_svc.name
}

# --- Phase 5: governance objects (row access policy, PII masking) ---
#
# GOVERNANCE is its own database per CLAUDE.md's architecture, not bundled into
# ANALYTICS_PROD - policy/tag definitions are cross-cutting infrastructure, not dbt's
# own business-logic output, same reasoning as why Terraform (not dbt) owns databases
# and warehouses. PUBLIC is used directly (no custom schema) - same precedent as
# LEGACY.PUBLIC, reasonable for a single-purpose database this size.
resource "snowflake_database" "governance" {
  name    = "GOVERNANCE"
  comment = "Row access policy, masking policy and tag definitions - attached to data by dbt post-hooks, not created by dbt."
}

# One argument (tenant_id) is enough here - the policy body only needs to compare it
# against the calling role. is_role_in_session() (not CURRENT_ROLE() = ...) checks the
# whole role hierarchy, not just the literal active primary role - the right choice
# since TRANSFORMER/REPORTER being exempt roles are reached via role-to-role grants,
# not the task's own primary role.
resource "snowflake_row_access_policy" "tenant_access" {
  name     = "TENANT_ACCESS"
  database = snowflake_database.governance.name
  schema   = "PUBLIC"
  argument {
    name = "TENANT_ID"
    type = "NUMBER"
  }
  body    = <<-EOF
    case
      when is_role_in_session('TRANSFORMER') then true
      when is_role_in_session('REPORTER') then true
      when is_role_in_session('ACCOUNTADMIN') then true
      when is_role_in_session('TENANT_A') and tenant_id = 1 then true
      when is_role_in_session('TENANT_B') and tenant_id = 2 then true
      when is_role_in_session('TENANT_C') and tenant_id = 3 then true
      else false
    end
  EOF
  comment = "Tenant isolation: TRANSFORMER/REPORTER/ACCOUNTADMIN see every tenant, TENANT_A/B/C see only their own. Attached via dbt post-hook, not here - CREATE OR REPLACE TABLE (dbt's table materialization) doesn't reliably preserve an attached policy."
}

# Two masking policies, not one - a masking policy's argument type must match the
# column it's applied to, and this project's PII spans both VARCHAR (name, email,
# address) and DATE (date_of_birth) columns. Both get bound to the same tag below;
# Snowflake picks whichever policy's type matches the tagged column automatically.
resource "snowflake_masking_policy" "mask_pii_text" {
  name     = "MASK_PII_TEXT"
  database = snowflake_database.governance.name
  schema   = "PUBLIC"
  argument {
    name = "VAL"
    type = "VARCHAR"
  }
  body             = <<-EOF
    case
      when is_role_in_session('PII_READER') then val
      else '***MASKED***'
    end
  EOF
  return_data_type = "VARCHAR"
  comment          = "Masks VARCHAR PII (name, email, address) unless the session holds PII_READER."
}

resource "snowflake_masking_policy" "mask_pii_date" {
  name     = "MASK_PII_DATE"
  database = snowflake_database.governance.name
  schema   = "PUBLIC"
  argument {
    name = "VAL"
    type = "DATE"
  }
  body             = <<-EOF
    case
      when is_role_in_session('PII_READER') then val
      else null
    end
  EOF
  return_data_type = "DATE"
  comment          = "Masks DATE PII (date_of_birth) unless the session holds PII_READER."
}

# The tag is what actually persists across dbt's CREATE OR REPLACE TABLE runs: once a
# masking policy is bound to a tag (here, at tag-creation time via masking_policies),
# ANY column carrying that tag is protected automatically, including a column on a
# table that gets recreated tomorrow. Only the tag ASSIGNMENT itself (which column
# carries it) needs reapplying per dbt run - the binding to a policy does not.
resource "snowflake_tag" "pii" {
  name     = "PII"
  database = snowflake_database.governance.name
  schema   = "PUBLIC"
  comment  = "Applied to PII columns by a dbt post-hook. Bound to both masking policies - Snowflake matches by the tagged column's data type."
  masking_policies = [
    snowflake_masking_policy.mask_pii_text.fully_qualified_name,
    snowflake_masking_policy.mask_pii_date.fully_qualified_name,
  ]
}

# TRANSFORMER is who runs dbt's post-hooks, so it's the role that needs to actually
# attach these - APPLY is the real privilege name here (confirmed against Snowflake's
# GRANT reference), not "APPLY ROW ACCESS POLICY"/"APPLY TAG", which name a broader,
# account-wide privilege instead of a grant scoped to these specific objects.
resource "snowflake_grant_privileges_to_account_role" "transformer_usage_on_governance_db" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["USAGE"]
  on_account_object {
    object_type = "DATABASE"
    object_name = snowflake_database.governance.name
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_usage_on_governance_schema" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["USAGE"]
  on_schema {
    # Interpolated, not a bare string - unlike the AIRBYTE/LEGACY schema references
    # elsewhere in this file (which are genuinely external to this Terraform run),
    # GOVERNANCE.PUBLIC is created in this same apply, so this needs a real dependency
    # edge or Terraform has no reason to wait for the database to exist first.
    schema_name = "\"${snowflake_database.governance.name}\".\"PUBLIC\""
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_apply_row_access_policy" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["APPLY"]
  on_schema_object {
    object_type = "ROW ACCESS POLICY"
    object_name = snowflake_row_access_policy.tenant_access.fully_qualified_name
  }
}

resource "snowflake_grant_privileges_to_account_role" "transformer_apply_pii_tag" {
  account_role_name = snowflake_account_role.transformer.name
  privileges        = ["APPLY"]
  on_schema_object {
    object_type = "TAG"
    object_name = snowflake_tag.pii.fully_qualified_name
  }
}
