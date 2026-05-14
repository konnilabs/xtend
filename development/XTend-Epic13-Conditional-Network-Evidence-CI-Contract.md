# XTend Epic 13 Conditional Network Evidence CI Contract

Schema: `xtend.epic13.conditional-network-evidence-ci.v1`

Report Schema: `xtend.epic13.conditional-network-evidence-ci-report.v1`

Workpackage: `DPF-WP-03-conditional-network-evidence-ci`

Status: `accepted-conditional-network-evidence-ci`

## Zweck

Dieser Contract macht `npm audit --audit-level=moderate` und `npm sbom --json` als CI-/Release-Evidence produktiv. Er baut auf `xtend.epic13.conditional-network-evidence.v1` und `xtend.epic13.release-report-pack-dry-run-evidence.v1` auf.

## CI Evidence

| Evidence | CI Command | Artefakt |
| --- | --- | --- |
| Audit | `npm audit --audit-level=moderate --json` | `.xtend-test-results/xtend-npm-audit-report.json` |
| SBOM | `npm sbom --json` | `.xtend-test-results/xtend-npm-sbom.json` |
| Aggregat | `npm run conditional-network:evidence` | `.xtend-test-results/xtend-conditional-network-evidence-report.json` |

Der Workflow-Job `conditional-network-evidence` in `.github/workflows/xtend-default-gates.yml` setzt `XTEND_CONDITIONAL_NETWORK_EXECUTE=1`, fuehrt `npm run conditional-network:evidence` aus und laedt `xtend-conditional-network-evidence-node-26` hoch.

## Deferral

Wenn Netzwerk, Registry oder Sandbox die Ausfuehrung blockieren, schreibt `scripts/capture_conditional_network_evidence.js` Records mit `xtend.epic13.conditional-network-deferral.v1`. Erlaubte Gruende bleiben `network-restricted-local-default`, `sandbox-network-unavailable`, `registry-auth-unavailable` und `owner-approved-offline-run`.

## Grenzen

Dieses Paket repariert keine Dependencies, bewertet keine konkreten Vulnerabilities und oeffnet keine Publish Boundary. Es stellt nur sicher, dass CI und Release Owner die Evidence oder das Deferral maschinenlesbar vorfinden.

## Gate

```bash
node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci --json
npm run test:epic13-conditional-network-evidence-ci
```
