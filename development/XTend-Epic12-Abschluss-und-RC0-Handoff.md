# XTend Epic 12 Abschluss und RC0 Handoff

- Status: Accepted
- Datum: 8. Mai 2026
- Contract: `xtend.epic12.rc0-handoff.v1`
- Report: `xtend.epic12.rc0-handoff-report.v1`
- Workpackage: `WP-E12-16`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic12-rc0-handoff --json`
- Release Candidate: `RC0`
- Entscheidung: `ready-for-release-owner-review-not-publish`
- Publish Boundary: `private-until-release-owner-approval`

## Zweck

Dieses Dokument schliesst Epic 12 fachlich ab und bereitet den RC0-Handoff fuer Release Owner vor. Der Handoff sammelt KPI-Abnahme, Long-Tail-Status, Snapshot-Status, Design Tokens, RMT DSL Polish, RC0 Gate Matrix, Docs Adoption, Restrisiken und Publish Boundary in einem reviewbaren Entscheidungsstand.

RC0 ist kein Publish. XTend bleibt `private: true`, bis Release Owner Gate-Artefakte, Conditional Network Gates, Package Dry Run, Migration Notes, Known Residual Policy und License-/Publish-Entscheidung explizit akzeptieren.

## KPI-Abnahme

| KPI | Ergebnis | Evidenz |
|-----|----------|---------|
| `x-tabs` Performance Profile | erreicht | `WP-E12-02`, `WP-E12-03` |
| `x-theme` A11y und Performance | erreicht | `WP-E12-04`, `WP-E12-05` |
| `x-button` Interaction Budget | erreicht | `WP-E12-06` |
| `x-menu` Keyboard und Router-Kompatibilitaet | erreicht | `WP-E12-07` |
| `xstate` Boundary Probe | akzeptiertes Residual | `WP-E12-08`, Known Residual Policy |
| `x-utils` Utility Boundary | akzeptiertes Residual | `WP-E12-09`, Known Residual Policy |
| Visual Snapshot Gate | erreicht | `WP-E12-10`, `WP-E12-11` |
| Design Tokens | erreicht | `WP-E12-12` |
| RMT DSL Authoring Polish | erreicht | `WP-E12-13` |
| RC0 Gate Matrix | erreicht | `WP-E12-14` |
| Docs und Migration Notes | erreicht | `WP-E12-15` |

## Long-Tail-Status

Geschlossen:

- `x-tabs`
- `x-theme`
- `x-button`
- `x-menu`

Akzeptiert fuer RC0:

- `xstate` als nicht-visuelle Boundary-Probe
- `x-utils` als Utility-Boundary
- `xtend.component.hydrate` als Performance-Warnung unter Fail-Schwelle

Diese Punkte sind keine Blocker fuer den lokalen RC0 Review, muessen aber im Owner Review sichtbar bleiben.

## Snapshot-Status

Der Snapshot-Pfad ist DOM-first und lokal:

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation --json
node scripts/run_xtend_tests.js visual-snapshots --json
node scripts/run_xtend_tests.js design-tokens --json
```

Pixel-Baselines bleiben optional lokal. Die RC0-Baseline ist `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`.

## RC0 Gate Matrix

Pflichtgates fuer den Handoff:

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

Wenn Netzwerkzugriff nicht verfuegbar ist, muss der Owner-Handoff die Deferral dokumentieren. Publishing bleibt blockiert.

## Owner Review Inputs

- `xtend-release-gate-report`
- `xtend-rc0-gate-matrix-report`
- `xtend-epic12-rc0-handoff-report`
- Package Dry Run Ausgabe
- Conditional Network Gate Status
- Known Residual Policy
- Migration Notes aus `docs/rc0-adoption-guide.md`
- Publish Boundary Entscheidung

## Restrisiken

| Risiko | Status | Entscheidung |
|--------|--------|--------------|
| Conditional Network Gates lokal nicht ausgefuehrt | owner-review-required | Publish bleibt blockiert |
| `xstate` nicht visuell enterprise-ready | accepted-residual | Boundary-Probe ist fuer RC0 ausreichend |
| `x-utils` nicht visuell enterprise-ready | accepted-residual | Utility-Boundary ist fuer RC0 ausreichend |
| Hydration-Warnung | accepted-residual | unter Fail-Schwelle, weiter beobachten |

## Abschlussentscheidung

Epic 12 ist abgeschlossen. Der Zustand ist `ready-for-release-owner-review-not-publish`.

Naechste Entscheidung: `release-owner-acceptance`.
