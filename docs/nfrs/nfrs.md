# Non-functional requirements

Each NFR has a measurable target and a way to prove it.

| ID | Area | Requirement | Target | How we verify |
|---|---|---|---|---|
| NFR-1 | Security | Every API call needs a valid JWT; roles enforced | 401 without token, 403 wrong role, 100% of endpoints | Spring Security negative tests |
| NFR-2 | Security | No secrets in Git | 0 secrets found | Secret scan in CI + manual check before archive |
| NFR-3 | Traceability | Correlation ID flows end to end | lab-request-001 visible in API log, DB row and Kafka event | Demo + log/SQL/event check |
| NFR-4 | Performance | Creating an interaction is fast | p95 < 500 ms for POST on local/stage | Timed curl loop or test |
| NFR-5 | Reliability | Duplicate events don't double-process | 0 duplicate side effects for repeated eventId | Consumer test with same eventId twice |
| NFR-6 | Recoverability | Bad release can be undone quickly | Rollback to previous digest in < 5 min | Rehearsed `kubectl rollout undo` |
| NFR-7 | Operability | Health is observable | Readiness/liveness probes pass; Actuator health UP | k3s probes + smoke test |
| NFR-8 | Quality | Build is green and repeatable | `mvn clean verify` and `ng build` pass twice in a row | CI runs |