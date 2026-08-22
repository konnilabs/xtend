# Migrating state APIs to XTend 0.7

XTend 0.7 removes every runtime compatibility alias for the former Classic name. This is a breaking change within the 0.x release line.

## Public mappings

| Before 0.7 | 0.7 |
|---|---|
| `components/xstate.js` | `components/xtend-state.js` |
| `xstate` | `xtendState` |
| `XStateApi` | `XTendStateRuntime` |
| `window.xstate` | `window.XTend.state` |
| `xstate:lifecycle` | `xtend-state:lifecycle` |
| manifest key `xstate` | manifest key `xtend-state` |
| default storage key `xstate-data` | `xtend-state-data` |
| no package subpath | `@ccslabs/xtend/classic-state` |

There is no compatibility export, global, event or manifest alias. The storage value is the only runtime data that is migrated automatically.

## Modern ESM state

Continue to use the side-effect-free root API for modern applications:

```ts
import { createStore, type XTendStore, type XTendStoreOptions } from '@ccslabs/xtend';
```

`XTendStore<T>` remains a type, not a constructible class. The root does not export `xtendState`.

## Classic state

```js
import { xtendState } from '@ccslabs/xtend/classic-state';
```

Classic behavior for dynamic keys, immediate subscription callbacks, filters, batching, paths, persistence, lifecycle and diagnostics remains intact.

## RMT mappings

| Before 0.7 | 0.7 |
|---|---|
| `@ccslabs/xtend/rmt/xstate-host-adapter` | `@ccslabs/xtend/rmt/state-host-adapter` |
| `createRmtXStateHostAdapter()` | `createRmtStateHostAdapter()` |
| `RmtXStateHostAdapter` | `RmtStateHostAdapter` |
| `xstateKey` | `projectionKey` |
| `xstateBridge` | `stateProjectionPort` |
| `connectXState()` | `connectStateProjection()` |
| option `xstate` | `stateProjectionTarget` or `stateProjectionPort` |

Old RMT options are ignored and no longer adapt a target. State projections are output-only; RMT never adopts them as Model initial state.
