# WP-E12-10 - Visual Snapshot Automation Contract definieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-12`
- Contract: `xtend.epic12.visual-snapshot-automation-contract.v1`
- Primaerer Gate: `node scripts/run_xtend_tests.js visual-snapshot-automation --json`
- RMT-Kernel-Grenze: `no-rmt-kernel-import-of-xtend-types`

## Ziel

`WP-E12-10` leitet aus der Epic-11-Theme-Matrix einen stabilen Visual Snapshot Automation Contract ab. Ziel ist ein klares, lokales und CDN-freies Handoff fuer `WP-E12-11`, ohne den eigentlichen Screenshot-/Pixel-Runner schon in dieses Paket zu ziehen.

## Umsetzung

### Maschinenlesbarer Plan

`tests/browser/visual-snapshot-automation-plan.js` definiert:

- Schema `xtend.epic12.visual-snapshot-automation-contract.v1`
- Entry Schema `xtend.epic12.visual-snapshot-automation-entry.v1`
- Report Schema `xtend.epic12.visual-snapshot-automation-report.v1`
- 5 UX-Familien aus der Theme Matrix
- 17 repraesentative Komponenten
- 360 Matrix-Kombinationen
- Snapshot Scopes fuer Shell, Visual State, Theme Tokens, Motion/Density, Viewports, Focus/A11y und RMT Shell Descriptor
- `dom-first-pixel-ready` als Diff-Strategie
- lokale Artefaktpolitik fuer `.xtend-test-results/visual-snapshots`
- Baseline Commit Policy `no-binary-baselines-in-WP-E12-10`
- Handoff an `WP-E12-11`

### Lokaler Gate

`tests/browser/visual_snapshot_automation_suite.js` validiert:

- Plan-, Suite-, Contract- und Workpackage-Artefakte
- Ableitung aus `xtend.epic11.component-shell-theme-matrix.v1`
- Verlinkung zum Regression Priority Plan
- lokale-only Ausfuehrung ohne externe Netzwerke
- DOM-first-Diff-Strategie und Toleranzen
- Package- und Scaffold-Metadaten
- Dokumentations- und Backlog-Handoff

### Package und Scaffold

`package.json` und `xtend-builder/scaffold.config.js` fuehren nun `visualSnapshotAutomation` als eigenes Metadata-Objekt. Das Package Script lautet:

```bash
npm run test:visual-snapshot-automation
```

### Dokumentation

Der akzeptierte Contract liegt in `development/XTend-Visual-Snapshot-Automation-Contract.md`. Die Entwicklerdokumentation liegt in `docs/visual-snapshot-automation.md`; `docs/visual-browser-regression.md` verweist auf den neuen Snapshot-Contract.

## Geaenderte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `tests/browser/visual-snapshot-automation-plan.js` | maschinenlesbarer Snapshot-Automation-Plan |
| `tests/browser/visual_snapshot_automation_suite.js` | lokaler Contract-Gate fuer WP-E12-10 |
| `development/XTend-Visual-Snapshot-Automation-Contract.md` | akzeptierter Architektur-/Contract-Text |
| `docs/visual-snapshot-automation.md` | Entwicklerdokumentation |
| `package.json` | Package Script und XTend Metadata |
| `xtend-builder/scaffold.config.js` | Scaffold Metadata |
| `scripts/run_xtend_tests.js` | Runner-Registration |
| `tests/browser/README.md` und `tests/README.md` | Testdokumentation |
| `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md` | Status und Handoff |
| `development/XTend-Epic12-RC-Hardening-Modell.md` | Visual Closure aktualisiert |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Contract ist akzeptiert | erfuellt |
| Snapshot Runner darf in `WP-E12-11` implementiert werden | erfuellt |
| Theme Matrix bleibt Quelle fuer Kombinationen | erfuellt |
| Diff-Strategie und Toleranzen sind festgelegt | erfuellt |
| Binary Baselines werden in `WP-E12-10` nicht eingefuehrt | erfuellt |
| lokale-only Ausfuehrung ist dokumentiert | erfuellt |
| RMT Kernel bleibt XTend-agnostisch | erfuellt |
| `WP-E12-11` startbar | erfuellt |

## Verifikation

```bash
node --check tests/browser/visual-snapshot-automation-plan.js
node --check tests/browser/visual_snapshot_automation_suite.js
node scripts/run_xtend_tests.js visual-snapshot-automation --json
node scripts/run_xtend_tests.js component-shell-theme-matrix regression-priority visual-snapshot-automation references --json
```

## Ergebnis

`WP-E12-10` ist abgeschlossen. XTend besitzt nun einen akzeptierten Visual Snapshot Automation Contract, der Shell-first Rendering, Theme-/Motion-/Density-/Viewport-Matrix, DOM-first-Diff und lokale Artefaktpolitik festlegt. `WP-E12-11` kann den lokalen Snapshot Fixture- und Diff-Runner auf dieser Grundlage implementieren.
