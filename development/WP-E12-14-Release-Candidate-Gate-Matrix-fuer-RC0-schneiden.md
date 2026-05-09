# WP-E12-14 - Release Candidate Gate Matrix fuer RC0 schneiden

- Status: `completed`
- Datum: 8. Mai 2026
- Workpackage Contract: `xtend.epic12.wp14.rc0-gate-matrix.v1`
- Produkt-Contract: `xtend.epic12.rc0-gate-matrix.v1`
- Report: `xtend.epic12.rc0-gate-matrix-report.v1`
- Known Residual Policy: `xtend.epic12.rc0-known-residual-policy.v1`
- Gate: `node scripts/run_xtend_tests.js rc0-gate-matrix --json`

## Ziel

WP-E12-14 schneidet die Gate-Kette fuer einen ersten lokalen Release Candidate `RC0`. Der Kandidat ist reviewbar, aber nicht publishbar. `private-until-release-owner-approval` bleibt unveraendert aktiv.

## Umgesetzte Artefakte

- `catalog/epic12-rc0-gate-matrix.js`
  - Factory `createEpic12Rc0GateMatrix()`
  - Validator `validateEpic12Rc0GateMatrix()`
  - Report Factory `createEpic12Rc0GateMatrixReport()`
- `tests/platform/epic12_rc0_gate_matrix_suite.js`
  - Contract-, Package-, Scaffold-, Docs-, Backlog-, RC-Modell- und Registry-Gate
- `development/XTend-RC0-Gate-Matrix.md`
  - akzeptierter RC0 Gate Matrix Contract
- `docs/rc0-gate-matrix.md`
  - Entwicklerdokumentation fuer RC0 Gate-Ausfuehrung
- `package.json`
  - Export `./catalog/epic12-rc0-gate-matrix`
  - Script `test:rc0-gate-matrix`
  - Metadata `xtend.rc0GateMatrix`
- `xtend-builder/scaffold.config.js`
  - Metadata `rc0GateMatrix`

## Gate-Schnitt

| Bereich | Status |
|---------|--------|
| PR Fast Gate | nutzt `npm run test:pr:report` |
| Full Release Gate | nutzt `npm run test:release:full:report` |
| Snapshot Gate | nutzt `component-shell-theme-matrix`, `visual-snapshot-automation`, `visual-snapshots`, `design-tokens` |
| RMT Authoring Gate | nutzt `rmt-shell-authoring-ux`, `rmt-first-class-app`, `rmt-first-demo-app`, `docs-rmt-pilot`, `rmt-dsl-authoring-polish` |
| Conditional Network Gates | `npm audit --audit-level=moderate`, `npm sbom --json` |
| Package Dry Run | `npm run pack:dry-run` |
| Known Residual Policy | keine Blocker, Publish bleibt gesperrt |

## Handoff

`WP-E12-15` startbar: Docs, Migration Notes und Enterprise Adoption Guide muessen die RC0 Gate Matrix aufnehmen.

## Akzeptanz

- RC0 Gate Chain ist dokumentiert und lokal testbar.
- Package- und Scaffold-Metadaten kennen `xtend.epic12.rc0-gate-matrix.v1`.
- Snapshot, RMT Authoring und Design Tokens sind explizite RC0-Teilpfade.
- Conditional Network Gates sind fuer Publish sichtbar, aber nicht Teil des lokalen Default-Gates.
- Publish bleibt bis Owner Acceptance blockiert.
