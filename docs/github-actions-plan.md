# GitHub Actions plan

Two workflows: `capstone-ci.yml` (build, test, scan) and `capstone-cd.yml` (deploy).
Rule: build the image once, then promote the same digest. Deploy jobs never rebuild.

| Trigger | Jobs | Deploys? | Evidence kept |
|---|---|---|---|
| pull_request | frontend: npm ci, ng test (headless), ng build --configuration=production · backend: mvn -B verify · scan: SAST + dependency scan | No | Test reports, scan reports |
| push to main | Same as PR, then build API + UI images once, scan images, record digests | No | Image digests, image scan report |
| tag v* / manual | capstone-cd: deploy recorded digest to OpenShift, then smoke test | Yes, after approval | Deploy log, smoke result |

## Gates
- PR cannot merge unless frontend, backend and scan jobs are green (branch protection).
- Critical SAST or image findings block the deploy unless written up as a residual risk with owner and date.
- Deploy to stage/prod requires approval through a GitHub Environment.

## Owners
| Area | Owner |
|---|---|
| capstone-ci.yml (Angular, Maven, SAST) | Evan |
| Dockerfiles, image build/scan, digest, capstone-cd.yml | Aiden |
| OpenShift manifests, smoke test, rollback | Tom |

## Secrets
Registry and OpenShift credentials live in GitHub Environment secrets (or OIDC). Docs list secret names only. No step prints a secret.