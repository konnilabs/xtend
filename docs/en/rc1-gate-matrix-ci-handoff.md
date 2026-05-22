# RC1 Gate Matrix and CI Handoff

Contract: `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`

Status: `accepted-rc1-gate-matrix-ci-handoff`

Workpackage: `WP-E13-13`

DPF package: `DPF-WP-01-rc1-gate-matrix-ci-handoff`

## Goal

The RC1 Gate Matrix bundles the Epic 13 evidence into a local, network-free handoff for CI maintainers and release owners. The gate does not check the productive network runs themselves, but whether their evidence paths, deferral rules, reports and owner metadata are registered.

## Local Gate

```bash
node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff --json
npm run test:epic13-rc1-gate-matrix-ci-handoff
```

The report writes to `.xtend-test-results/xtend-epic13-rc1-gate-matrix-ci-handoff-report.json` during aggregate runs and uses `xtend.epic13.rc1-gate-matrix-ci-handoff-report.v1`.

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

| Lane | Purpose | Report |
|------|---------|--------|
| `pr-fast` | PR feedback with TypeExports drift handoff | `.xtend-test-results/xtend-pr-gate-report.json` |
| `rc1-full-release` | complete RC1 release-gate matrix | `.xtend-test-results/xtend-release-gate-report.json` |
| `conditional-network-evidence` | audit/SBOM execution or owner deferral | `.xtend-test-results/xtend-conditional-network-evidence-report.json` |
| `owner-handoff` | release-owner interface for all Epic 13 gates | `.xtend-test-results/xtend-epic13-rc1-gate-matrix-ci-handoff-report.json` |

## Release Owner Evidence

[Release Report and Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md) adds `xtend.epic13.release-report-pack-dry-run-evidence.v1` to the handoff and writes `.xtend-test-results/xtend-epic13-release-report-pack-dry-run-evidence-report.json`.

[Conditional Network Evidence CI](./conditional-network-evidence-ci.md) adds `xtend.epic13.conditional-network-evidence-ci.v1`, the CI job `conditional-network-evidence` and `.xtend-test-results/xtend-epic13-conditional-network-evidence-ci-report.json` to the handoff.

## Publish Boundary

`publishAllowed` remains `false`; `packagePrivateRequired` remains `true`. Network-based gates may only be referenced locally as `executed-or-owner-deferral`. `WP-E13-14` takes over from here for the final Epic 13 closure review and RC1 handoff.
