# XTendRMT Runtime

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@ccslabs/xtend-rmt` is the ESM runtime, browser bridge, application runtime, rendering layer, and Node SSR adapter for XTendRMT. It consumes compiled RMT records and keeps scheduling, state, actions, resources, surfaces, and host capabilities behind explicit contracts.

### Installation

```bash
npm install @ccslabs/xtend-rmt
```

Node.js 24 or newer is required. The package is ESM-first and exposes a browser condition for its runtime entry points.

### Application runtime

```js
import {
  createRmtAppRuntime,
  createRmtCommandEnvelope
} from '@ccslabs/xtend-rmt/app-runtime';

const runtime = createRmtAppRuntime();
const command = createRmtCommandEnvelope({
  type: 'search.submit',
  payload: { query: 'XTend' }
});
```

The application runtime owns command envelopes, reducers, host services, stream patches, pressure/yield behavior, search sources, and prewarm search workers.

### Rendering and component capabilities

```js
import {
  createRmtDomDescriptorRenderer
} from '@ccslabs/xtend-rmt/dom-descriptor-renderer';
import {
  createRmtComponentCapabilityRegistry
} from '@ccslabs/xtend-rmt/component-capability-registry';

const registry = createRmtComponentCapabilityRegistry();
const renderer = createRmtDomDescriptorRenderer({ componentRegistry: registry });
```

The DOM descriptor renderer materializes validated descriptors without making manual HTML strings the application source of truth. The capability registry keeps components and their supported behavior explicit.

Safe embedded previews use `@ccslabs/xtend-rmt/safe-preview`; unknown components and forbidden attributes or URLs degrade to diagnostics and descriptors instead of HTML strings. `@ccslabs/xtend-rmt/browser-scheduler` exposes lifecycle-bound `afterPaint` and endpoint scheduling for browser hosts.

### Node SSR

```js
import {
  createRmtNodeSsrAdapter
} from '@ccslabs/xtend-rmt/node-ssr-adapter';

const adapter = createRmtNodeSsrAdapter();
const result = await adapter.render({ template: 'app.shell' });
```

The SSR adapter emits bounded render, hydration, JSONL, diagnostics, and CSP records. Remote network execution does not occur during server rendering.

### Public entry points

The package exports the core/runtime/browser entries plus dedicated modules for DOM descriptors, component capabilities, state selectors, action/effect execution, event routing, app runtime, form validation, animation, surface transitions, surface-resource graphs, kernel orchestration, kernel feature adoption, native shells, and Node SSR. `./php-app-service-adapter.php` provides the PHP-native callable registry and JSON/NDJSON wire adapter without executing TypeScript. `./schema` and `./manifest` expose the canonical JSON artifacts.

### Kernel and host boundary

- The RMT kernel schedules and evaluates records; it does not import XTend UI runtime types.
- DOM access stays behind browser and renderer adapters.
- Host capabilities and services are registered explicitly.
- Remote surfaces remain subject to XScaler Preflight and do not turn the kernel into a remote-code executor.

### Verification

```bash
npm run test:type-exports-rmt
node scripts/run_xtend_tests.js rmt-app-runtime
npm run test:rmt-dom-descriptor-renderer
npm run test:rmt-node-ssr-adapter
npm run test:rmt-php-app-service-adapter
npm run test:scoped-package-readmes
```

### License

Licensed under the Apache License 2.0. See [LICENSE](../LICENSE).

[Back to top](#xtendrmt-runtime) · [Deutsch](#deutsch)

---

<a id="deutsch"></a>

## Deutsch

[English](#english) | **Deutsch**

`@ccslabs/xtend-rmt` ist die ESM-Runtime, Browser-Bridge, App-Runtime, Rendering-Schicht und der Node-SSR-Adapter für XTendRMT. Das Paket konsumiert kompilierte RMT-Records und hält Scheduling, State, Actions, Ressourcen, Surfaces und Host-Capabilities hinter expliziten Verträgen.

### Installation

```bash
npm install @ccslabs/xtend-rmt
```

Node.js 24 oder neuer wird benötigt. Das Paket ist ESM-first und stellt für seine Runtime-Einstiege eine Browser-Condition bereit.

### App-Runtime

```js
import {
  createRmtAppRuntime,
  createRmtCommandEnvelope
} from '@ccslabs/xtend-rmt/app-runtime';

const runtime = createRmtAppRuntime();
const command = createRmtCommandEnvelope({
  type: 'search.submit',
  payload: { query: 'XTend' }
});
```

Die App-Runtime besitzt Command Envelopes, Reducer, Host Services, Stream Patches, Pressure-/Yield-Verhalten, Suchquellen und Prewarm Search Worker.

### Rendering und Komponenten-Capabilities

```js
import {
  createRmtDomDescriptorRenderer
} from '@ccslabs/xtend-rmt/dom-descriptor-renderer';
import {
  createRmtComponentCapabilityRegistry
} from '@ccslabs/xtend-rmt/component-capability-registry';

const registry = createRmtComponentCapabilityRegistry();
const renderer = createRmtDomDescriptorRenderer({ componentRegistry: registry });
```

Der DOM Descriptor Renderer materialisiert validierte Deskriptoren, ohne manuelle HTML-Strings zur Source of Truth der Anwendung zu machen. Die Capability Registry hält Komponenten und ihr unterstütztes Verhalten explizit.

Sichere eingebettete Previews verwenden `@ccslabs/xtend-rmt/safe-preview`; unbekannte Komponenten und verbotene Attribute oder URLs degradieren zu Diagnosen und Deskriptoren statt zu HTML-Strings. `@ccslabs/xtend-rmt/browser-scheduler` stellt lifecycle-gebundenes `afterPaint`- und Endpoint-Scheduling für Browser-Hosts bereit.

### Node SSR

```js
import {
  createRmtNodeSsrAdapter
} from '@ccslabs/xtend-rmt/node-ssr-adapter';

const adapter = createRmtNodeSsrAdapter();
const result = await adapter.render({ template: 'app.shell' });
```

Der SSR-Adapter erzeugt begrenzte Render-, Hydration-, JSONL-, Diagnose- und CSP-Records. Während des Server-Renderings findet keine Remote-Netzwerkausführung statt.

### Öffentliche Einstiegspunkte

Das Paket exportiert Core-/Runtime-/Browser-Einstiege sowie eigene Module für DOM-Deskriptoren, Komponenten-Capabilities, State Selectors, Action-/Effect-Ausführung, Event Routing, App Runtime, Formularvalidierung, Animation, Surface Transitions, Surface-Resource-Graphen, Kernel-Orchestrierung, Kernel Feature Adoption, Native Shells und Node SSR. `./php-app-service-adapter.php` stellt die PHP-native Callable-Registry und den JSON-/NDJSON-Wire-Adapter bereit, ohne TypeScript auszuführen. `./schema` und `./manifest` stellen die kanonischen JSON-Artefakte bereit.

### Kernel- und Host-Grenze

- Der RMT-Kernel plant und bewertet Records; er importiert keine XTend-UI-Runtime-Typen.
- DOM-Zugriff bleibt hinter Browser- und Renderer-Adaptern.
- Host-Capabilities und Services werden explizit registriert.
- Remote Surfaces unterliegen weiterhin dem XScaler Preflight und machen den Kernel nicht zu einem Remote-Code-Executor.

### Verifikation

```bash
npm run test:type-exports-rmt
node scripts/run_xtend_tests.js rmt-app-runtime
npm run test:rmt-dom-descriptor-renderer
npm run test:rmt-node-ssr-adapter
npm run test:rmt-php-app-service-adapter
npm run test:scoped-package-readmes
```

### Lizenz

Lizenziert unter der Apache License 2.0. Siehe [LICENSE](../LICENSE).

[Nach oben](#xtendrmt-runtime) · [English](#english)

### Scheduler and preview resource limits

The kernel scheduler permits host tasks after at most `maxMicrotaskTurns`
pumps (default 64). Lane scoring and within-score FIFO ordering are unchanged;
a cooperative yield may now allow a host timer/input task to run. Pending work
is logically cancelled on dispose; cancellation still does not forcibly stop
an arbitrary callback. Duplicate explicit job IDs throw before accepting work;
automatically assigned IDs avoid existing IDs.

`maxCompletedJobs` bounds terminal handles available through `getJob` (default
200). Set `Infinity` explicitly for the previous unlimited-history behavior.
Nonnegative safe integers are accepted; zero keeps no terminal history. Omitted
or invalid values use 200. Eviction follows terminal transition order, never
removes active jobs, and does not invalidate handles/promises already held by a
caller. `getJob` returns `null` for evicted IDs. Snapshot counts describe retained
jobs; cumulative telemetry is unaffected. Dispose still cancels unfinished jobs
and retains the resulting bounded terminal history. Execution-only references
are released on settlement. Admission and strict lane priority are unchanged.

Deutsch: `maxCompletedJobs` begrenzt die terminale History standardmäßig auf 200.
`Infinity` erhält ausdrücklich die bisherige unbegrenzte History; null Einträge
werden mit `0` gewählt. Eigene Handles bleiben gültig, aktive Jobs bleiben
abrufbar, kumulative Zähler bleiben erhalten. API und Migration:
[Deutsch](../docs/de/rmt-kernel-runtime.md),
[English](../docs/en/rmt-kernel-runtime.md).

Safe Preview stops traversing sibling nodes at its structural budget and
bounds diagnostics. `metrics.nodes` counts each visited descriptor once;
`maxTextBytes` also accounts for accepted attribute names/values. Invalid
numeric limits fall back to defaults. Large attributes can therefore be omitted
where older versions emitted them, and metric/contract snapshots must be
updated. This is a projector budget, not a replacement for transport-body limits.
