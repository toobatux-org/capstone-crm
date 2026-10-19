# System context — Northstar CRM

Service agents use Northstar CRM to find customers and record interactions.
Demo data is synthetic only: CUS-1001 Amina Khan (ACTIVE), CUS-1002 Ravi Singh (PROSPECT), CUS-9999 (not found).

```mermaid
flowchart TB
  agent["Service agent<br/>(role AGENT)"]
  admin["Administrator<br/>(role ADMIN)"]
  subgraph trust["Northstar CRM (trusted zone, OpenShift)"]
    crm["Northstar CRM<br/>search customers, view timeline,<br/>record interactions"]
  end
  idp["Token issuer<br/>(issues JWTs)"]
  gh["GitHub + Actions<br/>build, scan, deploy"]
  agent -->|"HTTPS via browser"| crm
  admin -->|"HTTPS via browser"| crm
  agent -.->|"sign in, get JWT"| idp
  crm -.->|"validates JWT"| idp
  gh -->|"deploys image by digest"| crm
```

**Trust boundaries**
- Browser to OpenShift Route: untrusted. Every API call needs a valid JWT; the API, not Angular, enforces roles.
- Inside the OpenShift Project: API, PostgreSQL and Kafka talk on the cluster network; credentials come from OpenShift Secrets.
- GitHub to OpenShift: only the CD workflow deploys, using Environment secrets and an approval gate.
