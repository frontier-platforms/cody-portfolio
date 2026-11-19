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
