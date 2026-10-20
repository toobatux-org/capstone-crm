terraform {
  required_version = ">= 1.6"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.31"
    }
  }

  # Remote state with locking goes here once the instructor provides a backend.
  # State is never committed to Git (*.tfstate is in .gitignore).
  # backend "s3" { ... }
}

# Cluster connection comes from environment variables at run time
# (KUBE_HOST, KUBE_TOKEN), set from GitHub Environment secrets. Nothing secret lives in this repo.
provider "kubernetes" {}
