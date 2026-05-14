# XTend Epic 13 RC1 Gate Matrix und CI-Handoff

Schema: `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`

Report Schema: `xtend.epic13.rc1-gate-matrix-ci-handoff-report.v1`

Workpackage: `WP-E13-13`

DPF-Paket: `DPF-WP-01-rc1-gate-matrix-ci-handoff`

Status: `accepted-rc1-gate-matrix-ci-handoff`

## Zweck

Dieser Contract macht die RC1 Gate Matrix als maschinenlesbaren CI-Handoff sichtbar. Er aggregiert die Epic-13-Gates aus `WP-E13-01` bis `WP-E13-12`, verknuepft ihre Report-Pfade mit den CI-Lanes und haelt die Publish Boundary geschlossen.

## Gate Matrix

| Gate | Status im Handoff |
|------|-------------------|
| `npm run test:epic13-rc1-readiness` | required |
| `npm run test:epic13-release-owner-acceptance` | required |
| `npm run test:epic13-conditional-network-evidence` | required, lokal deferral-faehig |
| `npm run test:epic13-package-export-lock` | required |
| `npm run test:epic13-known-residual-triage` | required |
| `npm run test:epic13-hydration-performance-closure` | required |
| `npm run test:epic13-prod-browser-csp-smoke` | required |
| `npm run test:epic13-visual-owner-artifact` | required |
| `npm run test:epic13-rmt-production-readiness` | required |
| `npm run test:epic13-docs-rmt-production-hardening` | required |
| `npm run test:epic13-trusted-dom-boundary` | required |
| `npm run test:epic13-rc1-migration-notes` | required |

## CI Lanes

| Lane | Trigger | Evidence |
|------|---------|----------|
| `pr-fast` | Pull Request | `.xtend-test-results/xtend-pr-gate-report.json` |
| `rc1-full-release` | Release Candidate | `.xtend-test-results/xtend-release-gate-report.json` |
| `conditional-network-evidence` | Owner-approved Network | `.xtend-test-results/xtend-conditional-network-evidence-report.json` |
| `owner-handoff` | Release Owner Review | `.xtend-test-results/xtend-epic13-rc1-gate-matrix-ci-handoff-report.json` |

## Handoff Contract

- `localGateRequiresNetwork: false`
- `conditionalNetworkMode: executed-or-owner-deferral`
- `packDryRunReportRequired: true`
- `typeExportsReleaseGateRequired: true`
- `releaseReportPackDryRunEvidence: xtend.epic13.release-report-pack-dry-run-evidence.v1`
- `releaseReportPackDryRunEvidenceReport: .xtend-test-results/xtend-epic13-release-report-pack-dry-run-evidence-report.json`
- `publishAllowed: false`
- `packagePrivateRequired: true`
- `nextWorkpackage: WP-E13-14`
- `nextDecision: epic13-final-rc1-handoff`

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff --json
npm run test:epic13-rc1-gate-matrix-ci-handoff
```

Der Gate erzeugt bei Report-Aggregation `.xtend-test-results/xtend-epic13-rc1-gate-matrix-ci-handoff-report.json`.
