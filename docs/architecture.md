# Northstar CRM architecture

Service agents record customer interactions. The Angular app calls a REST API. Spring Boot saves the interaction in PostgreSQL, then publishes a versioned Kafka event. GitHub Actions builds a Docker image and k3s runs it. Terraform and Ansible describe the infrastructure.

A teammate should be able to read this page in five minutes and know what we are building.

## Stack

| Concern | Choice |
| --- | --- |
| UI | Angular |
| API | REST on Spring Boot |
| System of record | PostgreSQL |
| Events | Kafka, after the database save commits |
| Image | Docker |
| Runtime platform | k3s |
| CI/CD | GitHub Actions |
| Infrastructure | Terraform and Ansible |

## Runtime path

Angular → REST → Spring Boot → PostgreSQL.

Spring Boot publishes to Kafka only after that PostgreSQL save commits. Kafka does not replace the database.

## Delivery path

GitHub → GitHub Actions (security scan, test, build) → Docker image (by digest) → k3s.

## Non-goals

This project does not use Bitbucket Pipelines, Oracle, React, or SOAP.

## ADR-001 — PostgreSQL

**Decision:** PostgreSQL is the system of record for customers and interactions.

**Why:** The capstone data path is Spring Boot with relational storage. Customers and interactions are rows we can migrate and query.

**Rejected:** Oracle.

## ADR-002 — Save, then publish

**Decision:** The Kafka event is sent only after the interaction row commits in PostgreSQL. The event is `CustomerInteractionRecordedV1` on topic `crm.customer.interactions.v1`, keyed by customer ID, and includes an `eventId` so consumers can skip duplicates.

**Why:** PostgreSQL is the source of truth. A consumer must not see an event for a save that rolled back. If publishing fails after the commit, the row stays saved and the failure is logged with the correlation ID; the lost event is an accepted risk in the risk register.

**Rejected:** Publishing before the commit, and using Kafka as the store instead of PostgreSQL.

## ADR-003 — GitHub Actions

**Decision:** GitHub Actions builds and tests the Angular app and the Spring Boot API, then builds the Docker image once; k3s deploys that exact image by digest.

**Why:** The repository is on GitHub, and Actions is the capstone delivery path from commit to image.

**Rejected:** Bitbucket Pipelines.

## ADR-004 — Deploy to k3s

**Decision:** Deploy to k3s.

**Why:** No OpenShift access.

**Rejected:** Waiting on OpenShift.

**Consequences:** Ingress instead of Route, kubectl instead of oc, manifests in deploy/k3s/.
