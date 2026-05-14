# Release Report und Pack Dry Run Evidence

Contract: `xtend.epic13.release-report-pack-dry-run-evidence.v1`

Status: `accepted-release-report-pack-dry-run-evidence`

Workpackage: `DPF-WP-02-release-report-pack-dry-run`

## Ziel

Dieses Paket macht `release:report` und `pack:dry-run` zu reproduzierbarer Release-Owner-Evidence. Beide Befehle bleiben lokal und netzwerkfrei; Audit/SBOM, Public Publish und License-Entscheidung bleiben Folgepakete.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js epic13-release-report-pack-dry-run-evidence --json
npm run test:epic13-release-report-pack-dry-run-evidence
```

## Evidence-Befehle

```bash
npm run release:report
npm run pack:dry-run
```

`npm run release:report` schreibt `.xtend-test-results/xtend-release-report.json`.

`npm run pack:dry-run` schreibt:

- `.xtend-test-results/xtend-pack-dry-run.json`
- `.xtend-test-results/xtend-package-export-surface-lock.json`
- `.xtend-test-results/xtend-package-export-lock-report.json`

Der rohe npm-Textlauf bleibt ueber `npm run pack:dry-run:raw` erreichbar.

## RC1-Handoff

Die Evidence wird im RC1-Handoff unter `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` referenziert. Der DPF-WP-02-Report nutzt `.xtend-test-results/xtend-epic13-release-report-pack-dry-run-evidence-report.json` und uebergibt an `DPF-WP-03` [Conditional Network Evidence CI](./conditional-network-evidence-ci.md) mit `xtend.epic13.conditional-network-evidence-ci.v1`.
