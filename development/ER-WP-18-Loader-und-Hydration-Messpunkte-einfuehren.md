# ER-WP-18 - Loader- und Hydration-Messpunkte einfuehren

- Status: `completed`
- Datum: 6. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-18.performance-measurements.v1`
- Measurement Contract: `xtend.performance.measurement.v1`
- Zielcontract: `development/XTend-Performance-Messpunkte-und-Snapshots.md`
- Bezug:
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md`
  - `docs/performance-measurements.md`
  - `tests/fabric/fabric_performance_measurement_suite.js`

## Ziel

`ER-WP-18` macht die Kernpfade messbar, die in `ER-WP-17` als Performance-by-design Grundlage definiert wurden.

Das Paket fuehrt noch kein hartes Regression Gate ein. Es erzeugt stabile Performance Marks und normalisierte Measurement Records, damit `ER-WP-19` Budget-Auswertung auf echten Runtime-Signalen bauen kann.

## Umgesetzte Artefakte

| Artefakt | Status | Beschreibung |
|----------|--------|--------------|
| `xtend-loader.js` | completed | misst Manifest Load, Modul-Load und Custom Element Definition |
| `fabric/xtend-fabric.js` | completed | misst bekannte Fiber-Kinds via `performance.mark`/`performance.measure` |
| `tests/fabric/fabric_performance_measurement_suite.js` | completed | Gate fuer Loader-, Hydration-, Render- und Route-Messpunkte |
| `scripts/run_xtend_tests.js` | completed | Runner-Suite `fabric-performance-measurements` angebunden |
| `package.json` | completed | npm Script `test:fabric-performance` ergaenzt |
| `development/XTend-Performance-Messpunkte-und-Snapshots.md` | completed | Runtime- und Snapshot-Contract dokumentiert |
| `docs/performance-measurements.md` | completed | Entwicklerdoku fuer Messpunkte ergaenzt |

## Implementierungsentscheidungen

### Loader

Der Loader bleibt ESM-basiert und lokal.

Gemessen werden:

- `xtend.loader.manifest`
- `xtend.loader.module`
- `xtend.component.define`

Die Messung nutzt die Browser Performance Runtime, faellt bei partiellen APIs aber weich zurueck. Zusaetzlich publiziert der Loader `xtend-loader-performance` Events und liefert die lokalen Messwerte in `window.__XTendLoaderBootPromise` unter `performanceMeasurements`.

### Fabric

Fabric mappt bekannte Fiber-Kinds auf Performance Measures:

| Fiber Kind | Measure |
|------------|---------|
| `loader.module` | `xtend.loader.module` |
| `component.mount` | `xtend.component.mount` |
| `component.hydrate` | `xtend.component.hydrate` |
| `component.render` | `xtend.component.render` |
| `component.update` | `xtend.component.update` |
| `event.handler` | `xtend.event.handler` |
| `route.navigate` | `xtend.route.navigate` |
| `route.render` | `xtend.route.render` |
| `diagnostics.snapshot` | `xtend.diagnostics.snapshot` |

Die Messung ist ueber `markPerformance: false` abschaltbar und kann in Tests ueber `performance` oder `performanceTarget` explizit versorgt werden.

### Telemetry Snapshot

`createTelemetrySnapshot()` erweitert `performance` um:

- `measurementSchema`
- `measurementCount`
- `measurements`
- `phaseSummary`

Damit kann ein Snapshot Loader-, Hydration- und Route-Phasen direkt erfassen.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Manifest Load wird gemessen | erfuellt: `xtend.loader.manifest` |
| Component Define wird gemessen | erfuellt: `xtend.component.define` |
| Hydration wird gemessen | erfuellt: `component.hydrate` -> `xtend.component.hydrate` |
| Render und Route Render werden gemessen | erfuellt: `xtend.component.render`, `xtend.route.render` |
| Performance Snapshots erfassen Loader- und Hydration-Phasen | erfuellt: `phaseSummary.load`, `phaseSummary.hydrate` |
| RMT Kernel wird nicht importiert | erfuellt |

## Verifikation

Ausgefuehrt:

```bash
node --check fabric/xtend-fabric.js
node --check xtend-loader.js
node --check tests/fabric/fabric_performance_measurement_suite.js
node scripts/run_xtend_tests.js fabric-performance-measurements --json
node scripts/run_xtend_tests.js fabric-component-fibers --json
node scripts/run_xtend_tests.js fabric-route-fibers --json
node scripts/run_xtend_tests.js fabric-telemetry-snapshot --json
node scripts/run_xtend_tests.js fabric --json
npm run test:fabric-performance
```

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-18 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-19` | ready | kann Performance Regression Suite auf `xtend.performance.measurement.v1` und `phaseSummary` aufbauen |
| `ER-WP-20` | completed | haertet Hydration Policies anhand von Messwerten |
| `ER-WP-21` | completed | Autorenregeln und Scaffold-Hinweise sind abgeleitet |
| `ER-WP-24` | completed | A11y-Smoke-Pfad ist browsernah in Browser- und A11y-Hydration-Gates verankert |

## Ergebnis

`ER-WP-18` ist abgeschlossen. XTend erzeugt jetzt stabile Loader- und Hydration-Messpunkte und stellt sie in Fabric Telemetry Snapshots gatebar bereit.
