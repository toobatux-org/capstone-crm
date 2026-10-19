# Northstar CRM architecture

Service agents record customer interactions. The Angular app calls a REST API. Spring Boot saves the interaction in PostgreSQL, then publishes a versioned Kafka event. GitHub Actions builds a Docker image and OpenShift runs it. Terraform and Ansible describe the infrastructure.

A teammate should be able to read this page in five minutes and know what we are building.

## Stack

| Concern | Choice |
| --- | --- |
| UI | Angular |
| API | REST on Spring Boot |
| System of record | PostgreSQL |
| Events | Kafka, after the database save commits |
| Image | Docker |
| Runtime platform | OpenShift |
| CI/CD | GitHub Actions |
| Infrastructure | Terraform and Ansible |

## Runtime path

Angular → REST → Spring Boot → PostgreSQL.

Spring Boot publishes to Kafka only after that PostgreSQL save commits. Kafka does not replace the database.

## Delivery path

GitHub → GitHub Actions (test and build) → Docker image → OpenShift.

## Non-goals

This project does not use Bitbucket Pipelines, Oracle, React, or SOAP.

## ADR-001 — PostgreSQL

**Decision:** PostgreSQL is the system of record for customers and interactions.

**Why:** The capstone data path is Spring Boot with relational storage. Customers and interactions are rows we can migrate and query.

**Rejected:** Oracle.

## ADR-002 — Save, then publish

**Decision:** The Kafka event is sent only after the interaction row commits in PostgreSQL. The event is `CustomerInteractionRecorded` version 1.

**Why:** PostgreSQL is the source of truth. A consumer must not see an event for a save that rolled back. If publishing fails after the commit, the row remains and the publish can be retried.

**Rejected:** Publishing before the commit, and using Kafka as the store instead of PostgreSQL.

## ADR-003 — GitHub Actions

**Decision:** GitHub Actions builds and tests the Angular app and the Spring Boot API, then produces the Docker image that OpenShift runs.

**Why:** The repository is on GitHub, and Actions is the capstone delivery path from commit to image.

**Rejected:** Bitbucket Pipelines.
