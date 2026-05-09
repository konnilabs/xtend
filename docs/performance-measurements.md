# Performance Measurements

XTend misst ab `ER-WP-18` Loader-, Hydration-, Render- und Route-Kernpfade lokal.

Der stabile Measurement Contract lautet:

```text
xtend.performance.measurement.v1
```

## Messpunkte

| Measure | Phase | Quelle |
|---------|-------|--------|
| `xtend.loader.manifest` | `load` | `xtend-loader.js` |
| `xtend.loader.module` | `load` | `xtend-loader.js`, Fabric Fibers |
| `xtend.component.define` | `define` | `xtend-loader.js` |
| `xtend.component.mount` | `mount` | Fabric Fibers |
| `xtend.component.hydrate` | `hydrate` | Fabric Fibers |
| `xtend.component.render` | `render` | Fabric Fibers |
| `xtend.component.update` | `update` | Fabric Fibers |
| `xtend.event.handler` | `event` | Fabric Fibers |
| `xtend.route.navigate` | `route` | Fabric Fibers |
| `xtend.route.render` | `route` | Fabric Fibers |
| `xtend.diagnostics.snapshot` | `diagnostics` | Fabric Fibers |

## Loader

Der Loader setzt `performance.mark` und `performance.measure` fuer:

- Manifest laden und aufloesen
- ESM-Modul laden
- Custom Element Definition abwarten

Zusätzlich emittiert er ein lokales Browser-Event:

```js
window.addEventListener('xtend-loader-performance', (event) => {
  console.log(event.detail.name, event.detail.durationMs);
});
```

Die automatische Boot-Promise enthaelt die Loader-Messwerte:

```js
const boot = await window.__XTendLoaderBootPromise;
console.log(boot.performanceMeasurements);
```

## Fabric

Fabric misst bekannte Fibers automatisch:

```js
const fabric = window.XTendFabric.createXtendFabric({
  performance: window.performance
});

const component = fabric.createComponentFiberInstrumentation('x-alert');
await component.hydrate(() => hydrateAlert());
```

Die Messung kann fuer Spezialtests deaktiviert werden:

```js
const fabric = window.XTendFabric.createXtendFabric({
  markPerformance: false
});
```

## Telemetry Snapshot

`createTelemetrySnapshot()` liest `mark` und `measure` Eintraege mit Prefix `xtend.` und normalisiert sie:

```js
const snapshot = fabric.createTelemetrySnapshot({
  performance: window.performance
});

console.log(snapshot.performance.measurements);
console.log(snapshot.performance.phaseSummary.hydrate);
```

Die Snapshot-Sektion enthaelt:

- `measurementSchema`
- `measurementCount`
- `measurements`
- `phaseSummary`
- `entries`
- `totalDurationMs`
- `maxDurationMs`

## Gates

```bash
node scripts/run_xtend_tests.js fabric-performance-measurements --json
npm run test:fabric-performance
```

Seit `ER-WP-19` nutzt [Performance Regression](./performance-regression.md) dieselben Measurements fuer lokale deterministische Baselines:

```bash
node scripts/run_xtend_tests.js performance-regression --json
npm run test:performance
```
