# Capstone backlog — Northstar CRM

Full task list lives on the Jira board. This file freezes the stories Labs 49–51 build against.

Fixtures (synthetic only): CUS-1001 Amina Khan (ACTIVE), CUS-1002 Ravi Singh (PROSPECT), CUS-9999 (not found). Correlation ID for demos: lab-request-001.

---

## CAP-12 — Record customer interaction
**Priority:** Highest · **Lab:** 49 (backend), 50 (UI) · **Owners:** Evan (API), Ian (DB + Kafka), Payton (UI)

**As** a service agent
**I want** to record an interaction for a customer
**So that** it is saved in PostgreSQL and other systems are notified through Kafka.

**Acceptance criteria**
1. Given ACTIVE customer CUS-1001, when I POST `/api/v1/interactions` with type NOTE, a summary, and header `X-Correlation-ID: lab-request-001`, then I get **201** and the interaction in the response body.
2. The interaction row exists in PostgreSQL with correlation ID `lab-request-001`.
3. Exactly one `CustomerInteractionRecordedV1` event is published to `crm.customer.interactions.v1`, keyed by `CUS-1001`, with an `eventId` and correlation ID `lab-request-001`. It is published only after the save commits.
4. Given CUS-9999, I get **404** (Problem Details), nothing is saved, and no event is published.
5. Given an invalid type or an empty summary, I get **400** (Problem Details), nothing is saved, and no event is published.

---

## CAP-13 — View interaction timeline in Angular
**Priority:** High · **Lab:** 50 · **Owner:** Payton
**As** an agent **I want** to search for a customer and see their interactions newest first **so that** I know their history before I call.
**Acceptance**
1. Searching "Amina" or "CUS-1001" shows Amina; opening her profile shows her interactions, newest first.
2. CUS-9999 shows a "customer not found" message.
3. Loading, error and empty states are shown.

## CAP-14 — Sign in and protect the API with JWT
**Priority:** Highest · **Lab:** 50–51 · **Owners:** Tom (API), Payton (Angular)
**As** the business **I want** only signed-in agents to use the CRM **so that** customer data is protected.
**Acceptance**
1. Unauthenticated users are redirected to the login page in Angular.
2. API calls without a token return **401**; a token without the right role returns **403**.
3. The Angular interceptor attaches the token; no component sets headers by hand.

## CAP-15 — Interaction table via Flyway
**Priority:** Highest · **Lab:** 49 · **Owner:** Ian
**As** the team **I want** the schema created by Flyway migrations **so that** every environment has the same database.
**Acceptance**
1. Migrations create `customer` and `customer_interaction` with a foreign key and an index on `(customer_id, created_at)`.
2. CUS-1001 and CUS-1002 are seeded.
3. The app starts with `ddl-auto: validate` against an empty database.

## CAP-16 — Pull request quality gate in GitHub Actions
**Priority:** High · **Lab:** 51 · **Owner:** Evan
**As** the team **I want** every PR built and tested automatically **so that** broken code can't merge.
**Acceptance**
1. PRs run the Angular job (npm ci, ng test, ng build), the Maven job (mvn verify) and a SAST scan.
2. A red job blocks the merge.

## CAP-17 — Deploy to OpenShift and smoke test
**Priority:** High · **Lab:** 51 · **Owners:** Aiden (deploy), Tom (manifests + smoke)
**As** the team **I want** the tested image deployed by digest and checked automatically **so that** we know the release works and can roll it back.
**Acceptance**
1. CD deploys the recorded image digest to OpenShift after approval; it does not rebuild.
2. Smoke test through the Route: readiness passes, and a CUS-1001 call with lab-request-001 succeeds.
3. Rollback to the previous digest (`oc rollout undo`) has been rehearsed once.

---

## Peer review
| Reviewer | Date | Docs checked | Notes | Result |
|---|---|---|---|---|
| _name_ | _date_ | architecture.md, architecture/, ai-usage-plan, github-actions-plan, terraform-ansible-plan, environment-strategy, nfrs, risk-register, backlog | _issues found / fixed_ | Approved / Changes needed |