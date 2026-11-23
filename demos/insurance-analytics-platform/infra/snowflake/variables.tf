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

variable "airbyte_svc_public_key" {
  description = "RSA public key body (no PEM header/footer, no newlines) for the airbyte_svc service user's key-pair auth. Not secret - this is the half that's designed to be shared - but kept out of .tf code since it's a real deployed value, not an example."
  type        = string
}

variable "lightdash_svc_public_key" {
  description = "RSA public key body (no PEM header/footer, no newlines) for the lightdash_svc service user's key-pair auth."
  type        = string
}
