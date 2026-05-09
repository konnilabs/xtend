# XTend Performance Messpunkte und Snapshots

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.performance.measurement.v1`
- Roadmap-Paket: `ER-WP-18`
- Runtime:
  - `xtend-loader.js`
  - `fabric/xtend-fabric.js`
- Test-Gate: `tests/fabric/fabric_performance_measurement_suite.js`
- Runner: `node scripts/run_xtend_tests.js fabric-performance-measurements --json`

## Zweck

XTend misst ab `ER-WP-18` die Kernpfade, die spaeter fuer Performance Regression, Hydration Policies und CI-Gates ausgewertet werden koennen.

Die Messpunkte bleiben host-nah und framework-agnostisch:

- Der Loader erzeugt lokale `performance.mark`/`performance.measure` Eintraege und ein Browser-Event `xtend-loader-performance`.
- Fabric erzeugt fuer Fibers dieselben Performance Measures.
- Telemetry Snapshots normalisieren die Eintraege als `xtend.performance.measurement.v1`.
- XTendRMT, Reporter oder CI-Gates koennen diese Daten konsumieren, ohne dass Fabric einen Scheduler importiert.

## Messpunkt-Katalog

| Measure | Phase | Quelle | Zweck |
|---------|-------|--------|-------|
| `xtend.loader.manifest` | `load` | Loader | Manifest laden und URL-Aufloesung messen |
| `xtend.loader.module` | `load` | Loader/Fabric | ESM-Modul-Load und Preload messen |
| `xtend.component.define` | `define` | Loader | `customElements.whenDefined(tag)` messen |
| `xtend.component.mount` | `mount` | Fabric | Component Mount Fiber messen |
| `xtend.component.hydrate` | `hydrate` | Fabric | Hydration Fiber messen |
| `xtend.component.render` | `render` | Fabric | Render Fiber messen |
| `xtend.component.update` | `update` | Fabric | Update Fiber messen |
| `xtend.event.handler` | `event` | Fabric | User Event Handler messen |
| `xtend.route.navigate` | `route` | Fabric | Navigation messen |
| `xtend.route.render` | `route` | Fabric | Route Render messen |
| `xtend.diagnostics.snapshot` | `diagnostics` | Fabric | Snapshot-/Diagnostics-Arbeit messen |

## Measurement Contract

Telemetry Snapshots erzeugen aus Performance Entries Messwerte dieser Form:

```js
{
  schema: 'xtend.performance.measurement.v1',
  id: 'xtend.performance.measurement.1',
  name: 'xtend.component.hydrate',
  entryName: 'xtend.component.hydrate',
  entryType: 'measure',
  profile: 'display',
  phase: 'hydrate',
  durationMs: 36,
  budgetMs: 32,
  status: 'warn',
  sampleKind: 'telemetry',
  metadata: {
    source: 'performance-runtime'
  }
}
```

`status` nutzt die Stufen aus `development/XTend-Performance-Budget-Matrix.md`:

| Status | Bedingung |
|--------|-----------|
| `pass` | `durationMs <= budgetMs` |
| `warn` | `durationMs <= budgetMs * 1.5` |
| `fail` | `durationMs > budgetMs * 1.5` |

## Loader-Verhalten

Der Loader misst:

- Manifest Fetch, JSON Parsing und URL-Aufloesung unter `xtend.loader.manifest`
- Script-Injection fuer Module unter `xtend.loader.module`
- Custom-Element-Definition unter `xtend.component.define`

`xtend.component.define` wartet nach dem Modul-Load kurz auf `customElements.whenDefined(tag)`, darf den Loader aber nicht dauerhaft blockieren, wenn ein Manifest-Eintrag kein Custom Element registriert.

Jede Loader-Messung wird zusaetzlich als Browser-Event publiziert:

```js
window.addEventListener('xtend-loader-performance', (event) => {
  console.log(event.detail.schema);
});
```

Die Boot-Promise gibt die lokalen Loader-Messungen unter `performanceMeasurements` zurueck.

## Fabric-Verhalten

Fabric misst jede Fiber, deren `kind` auf einen bekannten XTend-Messpunkt abbildbar ist.

Beispiele:

- `component.hydrate` -> `xtend.component.hydrate`
- `component.render` -> `xtend.component.render`
- `route.render` -> `xtend.route.render`

Die Messung ist optional abschaltbar:

```js
const fabric = createXtendFabric({
  markPerformance: false
});
```

Fuer Tests oder eingebettete Hosts kann ein explizites Performance Target uebergeben werden:

```js
const fabric = createXtendFabric({
  performance: window.performance
});
```

## Snapshot-Auswertung

`createTelemetrySnapshot()` normalisiert Performance Entries in:

- `performance.entries`
- `performance.measurements`
- `performance.phaseSummary`
- `performance.measurementSchema`
- `performance.measurementCount`

Damit sind Loader, Hydration, Render und Route Render im selben Snapshot sichtbar wie Fibers, Lanes, Diagnostics und Backpressure.

## Grenzen

Nicht Teil dieses Pakets:

- harte Performance Regression Gates
- Browser-basierte Baseline-Dateien
- automatische Scheduler-Entscheidungen
- externe Telemetry-Reporter

Diese Pfade starten in `ER-WP-19`, `ER-WP-20`, `ER-WP-21` und spaeteren CI-/Release-Paketen.

## Verifikation

```bash
node --check xtend-loader.js
node --check fabric/xtend-fabric.js
node --check tests/fabric/fabric_performance_measurement_suite.js
node scripts/run_xtend_tests.js fabric-performance-measurements --json
npm run test:fabric-performance
```

## Ergebnis

`ER-WP-18` ist abgeschlossen. XTend besitzt jetzt Loader-, Hydration-, Render- und Route-Messpunkte, die in Fabric Telemetry Snapshots als `xtend.performance.measurement.v1` ausgewertet werden koennen.
