# ESM-Registry

Die XTend ESM-Registry ist der öffentliche JavaScript-first-Einstieg für Browser-, Bundler- und SSR-Apps. Importiere benannte Helfer aus `@ccslabs/xtend` oder aus dem gleichwertigen Subpath `@ccslabs/xtend/registry`. Der Import bootet weder den Classic-Loader noch registriert er Komponenten oder schreibt ins DOM.

## Installation und Import

```bash
npm install @ccslabs/xtend
```

```js
import {
  readyXTend,
  schedule,
  render,
  createApp,
  createStore,
  disposeXTend
} from '@ccslabs/xtend';

const host = await readyXTend();
const app = createApp();
const store = createStore();

const cancel = schedule(() => {
  render(document.querySelector('#app'), {
    type: 'element',
    tag: 'p',
    children: [{ type: 'text', text: 'Hello XTend' }]
  });
}, { endpointName: 'app.initial-render', scope: 'app' });

// cancel();       // ausstehende Arbeit abbrechen
// disposeXTend(); // Registry-Singletons freigeben
```

Der Root verwendet standardmäßig den vollständigen RMT-Orchestrierungskernel. `readyXTend()` bootet Core, Runtime, Performance-/Scheduler-Bridge und Fabric genau einmal. Der Import selbst bleibt side-effect-free. Synchrone Aliase vor erfolgreicher Readiness werfen `XTEND_NOT_READY`; ein Bootfehler bleibt als `XTEND_KERNEL_BOOT_FAILED` stabil. `getXTendHost()` und `getXTendSnapshot()` liefern den Host beziehungsweise dessen Diagnostik, Backpressure-, Scheduling- und Performance-Snapshot.

Für den bisherigen kleinen Pfad konfiguriert eine App vor der ersten Nutzung explizit `configureXTend({ orchestration: 'lightweight' })`. Dieser Modus benötigt kein `readyXTend()` und lädt Kernel und Fabric nicht.

## TypeScript

Die Registry bietet opt-in Generics für App und Store sowie geprüfte Descriptor-Typen. Ohne Generic bleibt der permissive, JavaScript-kompatible Vertrag erhalten.

```ts
import { createApp, createStore, render, type XTendDescriptor } from '@ccslabs/xtend';

interface AppState {
  count: number;
  status: 'ready' | 'busy';
}

const app = createApp<AppState>({ initialState: { count: 0, status: 'ready' } });
const store = createStore<AppState>({
  states: [{ id: 'count', type: 'number', initial: 0 }]
});
const view: XTendDescriptor = { type: 'text', text: String(store.getState('count')) };
render(document.querySelector('#app')!, view);
```

## Öffentliche Aliase

| Alias | Fachmodul-API |
| --- | --- |
| `createApp` | `createRmtAppRuntime` |
| `createStore` | `createRmtStateSelectorRuntime` |
| `createEffects` | `createRmtActionEffectRuntime` |
| `createRouter` | `createRmtEventRoutingRuntime` |
| `createAnimator` | `createRmtAnimationEngineRuntime` |
| `createValidator` | `createRmtFormValidationRuntime` |
| `createTransitions` | `createRmtSurfaceTransitionRuntime` |
| `createResources` | `createRmtSurfaceResourceGraphRuntime` |

Die langen Factory-Namen bleiben ebenfalls exportiert. Nutze sie, wenn explizite Instanzen die Absicht klarer ausdrücken als Registry-Defaults. `createFabric()` und der Alias `createXtendFabric` sind asynchron, weil die vorhandene Fabric-UMD-Runtime erst bei Bedarf geladen wird.

```js
const fabric = await createFabric({ reporters: [] });
```

## Lifecycle-Hosts konfigurieren

Rufe `configureXTend()` vor dem ersten Scheduling- oder Rendering-Alias auf, wenn die App eigene Hosts oder Instanzen benötigt. Eine Konfiguration nach der Singleton-Erzeugung wirft einen Fehler; rufe vor einer Neukonfiguration `disposeXTend()` auf.

```js
import { configureXTend, readyXTend, renderNode, disposeXTend } from '@ccslabs/xtend';

configureXTend({
  windowTarget: iframe.contentWindow,
  documentTarget: iframe.contentDocument
});
await readyXTend();

const node = renderNode({ type: 'text', text: 'Isolierter Host' });
disposeXTend();
```

## SSR

Node löst den Paket-Root zu `xtend.ssr.mjs` auf. Die Modulevaluierung benötigt weder `window` noch `document`. State-, App-, Effect- und andere DOM-neutrale Factories funktionieren direkt. Rendering benötigt ein injiziertes `documentTarget` oder einen Renderer; andernfalls wirft XTend einen eindeutigen Konfigurationsfehler. Loader-Helfer sind browser-only.

Mit `moduleResolution: "NodeNext"` wählt TypeScript `xtend.ssr.d.ts`. Ein reines Serverprojekt kann daher `lib: ["ES2022"]` verwenden, ohne DOM-Deklarationen zu installieren oder zu aktivieren.

```js
import { configureXTend, readyXTend, createApp, render } from '@ccslabs/xtend';

configureXTend({ documentTarget: serverDocument });
await readyXTend();
const app = createApp();
const result = render(serverRoot, descriptor);
```

## Komponenten und Classic-Loader

`boot()`, `loadComponent()` und `hydrate()` laden `xtend-loader.js` lazy im Browser. Damit kann ein ESM-Host Registry-Dienste bewusst mit manifestbasierten Web Components kombinieren.

```js
import { boot, loadComponent, hydrate } from '@ccslabs/xtend';

await boot({ manifestUrl: '/components/manifest.json' });
await loadComponent('x-button');
await hydrate(document.querySelector('#dynamic-region'));
```

Für einen buildlosen HTML-Host nutzt du weiterhin [XTend Classic](./xtend-classic.md) und bindest `xtend-loader.js` direkt ein. Package-Consumer können ihn explizit über `@ccslabs/xtend/loader` importieren. Der Paket-Root bedeutet nicht mehr „Classic laden“.

## Vertrag prüfen

```bash
npm run test:esm-registry
npm run test:esm-registry-types
npm run demo:ts:typecheck
npm run demo:ts:build
node scripts/run_xtend_tests.js type-exports-loader --json
npm pack --dry-run --json
```

Die ausführbare [ESM-App-Demo](../../demos/esm-app/README.md) nutzt eine Import Map. Die [TypeScript-App-Demo](../../demos/ts-app/README.md) nutzt Vite, strikte State-Generics und geprüfte Descriptoren gegen den echten Paket-Root.

## Nächste Schritte

- [Quick Start Guide](./quick-start-guide.md)
- [XTend Classic](./xtend-classic.md)
- [Type Exports](./type-exports.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
