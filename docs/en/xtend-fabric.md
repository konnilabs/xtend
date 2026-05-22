# XTend-Fabric Runtime

- Status: runtime skeleton since `ER-WP-08`, lifecycle boundary since `ER-WP-09`, reporter adapter since `ER-WP-10`, runtime diagnostics bridge since `ER-WP-11`, component fiber instrumentation since `ER-WP-14`, route fiber instrumentation since `ER-WP-15`, telemetry snapshots since `ER-WP-16`, performance measurements since `ER-WP-18`, performance regression since `ER-WP-19`, hydration policies since `ER-WP-20`, performance authoring since `ER-WP-21`
- Contract: `xtend.docs.xtend-fabric.v1`
- API Contract: `xtend.fabric.api.v1`
- Lifecycle Boundary Contract: `xtend.fabric.lifecycle-error-boundary.v1`
- Runtime Diagnostics Bridge Contract: `xtend.fabric.runtime-diagnostics-bridge.v1`
- Component Fiber Instrumentation Contract: `xtend.fabric.component-fiber-instrumentation.v1`
- Route Fiber Instrumentation Contract: `xtend.fabric.route-fiber-instrumentation.v1`
- Telemetry Snapshot Contract: `xtend.fabric.telemetry-snapshot.v1`
- Backpressure Signal Contract: `xtend.fabric.backpressure-signal.v1`
- Performance Measurement Contract: `xtend.performance.measurement.v1`
- Component Lifecycle Telemetry Contract: `xtend.component.lifecycle-telemetry.v1`
- Hydration Policy Contract: `xtend.fabric.hydration-policy.v1`
- Performance Authoring: [Performance for Component Authors](./performance.md)
- Runtime: `fabric/xtend-fabric.js`
- Lane Mapping: `docs/xtend-fabric-rmt-lane-mapping.md`

## Purpose

`XTend-Fabric` is the local host layer for safety, diagnostics, error boundaries, reporters and later UI scheduler integration.

Fabric replaces neither XTend UI nor XTendRMT. The layer sits between loader/API/components and app-specific code. XTendRMT remains a framework-agnostic scheduler and kernel; Fabric consumes only adapter, bridge and diagnostic signals.

## Runtime Entry

The first production runtime path is:

```html
<script src="/fabric/xtend-fabric.js"></script>
```

In the browser, the facade `window.XTendFabric` is then available. In local Node gates, the same module can be loaded through CommonJS.

## API

```js
const fabric = window.XTendFabric.createXtendFabric();
```

The instance provides:

| API | Purpose |
|-----|---------|
| `createBoundary(scope, options)` | reusable boundary for loader, component, router, API or RMT-near work |
| `createComponentLifecycleBoundary(componentRef, options)` | component-specific boundary for lifecycle, hydration and event-handler errors |
| `wrapComponent(componentClassOrInstance, options)` | prepared lifecycle wrapping for component errors |
| `runFiber(fiberInput, callback)` | executes UI work as a fiber and records result/error locally |
| `emitDiagnostic(event)` | normalizes, redacts and stores local diagnostics |
| `registerReporter(reporter)` | registers opt-in reporters |
| `createReporterAdapter(options)` | generic adapter surface for custom and enterprise reporters |
| `createConsoleReporter(options)` | local console reporter for development |
| `createTestReporter(options)` | memory reporter for tests and local gates |
| `createRuntimeDiagnosticsBridge(options)` | connects Fabric with `xstate`, XTend API compliance and XTendRMT diagnostics |
| `createComponentFiberInstrumentation(componentRef, options)` | instrument mount, hydration and preload as component fibers |
| `createRouteFiberInstrumentation(routerRef, options)` | instrument XRouter navigation and route render as route fibers |
| `createTelemetrySnapshot(options)` | aggregates fibers, diagnostics, performance runtime, runtime bridge and backpressure |
| `publishTelemetrySnapshot(snapshotOrOptions, options)` | exports a snapshot as redacted diagnostic to opt-in reporters |
| `createBackpressureSignal(signal, defaults)` | creates redacted backpressure hints for scheduler/host layers |
| `recordComponentTelemetry(record)` | stores `xtend.component.lifecycle-telemetry.v1` records for snapshot aggregation |
| `captureError(error, context)` | converts errors into `xtend.fabric.diagnostic.v1` |
| `connectRmtDiagnostics(source, options)` | consumes RMT adapter/bridge diagnostics without kernel import |

## Contracts

Fabric exports these stable contract IDs:

- `xtend.fabric.api.v1`
- `xtend.fabric.diagnostic.v1`
- `xtend.fabric.reporter.v1`
- `xtend.fabric.redaction.v1`
- `xtend.fabric.fiber.v1`
- `xtend.fabric.lane.v1`
- `xtend.fabric.lifecycle-error-boundary.v1`
- `xtend.fabric.runtime-diagnostics-bridge.v1`
- `xtend.fabric.component-fiber-instrumentation.v1`
- `xtend.fabric.route-fiber-instrumentation.v1`
- `xtend.fabric.telemetry-snapshot.v1`
- `xtend.fabric.backpressure-signal.v1`
- `xtend.performance.measurement.v1`
- `xtend.component.lifecycle-telemetry.v1`
- `xtend.fabric.hydration-policy.v1`

The RMT lane mapping is maintained as a separate module under `fabric/rmt-lane-mapping.js` and carries `xtend.fabric.rmt-lane-mapping.v1`.

## Diagnostics

Diagnostics are stored locally and published as the browser event `xtend-fabric-diagnostic` when a browser environment exists.

Minimum fields:

- `schema`
- `id`
- `timestamp`
- `level`
- `code`
- `message`
- `source`
- `phase`

Optional correlation:

- `componentRef`
- `component`
- `fiberId`
- `lane`
- `severity`
- `correlationId`
- `routeRef`
- `scheduleRef`

## Component Lifecycle Error Boundary

Starting with `ER-WP-09`, Fabric has a production component lifecycle error boundary. It catches errors from `connectedCallback`, `attributeChangedCallback`, `render`, `hydrate`, `disconnectedCallback` and explicitly wrapped event handlers.

```js
const boundary = fabric.createComponentLifecycleBoundary('x-alert', {
  swallowErrors: true,
  fallbackValue: undefined
});

boundary.runPhase('render', () => component.render());
const safeDismiss = boundary.wrapEventHandler(component.handleDismiss, {
  eventName: 'dismiss'
});
```

`wrapComponent` uses the same boundary:

```js
const SafeAlert = fabric.wrapComponent(XAlert, {
  componentRef: 'x-alert',
  eventHandlers: ['handleDismiss']
});
```

Lifecycle errors use the code `xtend.fabric.component.lifecycle.failed` and carry at least `component`, `componentRef`, `phase`, `fiberId`, `lane`, `severity` and `cause`. The mapping is stable:

| Phase | Fiber Kind | Lane |
|-------|------------|------|
| `connectedCallback` | `component.mount` | `visible` |
| `attributeChangedCallback` | `component.update` | `visible` |
| `render` | `component.render` | `visible` |
| `hydrate` | `component.hydrate` | `visible` |
| `disconnectedCallback` | `component.disconnect` | `background` |
| `eventHandler` | `event.handler` | `user-blocking` |

## Reporters

The default is a `noop` reporter. Without `registerReporter`, there is no external transmission. Starting with `ER-WP-10`, there is an explicit reporter adapter contract for console, test and later enterprise reporters.

Reporters must have at least this shape:

```js
{
  id: 'test',
  schema: 'xtend.fabric.reporter.v1',
  kind: 'test',
  delivery: 'memory',
  external: false,
  minimumLevel: 'warn',
  capabilities: ['diagnostics'],
  publish(event, context) {},
  flush(reason) {},
  dispose() {}
}
```

Runtime factories:

| Factory | Purpose |
|---------|---------|
| `createNoopReporter()` | default without external output |
| `createReporterAdapter(options)` | vendor-neutral adapter for custom and enterprise reporters |
| `createConsoleReporter(options)` | local console output, opt-in |
| `createTestReporter(options)` | memory reporter for gates, opt-in |

```js
const testReporter = window.XTendFabric.createTestReporter({
  minimumLevel: 'warn'
});
const unregister = fabric.registerReporter(testReporter);
```

```js
const enterpriseReporter = window.XTendFabric.createReporterAdapter({
  id: 'enterprise-probe',
  kind: 'enterprise',
  external: true,
  minimumLevel: 'error',
  capabilities: ['diagnostics', 'lifecycle-errors'],
  sink(event, context) {
    // Future enterprise transport hook.
  }
});
```

Reporters receive only redacted diagnostics. Sensitive fields such as `token`, `password`, `cookie`, `authorization`, `header`, `query` or `form` are removed. DOM nodes are not serialized. `minimumLevel`, `filter(event, context)` and `mapEvent(event, context)` can control delivery and target payload. `mapEvent` is redacted again after mapping. Errors in reporters create local diagnostics with `xtend.fabric.reporter.failed`.

## Runtime Diagnostics Bridge

Starting with `ER-WP-11`, `createRuntimeDiagnosticsBridge(options)` connects Fabric with `xstate`, XTend API compliance and XTendRMT diagnostics. The bridge imports no RMT kernel. It consumes adapter data, bridge outputs and diagnostics hubs.

```js
const runtimeBridge = fabric.createRuntimeDiagnosticsBridge({
  xstate: window.xstate,
  api: window.XTend
});

runtimeBridge.connectXState();
runtimeBridge.connectApi();
const diagnosticsHub = runtimeBridge.createRmtDiagnosticsHub();
```

`connectXState` writes stable mirror keys:

| Key | Purpose |
|-----|---------|
| `xtend.fabric.bridge.ready` | bridge readiness with contract ID |
| `xtend.fabric.diagnostics.last` | latest redacted Fabric diagnostic |
| `xtend.fabric.diagnostics.snapshot` | local snapshot with diagnostic and fiber counters |

Stable bridge diagnostics:

| Code | Source |
|------|--------|
| `xtend.fabric.xstate.connected` | xstate is connected |
| `xtend.fabric.xstate.changed` | an external state key was changed |
| `xtend.fabric.api.connected` | XTend API compliance metadata was read |
| `xtend.fabric.rmt.connected` | RMT diagnostic source is connected |
| `xtend.rmt.bridge.adapter.result.degraded` | RMT adapter result was normalized into Fabric |

`connectRmtDiagnostics` accepts arrays, `source.diagnostics`, `source.listDiagnostics()`, `source.subscribe(fn)`, DOM events and the hub shape created by `createRmtDiagnosticsHub()`. All payloads are redacted before state or reporter output.

Details are in the contract [XTend-Fabric Runtime Diagnostics Bridge](../development/XTend-Fabric-Runtime-Diagnostics-Bridge.md).

## Fiber

`runFiber` normalizes UI work into `xtend.fabric.fiber.v1`.

```js
fabric.runFiber({
  kind: 'component.hydrate',
  scope: 'x-alert#primary',
  componentRef: 'x-alert',
  correlationId: 'route.alerts'
}, () => {
  // UI work
});
```

Fabric infers the lane from the fiber kind, for example `component.hydrate` -> `visible` and `route.navigate` -> `user-blocking`.

## Component Fiber Instrumentation

Starting with `ER-WP-14`, hosts and adapters can explicitly execute component mount, hydration and loader preload as fibers:

```js
const componentFibers = fabric.createComponentFiberInstrumentation('x-alert', {
  scope: 'x-alert#primary',
  routeRef: '/alerts',
  correlationId: 'route.alerts'
});

componentFibers.mount(() => document.createElement('x-alert'));
await componentFibers.hydrate((fiber) => element.hydrate(model, { fiber }));
componentFibers.preload(() => import('/components/xalert.js'));
```

Operation profiles:

| Operation | Fiber Kind | Default Lane | ScheduleRef | Endpoint Hint |
|-----------|------------|--------------|-------------|---------------|
| `mount` | `component.mount` | `visible` | `component.visible.mount` | `xtendrmt.component.mount` |
| `hydrate` | `component.hydrate` | `idle` | `component.idle.hydrate` | `xtendrmt.component.hydrate` |
| `preload` | `loader.module` | `visible` | `component.visible.mount` | `xtendrmt.component.mount` |

Every completed run creates an `xtend.fabric.fiber.v1` record with `durationMs`, `result`, `lane`, `scheduleRef`, `endpointNameHint` and `diagnostics`. Errors create `xtend.fabric.component.mount.failed`, `xtend.fabric.component.hydrate.failed` or `xtend.fabric.component.preload.failed` and are forwarded to opt-in reporters. Metadata is redacted before it lands in the fiber store.

Fabric imports no RMT kernel here. `scheduleRef` and `endpointNameHint` are only host/adapter hints for XTendRMT or other schedulers.

## Route Fiber Instrumentation

Starting with `ER-WP-15`, hosts, app shells and XRouter adapters can explicitly execute navigation and route render as fibers:

```js
const routeFibers = fabric.createRouteFiberInstrumentation('xtend.xrouter', {
  scope: 'x-router#shell',
  adapterRef: 'xtendrmt.xrouter',
  hostRef: 'app-shell'
});

routeFibers.navigate(() => router.navigate('/settings'), {
  from: '/',
  to: '/settings',
  routeId: 'settings'
});

await routeFibers.render((fiber) => router._renderRoute(match, outlet, { fiber }), {
  routeRef: '/settings',
  componentRef: 'x-settings'
});
```

Operation profiles:

| Operation | Fiber Kind | Default Lane | ScheduleRef | Endpoint Hint |
|-----------|------------|--------------|-------------|---------------|
| `navigate` | `route.navigate` | `user-blocking` | `ui.user-blocking.input` | `xtendrmt.ui.user-blocking` |
| `render` | `route.render` | `transition` | `route.transition.render` | `xtendrmt.route.render` |

Route render can be scheduled visibly through overrides, for example with `lane: "visible"` and `scheduleRef: "route.visible.render"`. Errors create `xtend.fabric.route.navigate.failed` or `xtend.fabric.route.render.failed`. Metadata is redacted and can carry `routeId`, `from`, `to`, `params`, `query`, `componentRef`, `adapterRef`, `hostRef` and `backpressureSignal`.

The XRouter edge remains framework-neutral: `navigate(to, options)`, `_handleNavigation()`, `_renderRoute(match, container)` and the `router-navigate` signal are instrumentable boundaries. Fabric imports no RMT kernel; `scheduleRef` and `endpointNameHint` are only scheduler hints for XTendRMT or other hosts.

## Telemetry Snapshots and Backpressure

Starting with `ER-WP-16`, `createTelemetrySnapshot(options)` summarizes local runtime data:

```js
const snapshot = fabric.createTelemetrySnapshot({
  runtimeBridge,
  rmtBridge,
  performance: window.performance,
  correlationId: 'route.settings'
});

fabric.publishTelemetrySnapshot(snapshot);
```

A snapshot carries `xtend.fabric.telemetry-snapshot.v1` and contains:

| Area | Content |
|------|---------|
| `totals` | fiber counters, errors, budget misses, average and maximum duration |
| `lanes` | aggregation per Fabric lane including `scheduleRefs` |
| `backpressure` | score, level, action, signals and lane grouping |
| `componentTelemetry` | component lifecycle records by operation, component and lane |
| `performance` | optional `mark`/`measure` entries, normalized measurements and `phaseSummary` |
| `runtime` | optional snapshot from `createRuntimeDiagnosticsBridge` |

Component lifecycle telemetry carries `xtend.component.lifecycle-telemetry.v1`. `recordComponentTelemetry(record)` stores records locally; `createTelemetrySnapshot({ componentTelemetry })` can alternatively normalize explicit records. Both paths cover `mount`, `hydrate`, `render`, `update`, `event`, `unmount` and `error`. The snapshot section `componentTelemetry` contains `recordCount`, `operations`, `components`, `lanes`, `statusCounts`, durations, diagnostics and the latest records.

Backpressure signals carry `xtend.fabric.backpressure-signal.v1`. Fabric creates them from fiber errors, deadline overruns, explicit `backpressureSignal` metadata, component lifecycle telemetry and optional snapshot inputs.

When `createTelemetrySnapshot({ rmtBridge })` receives an XTendRMT `createRmtStateSchedulerDiagnosticsBridge`, the snapshot is automatically mirrored to RMT through `recordTelemetrySnapshot`. This lands `snapshot.backpressure` and the scheduler action permanently in `rmt.backpressure.*`, without hosts having to build their own backpressure API.

| Level | Action |
|-------|--------|
| `none` | `continue` |
| `low` | `observe` |
| `medium` | `coalesce-idle-work` |
| `high` | `defer-background-work` |
| `critical` | `protect-user-blocking-work` |

`publishTelemetrySnapshot` creates the local diagnostic `xtend.fabric.telemetry.snapshot` on the `diagnostics` lane. Reporters remain opt-in; the default `noop` sends nothing externally.

Details are in the contract [XTend Telemetry Snapshot and Backpressure Contract](../development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md).

The component lifecycle connection is described in [XTend Component Lifecycle Telemetry Contract](../development/XTend-Component-Lifecycle-Telemetry-Contract.md). The local gate is:

```bash
node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json
```

## Performance Measurements

Starting with `ER-WP-18`, Fabric automatically measures known fiber kinds through `performance.mark` and `performance.measure`.

| Fiber Kind | Measure | Phase |
|------------|---------|-------|
| `loader.module` | `xtend.loader.module` | `load` |
| `component.mount` | `xtend.component.mount` | `mount` |
| `component.hydrate` | `xtend.component.hydrate` | `hydrate` |
| `component.render` | `xtend.component.render` | `render` |
| `component.update` | `xtend.component.update` | `update` |
| `event.handler` | `xtend.event.handler` | `event` |
| `route.navigate` | `xtend.route.navigate` | `route` |
| `route.render` | `xtend.route.render` | `route` |
| `diagnostics.snapshot` | `xtend.diagnostics.snapshot` | `diagnostics` |

`createTelemetrySnapshot()` converts performance entries with prefix `xtend.` into `xtend.performance.measurement.v1` records. The snapshot section `performance.phaseSummary` aggregates `load`, `hydrate`, `render` and `route`, among others.

```js
const snapshot = fabric.createTelemetrySnapshot({
  performance: window.performance
});

console.log(snapshot.performance.measurements);
console.log(snapshot.performance.phaseSummary.hydrate);
```

Details are in [Performance Measurements](./performance-measurements.md) and in the contract [XTend Performance Measurement Points and Snapshots](../development/XTend-Performance-Messpunkte-und-Snapshots.md).

Since `ER-WP-19`, [Performance Regression](./performance-regression.md) evaluates these measurements against local deterministic baselines as `xtend.performance.regression-report.v1`.

## Hydration Policies

Starting with `ER-WP-20`, `fabric/hydration-policy.js` decides whether component hydration is scheduled visible, idle or lazy:

| Policy | Lane | ScheduleRef |
|--------|------|-------------|
| `visible` | `visible` | `component.visible.hydrate` |
| `idle` | `idle` | `component.idle.hydrate` |
| `lazy` | `idle` | `component.lazy.hydrate` |

Non-visible hydration must not use the `user-blocking` lane. RMT receives only schedule records; XTend execution remains in Fabric or host adapters. Details are in [Hydration Policies](./hydration-policies.md).

## RMT Boundary

`connectRmtDiagnostics` accepts RMT-near adapter and bridge outputs, but imports no RMT kernel and parses no `.rmt` documents.

Allowed:

- adapter results
- bridge diagnostics
- schedule endpoint signals
- diagnostics snapshots

Not allowed:

- import the XTendRMT kernel
- rewrite RMT scheduler policies in Fabric
- establish XTend as a required host in RMT

## RMT Lane Mapping

Starting with `ER-WP-13`, `fabric/rmt-lane-mapping.js` maps Fabric lanes to RMT schedule records. The RMT kernel remains framework-agnostic: it sees schedule policies and endpoint names, but no XTend component logic.

Short form:

| Fabric Lane | RMT Schedule Lane |
|-------------|-------------------|
| `user-blocking` | `user-blocking` |
| `a11y` | `user-blocking` |
| `visible` | `visible` |
| `transition` | `transition` |
| `idle` | `idle` |
| `background` | `background` |
| `diagnostics` | `diagnostics` |

Details, examples and gates are in [XTend-Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md).

## Gates

```bash
node scripts/run_xtend_tests.js fabric --json
node scripts/run_xtend_tests.js fabric-lane-mapping --json
node scripts/run_xtend_tests.js fabric-lifecycle-boundary --json
node scripts/run_xtend_tests.js fabric-reporters --json
node scripts/run_xtend_tests.js fabric-runtime-bridge --json
node scripts/run_xtend_tests.js fabric-component-fibers --json
node scripts/run_xtend_tests.js fabric-route-fibers --json
node scripts/run_xtend_tests.js fabric-telemetry-snapshot --json
node scripts/run_xtend_tests.js fabric-performance-measurements --json
node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json
node scripts/run_xtend_tests.js performance-regression --json
node scripts/run_xtend_tests.js hydration-policy --json
npm run test:fabric
npm run test:fabric-lanes
npm run test:fabric-lifecycle
npm run test:fabric-reporters
npm run test:fabric-runtime-bridge
npm run test:fabric-component-fibers
npm run test:fabric-route-fibers
npm run test:fabric-telemetry
npm run test:fabric-performance
npm run test:performance
npm run test:hydration-policy
node scripts/run_xtend_tests.js references --json
npm test
```

`ER-WP-19` is complete. Loader, hydration, render and route measurement points now hang in the performance runtime, in Fabric telemetry snapshots and in the local performance regression gate.
