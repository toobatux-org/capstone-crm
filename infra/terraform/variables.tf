variable "environments" {
  description = "OpenShift Projects for each environment (see docs/environment-strategy.md)"
  type        = map(string)
  default = {
    dev   = "crm-dev"
    test  = "crm-test"
    stage = "crm-stage"
    prod  = "crm-prod"
  }
}

variable "quota_memory" {
  description = "Memory limit per Project"
  type        = string
  default     = "4Gi"
}

variable "quota_cpu" {
  description = "CPU limit per Project"
  type        = string
  default     = "2"
}
