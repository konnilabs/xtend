# XTendRMT Runtime Bridge

- Status: aktuell nach Epic 05 Abschluss
- Contract: `xtend.docs.xtendrmt-runtime-bridge.v1`
- Kerncontracts:
  - `xtend.rmt.xrouter-adapter.v1`
  - `xtend.rmt.xtend-component-adapter.v1`
  - `xtend.rmt.state-scheduler-diagnostics-bridge.v1`
  - `xtend.rmt.artifact-parity.v1`

## Zweck

Die Runtime Bridge verbindet normalisierte RMT App-DSL-Daten mit echten Host-Laufzeiten. Sie ist bewusst adapterbasiert:

- RMT normalisiert und indiziert.
- XRouter registriert und navigiert Routes.
- XTend Components mounten und hydrieren UI.
- Die Bridge spiegelt Adapter Results, Scheduler Endpoints und Diagnostics.

Der RMT Kernel bleibt dadurch host-neutral.

## Artefakte und Entry Points

| Artefakt | Nutzung |
|----------|---------|
| `xtendrmt/rmt-core.esm.js` | ESM-Core, Tests und Build-Referenz |
| `xtendrmt/rmt-runtime.esm.js` | ESM-Runtime mit produktiven Factories |
| `xtendrmt/rmt-runtime.browser.js` | Browser-Classic-Bundle, installiert `window.xtend.rmt` |
| `xtendrmt/rmt-core.d.ts` | TypeScript-Contract fuer oeffentliche Factories |
| `xtendrmt/rmt-manifest.json` | Produktmanifest und Artefakt-Paritaetscontract |

Das Browser-Bundle stellt zusaetzlich `window.AppModules` bereit. Die produktive Classic Surface wird unter `window.xtend.rmt` installiert.

## ESM-Verwendung

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

## Browser-Classic-Verwendung

```html
<script src="/xtendrmt/rmt-runtime.browser.js"></script>
<script type="module">
  const appModules = window.AppModules;
  const format = appModules.createRmtFormat();
  const normalizedDocument = format.normalizeDocument(window.appRmtDocument);
</script>
```

Der Browser-Smoke `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` nutzt diesen Pfad.

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

Der Adapter konsumiert `routeRegistry.byRouter["xtend.xrouter"]` und erzeugt XRouter-kompatible Route Records. RMT-Informationen bleiben als `data-rmt-*` Attribute und Route-Details sichtbar.

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

Der Adapter ist fuer Manifest Lookup, Custom-Element-Registration, DOM-Erzeugung, Props, Attribute, Slots, Events und Hydration verantwortlich.

## State-/Scheduler-/Diagnostics Bridge

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

bridge.scheduleEndpoint(
  'xtendrmt.component.hydrate',
  'app.component.hydrate',
  () => ({ ok: true }),
  { runInline: true }
);
```

Die Bridge schreibt u.a.:

- `rmt.bridge.ready`
- `rmt.scheduler.lastEndpoint`
- `rmt.adapter.lastResult`
- `rmt.diagnostics.last`
- `rmt.route.<id>.lastResult`
- `rmt.component.<id>.lastResult`

Wenn kein externes `xstate` existiert, faellt die Bridge auf einen in-memory State Handle zurueck und meldet einen degradierten, aber nutzbaren Zustand.

## Multi-Host-Regel

Nicht-XTend Hosts nutzen denselben RMT-Fluss mit eigener Adapter-ID. Die Browser-Smoke-Fixture verwendet `vanilla.component` und `xtendrmt.vanilla.mount`, um sicherzustellen, dass XTend First-Class Host ist, aber kein Kernel-Zwang entsteht.

## Artefakt-Paritaet

Nach Aenderungen an Runtime, Schema, Manifest oder Typen muss der Paritaetsgate laufen:

```bash
node scripts/verify_xtendrmt_artifact_parity.js --json
node scripts/run_xtend_tests.js rmt-compatibility --json
```

Der Gate verhindert Drift zwischen Schema, Manifest, Typdefinitionen, ESM-Bundles und Browser-Bundle.
