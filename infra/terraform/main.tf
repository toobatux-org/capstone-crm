# One namespace (OpenShift Project) per environment
resource "kubernetes_namespace" "crm" {
  for_each = var.environments

  metadata {
    name = each.value
    labels = {
      app         = "northstar-crm"
      environment = each.key
    }
  }
}

# Resource quota so one environment cannot starve the others
resource "kubernetes_resource_quota" "crm" {
  for_each = var.environments

  metadata {
    name      = "crm-quota"
    namespace = kubernetes_namespace.crm[each.key].metadata[0].name
  }

  spec {
    hard = {
      "limits.memory" = var.quota_memory
      "limits.cpu"    = var.quota_cpu
      "pods"          = "10"
    }
  }
}

# Service account the CD workflow uses to deploy
resource "kubernetes_service_account" "deployer" {
  for_each = var.environments

  metadata {
    name      = "crm-deployer"
    namespace = kubernetes_namespace.crm[each.key].metadata[0].name
  }
}
