# Performance Measurements

Starting with `ER-WP-18`, XTend measures loader, hydration, render and route core paths locally.

The stable measurement contract is:

```text
xtend.performance.measurement.v1
```

## Measurement Points

| Measure | Phase | Source |
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

The loader sets `performance.mark` and `performance.measure` for:

- loading and resolving the manifest
- loading the ESM module
- waiting for the Custom Element definition

It also emits a local browser event:

```js
window.addEventListener('xtend-loader-performance', (event) => {
  console.log(event.detail.name, event.detail.durationMs);
});
```

The automatic boot promise contains the loader measurements:

```js
const boot = await window.__XTendLoaderBootPromise;
console.log(boot.performanceMeasurements);
```

## Fabric

Fabric automatically measures known fibers:

```js
const fabric = window.XTendFabric.createXtendFabric({
  performance: window.performance
});

const component = fabric.createComponentFiberInstrumentation('x-alert');
await component.hydrate(() => hydrateAlert());
```

Measurement can be disabled for special tests:

```js
const fabric = window.XTendFabric.createXtendFabric({
  markPerformance: false
});
```

## Telemetry Snapshot

`createTelemetrySnapshot()` reads `mark` and `measure` entries with the `xtend.` prefix and normalizes them:

```js
const snapshot = fabric.createTelemetrySnapshot({
  performance: window.performance
});

console.log(snapshot.performance.measurements);
console.log(snapshot.performance.phaseSummary.hydrate);
```

The snapshot section contains:

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

Since `ER-WP-19`, [Performance Regression](./performance-regression.md) uses the same measurements for local deterministic baselines:

```bash
node scripts/run_xtend_tests.js performance-regression --json
npm run test:performance
```
