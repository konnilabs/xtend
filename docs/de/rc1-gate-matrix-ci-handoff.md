# RC1 Gate Matrix und CI-Handoff

Contract: `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`

Status: `accepted-rc1-gate-matrix-ci-handoff`

Workpackage: `WP-E13-13`

DPF-Paket: `DPF-WP-01-rc1-gate-matrix-ci-handoff`

## Ziel

Die RC1 Gate Matrix fasst die Epic-13-Evidence in einen lokalen, netzwerkfreien Handoff fuer CI Maintainer und Release Owner zusammen. Der Gate prueft nicht die produktiven Netzwerklaeufe selbst, sondern ob ihre Evidence-Pfade, Deferral-Regeln, Reports und Owner-Metadaten registriert sind.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff --json
npm run test:epic13-rc1-gate-matrix-ci-handoff
```

Der Report schreibt bei Aggregatlaeufen nach `.xtend-test-results/xtend-epic13-rc1-gate-matrix-ci-handoff-report.json` und nutzt `xtend.epic13.rc1-gate-matrix-ci-handoff-report.v1`.

## Source Gates

- `npm run test:epic13-rc1-readiness`
- `npm run test:epic13-release-owner-acceptance`
- `npm run test:epic13-conditional-network-evidence`
- `npm run test:epic13-package-export-lock`
- `npm run test:epic13-known-residual-triage`
- `npm run test:epic13-hydration-performance-closure`
- `npm run test:epic13-prod-browser-csp-smoke`
- `npm run test:epic13-visual-owner-artifact`
- `npm run test:epic13-rmt-production-readiness`
- `npm run test:epic13-docs-rmt-production-hardening`
- `npm run test:epic13-trusted-dom-boundary`
- `npm run test:epic13-rc1-migration-notes`

## CI Lanes

| Lane | Zweck | Report |
|------|-------|--------|
| `pr-fast` | PR Feedback mit TypeExports Drift-Handoff | `.xtend-test-results/xtend-pr-gate-report.json` |
| `rc1-full-release` | vollstaendige RC1 Release-Gate-Matrix | `.xtend-test-results/xtend-release-gate-report.json` |
| `conditional-network-evidence` | Audit/SBOM Execution oder Owner Deferral | `.xtend-test-results/xtend-conditional-network-evidence-report.json` |
| `owner-handoff` | Release-Owner-Schnitt fuer alle Epic-13-Gates | `.xtend-test-results/xtend-epic13-rc1-gate-matrix-ci-handoff-report.json` |

## Release Owner Evidence

[Release Report und Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md) ergaenzt den Handoff mit `xtend.epic13.release-report-pack-dry-run-evidence.v1` und schreibt `.xtend-test-results/xtend-epic13-release-report-pack-dry-run-evidence-report.json`.

[Conditional Network Evidence CI](./conditional-network-evidence-ci.md) ergaenzt den Handoff mit `xtend.epic13.conditional-network-evidence-ci.v1`, dem CI-Job `conditional-network-evidence` und `.xtend-test-results/xtend-epic13-conditional-network-evidence-ci-report.json`.

## Publish Boundary

`publishAllowed` bleibt `false`; `packagePrivateRequired` bleibt `true`. Netzwerkbasierte Gates duerfen lokal nur als `executed-or-owner-deferral` referenziert werden. `WP-E13-14` uebernimmt daraus den finalen Epic-13-Abschlussreview und RC1-Handoff.
