variable "environments" {
  description = "k3s namespaces (see docs/environment-strategy.md). One namespace, default, unless Tom adds more."
  type        = map(string)
  default = {
    dev   = "crm-dev"
    test  = "crm-test"
    stage = "crm-stage"
    prod  = "crm-prod"
  }
}

variable "quota_memory" {
  description = "Memory limit per namespace"
  type        = string
  default     = "4Gi"
}

variable "quota_cpu" {
  description = "CPU limit per namespace"
  type        = string
  default     = "2"
}
