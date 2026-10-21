# Terraform / Ansible plan

## Terraform: provisions the platform
- Scope: one k3s namespace (`default`, unless Tom adds more), resource quotas, and service accounts for deploys.
- Workflow: terraform plan runs in the pipeline and is reviewed; apply runs only after approval.
- State: remote backend with locking. State files are never committed to Git (*.tfstate is in .gitignore).
- Forbidden: secrets in .tf files, publicly exposed databases, committed state.

## Ansible: configures what runs on the platform
- Scope: app configuration (ConfigMaps), environment variables, database users.
- Idempotence: running a playbook twice gives the same result. Example: a task that ensures ConfigMap `crm-api-config` exists with the expected values; the second run reports 0 changes. We check with `ansible-playbook --check` and by looking for `changed=0` on the second run.
- Secrets: Ansible Vault or CI secrets, never plaintext in the repo.

## In the pipeline (Lab 51)
- terraform plan and ansible-playbook --check run as pipeline stages.
- Nothing is applied to stage/prod without approval.