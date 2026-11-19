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
