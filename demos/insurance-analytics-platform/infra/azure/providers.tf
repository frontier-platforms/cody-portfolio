terraform {
  required_version = ">= 1.9"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # No remote backend: state is local (gitignored) for this practice project.
  # A team project would use an azurerm backend (a storage account + container) instead.
}

provider "azurerm" {
  features {}

  subscription_id = var.subscription_id

  # Deliberately no client_id/client_secret: auth comes from your local `az login`
  # session. Fine for one person running this by hand. A CI pipeline or a team would
  # use a service principal instead, with its secret in GitHub Actions secrets /
  # Key Vault, never in a file.
}
