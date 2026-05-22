# XTendRMT Runtime Bridge

- Status: current after Epic 05 completion
- Contract: `xtend.docs.xtendrmt-runtime-bridge.v1`
- Core contracts:
  - `xtend.rmt.xrouter-adapter.v1`
  - `xtend.rmt.xtend-component-adapter.v1`
  - `xtend.rmt.state-scheduler-diagnostics-bridge.v1`
  - `xtend.rmt.artifact-parity.v1`

## Purpose

The Runtime Bridge connects normalized RMT App DSL data with real host runtimes. It is deliberately adapter-based:

- RMT normalizes and indexes.
- XRouter registers and navigates routes.
- XTend Components mount and hydrate UI.
- The bridge mirrors adapter results, scheduler endpoints and diagnostics.

This keeps the RMT kernel host-neutral.

## Artifacts and Entry Points

| Artifact | Use |
|----------|-----|
| `xtendrmt/rmt-core.esm.js` | ESM Core, tests and build reference |
| `xtendrmt/rmt-runtime.esm.js` | ESM Runtime with production factories |
| `xtendrmt/rmt-runtime.browser.js` | Browser Classic bundle, installs `window.xtend.rmt` |
| `xtendrmt/rmt-core.d.ts` | TypeScript contract for public factories |
| `xtendrmt/rmt-manifest.json` | Product manifest and artifact-parity contract |

The browser bundle also provides `window.AppModules`. The production Classic surface is installed under `window.xtend.rmt`.

## ESM Usage

```js
import {
  createRmtFormat,
  createRmtXRouterAdapter,
  createRmtXtendComponentAdapter,
  createRmtStateSchedulerDiagnosticsBridge
} from './xtendrmt/rmt-runtime.esm.js';

const format = createRmtFormat();
const normalizedDocument = format.normalizeDocument(rmtDocument);
const registry = format.createRuntimeRegistries(normalizedDocument);
```

## Browser Classic Usage

```html
<script src="/xtendrmt/rmt-runtime.browser.js"></script>
<script type="module">
  const appModules = window.AppModules;
  const format = appModules.createRmtFormat();
  const normalizedDocument = format.normalizeDocument(window.appRmtDocument);
</script>
```

The browser smoke `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` uses this path.

## XRouter Adapter

```js
const routeAdapter = createRmtXRouterAdapter({
  routerElement: document.querySelector('x-router'),
  xstate: window.xstate
});

const routeResult = routeAdapter.registerRoutes(registry);
routeAdapter.navigate({ routeId: 'settings' }, {
  mapping: routeResult.handle.mapping
});
```

The adapter consumes `routeRegistry.byRouter["xtend.xrouter"]` and creates XRouter-compatible route records. RMT information remains visible as `data-rmt-*` attributes and route details.

## XTend Component Adapter

```js
const componentAdapter = createRmtXtendComponentAdapter({
  document,
  customElements,
  manifest: {
    'x-card': '/components/xcards.js'
  }
});

const mapping = componentAdapter.mapComponents(registry);
componentAdapter.registerComponent(mapping);
componentAdapter.mountComponent(rootElement, 'settings.card', {
  label: 'Settings'
});
componentAdapter.hydrateComponent(rootElement, 'settings.card');
```

The adapter is responsible for manifest lookup, Custom Element registration, DOM creation, props, attributes, slots, events and hydration.

## State/Scheduler/Diagnostics Bridge

```js
const bridge = createRmtStateSchedulerDiagnosticsBridge({
  xstate: window.xstate,
  scheduler: performanceRuntime,
  diagnosticsHub
});

const stateBridge = bridge.createStateBridge();
stateBridge.set('rmt.demo.ready', true);

bridge.recordAdapterResult(routeResult, {
  scheduleRef: 'route.visible.render'
});

bridge.recordTelemetrySnapshot(fabricSnapshot, {
  scheduleRef: 'diagnostics.snapshot',
  runInline: true
});

bridge.scheduleEndpoint(
  'xtendrmt.component.hydrate',
  'app.component.hydrate',
  () => ({ ok: true }),
  { runInline: true }
);
```

Among other values, the bridge writes:

- `rmt.bridge.ready`
- `rmt.telemetry.lastSnapshot`
- `rmt.backpressure.lastSignal`
- `rmt.backpressure.profile`
- `rmt.scheduler.lastEndpoint`
- `rmt.adapter.lastResult`
- `rmt.diagnostics.last`
- `rmt.route.<id>.lastResult`
- `rmt.component.<id>.lastResult`

If no external `xstate` exists, the bridge falls back to an in-memory state handle and reports a degraded but usable state.

## Multi-Host Rule

Non-XTend hosts use the same RMT flow with their own adapter ID. The browser-smoke fixture uses `vanilla.component` and `xtendrmt.vanilla.mount` to ensure that XTend is a first-class host but not a kernel requirement.

## Artifact Parity

After changes to runtime, schema, manifest or types, the parity gate must run:

```bash
node scripts/verify_xtendrmt_artifact_parity.js --json
node scripts/run_xtend_tests.js rmt-compatibility --json
```

The gate prevents drift between schema, manifest, type definitions, ESM bundles and browser bundle.
