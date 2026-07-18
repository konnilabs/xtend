# ESM Registry

The XTend ESM Registry is the public JavaScript-first entry point for browser, bundler and SSR applications. Import named helpers from `@ccslabs/xtend` or the equivalent `@ccslabs/xtend/registry` subpath. Importing either entry does not boot the Classic loader, register components or write to the DOM.

## Install and import

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

// cancel();       // cancel pending work
// disposeXTend(); // dispose registry-owned singleton services
```

The package root defaults to the complete RMT orchestration kernel. `readyXTend()` boots Core, Runtime, the performance/scheduler bridge and Fabric exactly once, while import evaluation remains side-effect-free. Synchronous aliases used before readiness throw `XTEND_NOT_READY`; boot failures remain stable as `XTEND_KERNEL_BOOT_FAILED`. `getXTendHost()` and `getXTendSnapshot()` expose the host and its diagnostics, scheduling, backpressure and performance state.

To retain the previous small path, configure `configureXTend({ orchestration: 'lightweight' })` before first use. Lightweight mode requires no readiness call and does not load Kernel or Fabric.

## TypeScript

The registry exposes opt-in application and store generics plus checked descriptor types. Omitting a generic keeps the permissive JavaScript-compatible contract.

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

## Public aliases

| Alias | Fachmodule API |
| --- | --- |
| `createApp` | `createRmtAppRuntime` |
| `createStore` | `createRmtStateSelectorRuntime` |
| `createEffects` | `createRmtActionEffectRuntime` |
| `createRouter` | `createRmtEventRoutingRuntime` |
| `createAnimator` | `createRmtAnimationEngineRuntime` |
| `createValidator` | `createRmtFormValidationRuntime` |
| `createTransitions` | `createRmtSurfaceTransitionRuntime` |
| `createResources` | `createRmtSurfaceResourceGraphRuntime` |

The long factory names are exported as well. Use them when explicit instances communicate intent better than registry-owned defaults. `createFabric()` and its `createXtendFabric` alias are asynchronous because the existing Fabric UMD runtime is loaded only when requested.

```js
const fabric = await createFabric({ reporters: [] });
```

## Configure lifecycle hosts

Call `configureXTend()` before the first scheduling or rendering alias when an application needs custom hosts or instances. Configuration after a singleton has materialized throws; call `disposeXTend()` before configuring again.

```js
import { configureXTend, readyXTend, renderNode, disposeXTend } from '@ccslabs/xtend';

configureXTend({
  windowTarget: iframe.contentWindow,
  documentTarget: iframe.contentDocument
});
await readyXTend();

const node = renderNode({ type: 'text', text: 'Isolated host' });
disposeXTend();
```

## SSR

Node resolves the package root to `xtend.ssr.mjs`. Import evaluation does not require `window` or `document`. State, app, effect and other DOM-neutral factories work directly. Rendering requires an injected `documentTarget` or renderer; otherwise XTend throws an explicit configuration error. Loader helpers are browser-only.

With `moduleResolution: "NodeNext"`, TypeScript selects `xtend.ssr.d.ts`. A server-only project can therefore use `lib: ["ES2022"]` without installing or enabling DOM declarations.

```js
import { configureXTend, readyXTend, createApp, render } from '@ccslabs/xtend';

configureXTend({ documentTarget: serverDocument });
await readyXTend();
const app = createApp();
const result = render(serverRoot, descriptor);
```

## Components and the Classic loader

`boot()`, `loadComponent()` and `hydrate()` lazily load `xtend-loader.js` in a browser. They are useful when an ESM host deliberately combines registry services with manifest-backed Web Components.

```js
import { boot, loadComponent, hydrate } from '@ccslabs/xtend';

await boot({ manifestUrl: '/components/manifest.json' });
await loadComponent('x-button');
await hydrate(document.querySelector('#dynamic-region'));
```

For a buildless HTML host, continue to use [XTend Classic](./xtend-classic.md) and include `xtend-loader.js` directly. Package consumers can import it explicitly as `@ccslabs/xtend/loader`. The package root no longer means “load Classic”.

## Verify the contract

```bash
npm run test:esm-registry
npm run test:esm-registry-types
npm run demo:ts:typecheck
npm run demo:ts:build
node scripts/run_xtend_tests.js type-exports-loader --json
npm pack --dry-run --json
```

The runnable [ESM app demo](../../demos/esm-app/README.md) uses an import map. The [TypeScript app demo](../../demos/ts-app/README.md) uses Vite, strict state generics and checked descriptors against the real package root.

## Next steps

- [Quick Start Guide](./quick-start-guide.md)
- [XTend Classic](./xtend-classic.md)
- [Type Exports](./type-exports.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
