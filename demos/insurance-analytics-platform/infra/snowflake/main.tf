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
