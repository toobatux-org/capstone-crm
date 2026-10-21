output "projects" {
  description = "k3s namespaces managed by Terraform"
  value       = [for ns in kubernetes_namespace.crm : ns.metadata[0].name]
}
