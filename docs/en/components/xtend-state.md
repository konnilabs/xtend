# XTend State

XTend State is the dynamic Classic state runtime for manifest-loaded XTend components. It is intentionally separate from the strictly typed `createStore()` API and from `XUtils`.

## Choose the right API

Use `createStore()` from `@ccslabs/xtend` for modern application state with a declared TypeScript shape. Use `xtendState` only when a Classic component or browser integration needs dynamic keys and the established Classic callback semantics.

```js
import { createStore } from '@ccslabs/xtend';

const store = createStore({
  states: [{ id: 'count', type: 'number', initial: 0 }]
});
```

The root import is side-effect-free: it does not load the Classic runtime or create browser globals.

## Load the Classic runtime

Package import:

```js
import { xtendState } from '@ccslabs/xtend/classic-state';
```

Local browser import:

```js
import { xtendState } from '/components/xtend-state.js';

xtendState.set('demo.ready', true);
const unsubscribe = xtendState.subscribe((key, value, snapshot) => {
  console.log(key, value, snapshot);
}, 'demo.ready');
```

The loader resolves the `xtend-state` manifest key before i18n and theme. Once loaded, the same singleton is available as `window.XTend.state`:

```js
window.XTend.state === xtendState; // true
```

## Runtime contract

`XTendStateRuntime` provides `get`, `set`, `remove`, `clear`, filtered `subscribe`, `batchUpdate`, `getPath`, `setPath`, persistence, lifecycle subscriptions, snapshots and diagnostics. A subscription receives one immediate callback with the current snapshot. `batchUpdate()` retains the Classic single-callback behavior.

Browser lifecycle telemetry is emitted exclusively through `xtend-state:lifecycle`.

## Persistence

The default browser-storage key is `xtend-state-data`. On the first load after upgrading to 0.7, the runtime can migrate the previous key. It validates the payload, writes the new key and removes the old value only after the write succeeds.

## RMT integration

RMT remains the application Model source of truth. Inject Classic state only as an output projection target through `createRmtStateHostAdapter()`:

```js
import { xtendState } from '@ccslabs/xtend/classic-state';
import { createRmtStateHostAdapter } from '@ccslabs/xtend/rmt/state-host-adapter';

const stateProjectionPort = createRmtStateHostAdapter({ target: xtendState });
```

Do not use the Classic runtime as an implicit source for RMT initial state. Pass verified `initialState` to the Model runtime instead.

## Related

- [0.7 state migration](../migration-0.7-state.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
