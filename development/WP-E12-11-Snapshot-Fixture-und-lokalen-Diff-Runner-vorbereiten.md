# WP-E12-11 - Snapshot Fixture und lokalen Diff-Runner vorbereiten

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-12`
- Runner Contract: `xtend.epic12.visual-snapshot-runner.v1`
- Fixture Contract: `xtend.epic12.visual-snapshot-fixture.v1`
- Report Contract: `xtend.epic12.visual-snapshot-runner-report.v1`
- Primaerer Gate: `node scripts/run_xtend_tests.js visual-snapshots --json`
- RMT-Kernel-Grenze: `no-rmt-kernel-import-of-xtend-types`

## Ziel

`WP-E12-11` ueberfuehrt den in `WP-E12-10` akzeptierten Visual Snapshot Automation Contract in einen lokal ausfuehrbaren Snapshot-Gate. Der erste Runner ist bewusst DOM-first und vergleicht strukturierte JSON-Baselines. Pixel-Diff bleibt vorbereitet, wird aber nur aktiviert, wenn eine lokale Browser-/Capture-Umgebung deterministisch verfuegbar ist.

## Umsetzung

### Lokale Fixture

`tests/browser/fixtures/visual-snapshots-fixture.html` stellt eine Shell-first Fixture bereit mit:

- 5 Snapshot-Familien
- 17 repraesentativen Komponenten
- RMT Shell Descriptor Markern fuer Navigation/Routing und Layout/Media
- Theme-, Density-, Motion- und Viewport-Attributen
- lokalen XTend Loader und lokales Manifest
- Result Key `__xtendEpic12VisualSnapshotsResult`

### DOM-Baseline

`tests/browser/visual-baselines/visual-snapshots.dom-baseline.json` ist eine textuelle, reviewbare JSON-Baseline. Sie enthaelt keine Binary- oder Screenshot-Artefakte und beschreibt pro Familie:

- Komponenten
- Visual States
- Snapshot Scopes
- Matrix-Dimensionen
- DOM Signature
- Capture Policy
- Diff Policy

### Runner

`tests/browser/visual-snapshots-runner.js` erzeugt aus `xtend.epic12.visual-snapshot-automation-contract.v1` stabile Snapshot Records und vergleicht diese gegen die JSON-Baseline. Der Runner liefert `xtend.epic12.visual-snapshot-runner-report.v1` mit:

- `snapshotCount`
- `familyCount`
- `componentCount`
- `matrixCombinationCount`
- `domDiffCount`
- `pixelDiff`
- `reportPath`

Pixel-Diff ist als `optional-local-pixel-diff` sichtbar, bleibt im Node-Contract-Gate aber `not-run-in-node-contract-gate`.

### Suite

`tests/browser/visual_snapshots_suite.js` validiert:

- Runner, Fixture, Baseline und Suite-Syntax
- DOM-Diff gegen Baseline
- Package- und Scaffold-Metadaten
- Docs, Backlog, RC-Modell und Referenzpfade
- lokale-only Ausfuehrung ohne externe Netzwerke

## Geaenderte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `tests/browser/fixtures/visual-snapshots-fixture.html` | lokale Snapshot-Fixture |
| `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json` | DOM Snapshot Baseline |
| `tests/browser/visual-snapshots-runner.js` | lokaler DOM-first Snapshot Runner |
| `tests/browser/visual_snapshots_suite.js` | lokaler Gate `visual-snapshots` |
| `package.json` | Script und Metadata `visualSnapshots` |
| `xtend-builder/scaffold.config.js` | Scaffold Metadata |
| `scripts/run_xtend_tests.js` | Runner-Registration |
| `docs/visual-snapshot-automation.md` | Entwicklerdokumentation |
| `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md` | Status und Handoff |
| `development/XTend-Epic12-RC-Hardening-Modell.md` | Visual Closure aktualisiert |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| Snapshot Gate ist lokal ausfuehrbar | erfuellt |
| Theme-Matrix bleibt Quelle fuer Kombinationen | erfuellt |
| DOM-Diff gegen JSON-Baseline ist implementiert | erfuellt |
| Pixel-Diff ist optional vorbereitet | erfuellt |
| keine externen Browserdienste oder CDN-Pfade | erfuellt |
| keine Binary-Baselines im Node-Gate | erfuellt |
| JSON Report Contract ist vorhanden | erfuellt |
| `WP-E12-12` startbar | erfuellt |

## Verifikation

```bash
node --check tests/browser/visual-snapshots-runner.js
node --check tests/browser/visual_snapshots_suite.js
node scripts/run_xtend_tests.js visual-snapshots --json
node scripts/run_xtend_tests.js visual-snapshot-automation visual-snapshots references --json
```

## Ergebnis

`WP-E12-11` ist abgeschlossen. XTend besitzt nun einen lokalen DOM-first Snapshot-Gate, eine deterministische Fixture und eine reviewbare JSON-Baseline. Der naechste primaere Schritt ist `WP-E12-12`, um die Design-System-Token-Produktisierung aus der Snapshot-/Theme-Matrix-Linie abzuleiten.
