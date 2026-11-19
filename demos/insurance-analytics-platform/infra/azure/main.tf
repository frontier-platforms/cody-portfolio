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

resource "azurerm_postgresql_flexible_server" "main" {
  name                = var.postgres_server_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  version  = "16"
  sku_name = "B_Standard_B1ms" # smallest Burstable tier that's comfortable running CDC's extra WAL overhead

  storage_mb        = 32768 # 32 GiB: the minimum/default. Storage can only be scaled up later, never down.
  auto_grow_enabled = false # cost guardrail: no silent storage growth

  administrator_login    = var.postgres_admin_login
  administrator_password = var.postgres_admin_password

  # No private networking set up for this practice project, so this stays true; the
  # firewall rule below is what actually restricts who can reach it.
  public_network_access_enabled = true

  tags = {
    project = "insurance-analytics-platform"
    purpose = "practice"
  }

  # Azure auto-assigns a zone at creation time since we don't pin one. Without this,
  # Terraform tries to "correct" it back toward unset on the next plan/apply, which
  # Azure's API rejects (zone changes have special pairing rules with HA standby).
  lifecycle {
    ignore_changes = [zone]
  }
}

# Airbyte's CDC (logical replication) needs this above Postgres's default. Changing a
# "static" parameter like this makes Azure restart the server automatically.
resource "azurerm_postgresql_flexible_server_configuration" "wal_level" {
  name      = "wal_level"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "logical"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "my_ip" {
  name             = "allow-my-ip"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = var.my_ip_address
  end_ip_address   = var.my_ip_address
}

# The app's own database, separate from the default "postgres" maintenance database
# that comes with every server. Deliberately no `prevent_destroy` here - this project
# tears everything down with `terraform destroy` in the wrap-up phase, and that flag
# would block exactly that.
resource "azurerm_postgresql_flexible_server_database" "insurance" {
  name      = "insurance"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
