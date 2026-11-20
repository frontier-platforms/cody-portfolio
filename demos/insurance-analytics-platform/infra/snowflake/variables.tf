variable "organization_name" {
  description = "Snowflake organization name (the first half of the org-account identifier)."
  type        = string
}

variable "account_name" {
  description = "Snowflake account name (the second half of the org-account identifier)."
  type        = string
}

variable "username" {
  description = "Snowflake username Terraform authenticates as. Key-pair auth only, never a password."
  type        = string
}

variable "private_key_path" {
  description = "Path to the PKCS#8 PEM private key file, kept outside this repo (e.g. ~/.snowflake/keys/snowflake_key.p8)."
  type        = string
}

variable "monitor_credit_quota" {
  description = "Credit quota the account-level resource monitor watches, per frequency period."
  type        = number
  default     = 20
}
