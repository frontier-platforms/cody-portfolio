terraform {
  required_version = ">= 1.9"

  required_providers {
    snowflake = {
      source  = "snowflakedb/snowflake"
      version = "~> 2.23"
    }
  }
}

provider "snowflake" {
  organization_name = var.organization_name
  account_name       = var.account_name
  user               = var.username

  # Key-pair auth, never a password: `authenticator = "SNOWFLAKE_JWT"` tells the
  # provider to sign a JWT with this private key instead. `pathexpand` resolves a
  # leading `~` in the path, which Terraform's `file()` alone does not do.
  authenticator = "SNOWFLAKE_JWT"
  private_key   = file(pathexpand(var.private_key_path))

  role = "ACCOUNTADMIN"
}
