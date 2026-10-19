output "projects" {
  description = "OpenShift Projects managed by Terraform"
  value       = [for ns in kubernetes_namespace.crm : ns.metadata[0].name]
}
