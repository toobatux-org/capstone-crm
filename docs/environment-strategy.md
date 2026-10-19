# Environment strategy

| Env | OpenShift Project | Who can deploy | Approval | Config source | Data |
|---|---|---|---|---|---|
| dev | crm-dev | Any team member via CD | None | ConfigMap / Secret | Synthetic fixtures |
| test | crm-test | CD workflow | Optional | ConfigMap / Secret | Synthetic fixtures |
| stage | crm-stage | CD workflow | Required (GitHub Environment) | ConfigMap / Secret | Synthetic fixtures |
| prod | crm-prod | CD workflow | Required (GitHub Environment) | ConfigMap / Secret | No demo fixtures |

Local development uses Docker Compose (Angular, Spring Boot, PostgreSQL, Kafka).

## Promotion rules
- Order: local → CI → dev → test → stage → prod. Never skip or go backward.
- The same image digest moves through every environment. Only ConfigMap and Secret values change.
- No laptop-built image is ever a release.

## Moving from stage to prod requires
- Green smoke test in stage (readiness + CUS-1001 call with lab-request-001)
- Approval in the GitHub Environment
- Rollback rehearsed (oc rollout undo to the previous digest)

## Data rule
Only synthetic fixtures (CUS-1001 Amina, CUS-1002 Ravi, CUS-9999) exist below prod. No real customer data anywhere.