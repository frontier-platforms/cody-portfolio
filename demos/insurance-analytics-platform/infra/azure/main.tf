resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    project = "insurance-analytics-platform"
    purpose = "practice"
  }
}

# Cost guardrail: email when spend crosses 50/80/100% of the monthly amount.
resource "azurerm_consumption_budget_resource_group" "main" {
  name              = "budget-insurance-analytics"
  resource_group_id = azurerm_resource_group.main.id

  amount     = var.budget_amount
  time_grain = "Monthly"

  time_period {
    # Azure requires the first day of a month. This computes "today's month" so the
    # budget is valid whenever `apply` first runs; ignore_changes below stops every
    # later `plan` from showing a diff just because today's date moved on.
    start_date = formatdate("YYYY-MM-01'T'00:00:00Z", timestamp())
  }

  notification {
    enabled        = true
    threshold      = 50
    operator       = "GreaterThan"
    contact_emails = [var.budget_alert_email]
  }

  notification {
    enabled        = true
    threshold      = 80
    operator       = "GreaterThan"
    contact_emails = [var.budget_alert_email]
  }

  notification {
    enabled        = true
    threshold      = 100
    operator       = "GreaterThan"
    contact_emails = [var.budget_alert_email]
  }

  lifecycle {
    ignore_changes = [time_period]
  }
}
