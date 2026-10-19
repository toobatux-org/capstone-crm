# AI usage plan

## Allowed

* Boilerplate: Angular components and services, Spring DTOs, records, repositories and controller skeletons.
* Test drafts: JUnit, MockMvc and Angular specs, using synthetic fixtures only (CUS-1001, CUS-1002, CUS-9999).
* IaC sketches: Terraform HCL, Ansible tasks, OpenShift YAML and GitHub Actions workflows. A person reviews them with `terraform plan` or `ansible-playbook --check` before anything is applied.
* SQL drafts: Flyway migrations and queries.
* Explanations: error messages, stack traces and first drafts of docs.

## Must verify

- [ ] Angular changes compile and match DTOs
- [ ] Flyway/SQL reviewed for PostgreSQL correctness
- [ ] No secrets introduced

## Forbidden

* Committing secrets or kubeconfig
* Applying Terraform/Ansible to prod without approval
* Copying proprietary third-party code