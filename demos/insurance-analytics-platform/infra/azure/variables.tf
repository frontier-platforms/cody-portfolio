variable "subscription_id" {
  description = "Azure subscription to deploy into (from `az account show`). Not a secret, but kept out of versioned code so the project doesn't assume one person's subscription."
  type        = string
}

variable "location" {
  description = "Azure region. Pinned to Canada for the residency requirement."
  type        = string
  default     = "canadacentral"
}

variable "resource_group_name" {
  description = "Name of the resource group everything in this project lives in."
  type        = string
  default     = "rg-insurance-analytics"
}

variable "budget_amount" {
  description = "Monthly spend threshold (CAD) that the budget alert watches."
  type        = number
  default     = 25
}

variable "budget_alert_email" {
  description = "Where budget threshold emails go."
  type        = string
}

variable "postgres_server_name" {
  description = "Globally-unique DNS name for the Postgres server (part of <name>.postgres.database.azure.com). If this collides with someone else's server worldwide, Azure rejects it with a clear error - just pick a different name."
  type        = string
  default     = "psql-insurance-analytics"
}

variable "postgres_admin_login" {
  description = "Administrator login for the Postgres flexible server. Only used for initial setup, not day-to-day app access."
  type        = string
  default     = "pgadmin"
}

variable "postgres_admin_password" {
  description = "Administrator password for the Postgres flexible server. Must come from terraform.tfvars (gitignored) or the TF_VAR_postgres_admin_password env var - never hardcoded."
  type        = string
  sensitive   = true
}

variable "my_ip_address" {
  description = "Your current public IP (e.g. from `curl -s https://ifconfig.me`), allowed through the Postgres firewall. Home ISPs reassign IPs sometimes - if connections start failing later, this is the first thing to check."
  type        = string
}
