# Release Report and Pack Dry Run Evidence

Contract: `xtend.epic13.release-report-pack-dry-run-evidence.v1`

Status: `accepted-release-report-pack-dry-run-evidence`

Workpackage: `DPF-WP-02-release-report-pack-dry-run`

## Goal

This package turns `release:report` and `pack:dry-run` into reproducible release-owner evidence. Both commands remain local and network-free; audit/SBOM, public publish and the license decision remain follow-up packages.

## Local Gate

```bash
node scripts/run_xtend_tests.js epic13-release-report-pack-dry-run-evidence --json
npm run test:epic13-release-report-pack-dry-run-evidence
```

## Evidence Commands

```bash
npm run release:report
npm run pack:dry-run
```

`npm run release:report` writes `.xtend-test-results/xtend-release-report.json`.

`npm run pack:dry-run` writes:

- `.xtend-test-results/xtend-pack-dry-run.json`
- `.xtend-test-results/xtend-package-export-surface-lock.json`
- `.xtend-test-results/xtend-package-export-lock-report.json`

The raw npm text run remains available through `npm run pack:dry-run:raw`.

## RC1 Handoff

The evidence is referenced in the RC1 handoff under `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`. The DPF-WP-02 report uses `.xtend-test-results/xtend-epic13-release-report-pack-dry-run-evidence-report.json` and hands off to `DPF-WP-03` [Conditional Network Evidence CI](./conditional-network-evidence-ci.md) with `xtend.epic13.conditional-network-evidence-ci.v1`.
