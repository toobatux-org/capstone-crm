# Risk Register

**Stack:** Angular, Spring Boot, JWT, PostgreSQL, Kafka, k3s, Docker

---

## High-Priority Risks

### 1. K3s Out-of-Memory (OOM) Crashes
* **Risk:** High-memory apps (Spring Boot JVM, Kafka, Postgres) exceed node RAM, causing k3s to kill pods.
* **Impact:** App downtime or service outages.
* **Mitigation:** Define strict resource limits (`limits.memory` and `requests.memory`) for all pods. Set JVM `-XX:MaxRAMPercentage=75.0`.

### 2. PostgreSQL / Kafka Disk Space Exhaustion
* **Risk:** Kafka logs or Postgres transaction logs fill up the local disk.
* **Impact:** Database becomes read-only or corrupted.
* **Mitigation:** Set Kafka log retention limits (`log.retention.hours`). Monitor disk usage with alerts at 80% capacity.

---

## Medium-Priority Risks

### 3. Stolen or Invalidated JWT Tokens
* **Risk:** Storing JWTs in browser `localStorage` makes them vulnerable to XSS; tokens cannot be easily revoked once issued.
* **Impact:** Unauthorized user access.
* **Mitigation:** Use short token expiration times (10–15 mins) and store refresh tokens in `HttpOnly` cookies.

### 4. Kafka Consumer Timeouts & Duplicate Data
* **Risk:** Slow Spring Boot processing causes Kafka to think the app crashed and reassign message partitions.
* **Impact:** Duplicate event processing or lag.
* **Mitigation:** Keep message handlers fast, use async worker threads, and write idempotent database operations.

### 5. Silent Kafka Message Failures (Dead Letter Queue)
* **Risk:** Failed messages go to a dead-letter topic without anyone noticing.
* **Impact:** Data loss or out-of-sync UI.
* **Mitigation:** Add logging and alerts whenever a message fails or enters a Dead Letter Topic (DLT).

### 6. Vulnerable Docker Images
* **Risk:** Using outdated base images introduces security vulnerabilities.
* **Impact:** Security breaches.
* **Mitigation:** Use minimal base images (e.g., Alpine or Distroless) and scan images during CI/CD.

---

## Summary

| ID | Risk | Impact | Quick Fix |
|---|---|---|---|
| **R1** | K3s Memory Crashes | High | Set Pod resource limits & JVM caps |
| **R2** | Disk Full (Postgres/Kafka) | High | Retention rules & disk usage alerts |
| **R3** | JWT Exposure / Stale Auth | Medium | Short token TTLs & HttpOnly cookies |
| **R4** | Kafka Consumer Rebalances | Medium | Fast processing & idempotent queries |
| **R5** | Silent Kafka Failures | Medium | Alerting on Dead-Letter Topics |
| **R6** | Docker Vulnerabilities | Medium | Minimal base images & automated scans |
