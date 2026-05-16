# Epic 12 RC0 Handoff

- Contract: `xtend.epic12.rc0-handoff.v1`
- Report: `xtend.epic12.rc0-handoff-report.v1`
- Workpackage: `WP-E12-16`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic12-rc0-handoff --json`
- Entscheidung: `ready-for-release-owner-review-not-publish`

Epic 12 ist abgeschlossen. XTend besitzt nun einen konkreten RC0-Pfad fuer Release Owner Review, ohne die Publish Boundary zu oeffnen.

## Was RC0 enthaelt

| Bereich | Stand |
|---------|-------|
| Long-Tail | `x-tabs`, `x-theme`, `x-button`, `x-menu` geschlossen |
| Boundary Residuals | `xstate`, `x-utils`, `xtend.component.hydrate` akzeptiert und sichtbar |
| Visual Snapshot | DOM-first Runner mit JSON-Baseline |
| Design Tokens | `--xtend-*` Produkt-Tokenlinie |
| RMT DSL | Authoring Polish fuer Shells, Routes, Links, Slots, Commands, Hydration und Lanes |
| Docs | RC0 Adoption Guide und Migration Notes aktuell |
| Release Gate | RC0 Gate Matrix lokal ausfuehrbar |

## Owner Review

Vor einer Publish-Entscheidung braucht der Release Owner:

- Full Release Gate Report
- RC0 Gate Matrix Report
- Epic 12 RC0 Handoff Report
- Package Dry Run Ausgabe
- Conditional Network Gate Status
- Known Residual Policy
- Migration Notes
- Publish Boundary Entscheidung

## Lokale Gates

```bash
node scripts/run_xtend_tests.js epic12-rc0-handoff --json
node scripts/run_xtend_tests.js epic12-docs-adoption --json
node scripts/run_xtend_tests.js rc0-gate-matrix --json
npm run test:release:full:report
npm run pack:dry-run
```

Conditional Network Gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

## Publish Boundary

`private-until-release-owner-approval` bleibt aktiv. Ein gruener RC0-Handoff bedeutet:

```text
ready-for-release-owner-review-not-publish
```

Die naechste Entscheidung ist `release-owner-acceptance`.
