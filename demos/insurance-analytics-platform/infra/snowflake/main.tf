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
