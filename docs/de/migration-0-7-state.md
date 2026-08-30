# State-APIs auf XTend 0.7 migrieren

XTend 0.7 entfernt sämtliche Runtime-Kompatibilitätsaliase für den bisherigen Classic-Namen. Das ist eine bewusste Breaking Change innerhalb der 0.x-Reihe.

## Öffentliche Mappings

| Vor 0.7 | Ab 0.7 |
|---|---|
| `components/xstate.js` | `components/xtend-state.js` |
| `xstate` | `xtendState` |
| `XStateApi` | `XTendStateRuntime` |
| `window.xstate` | `window.XTend.state` |
| `xstate:lifecycle` | `xtend-state:lifecycle` |
| Manifest-Key `xstate` | Manifest-Key `xtend-state` |
| Storage-Key `xstate-data` | `xtend-state-data` |
| kein Package-Subpath | `@ccslabs/xtend/classic-state` |

Es gibt keine Kompatibilitätsexporte, Globals, Events oder Manifest-Aliase. Nur persistierte Daten werden einmalig automatisch migriert.

## Moderner ESM-State

```ts
import { createStore, type XTendStore, type XTendStoreOptions } from '@ccslabs/xtend';
```

`XTendStore<T>` bleibt ein Typ und ist keine konstruierbare Klasse. Der Root exportiert `xtendState` nicht.

## Classic-State

```js
import { xtendState } from '@ccslabs/xtend/classic-state';
```

Die Classic-Semantik für dynamische Keys, initiale Subscription-Callbacks, Filter, Batches, Pfade, Persistenz, Lifecycle und Diagnostics bleibt erhalten.

## RMT-Mappings

| Vor 0.7 | Ab 0.7 |
|---|---|
| `@ccslabs/xtend/rmt/xstate-host-adapter` | `@ccslabs/xtend/rmt/state-host-adapter` |
| `createRmtXStateHostAdapter()` | `createRmtStateHostAdapter()` |
| `RmtXStateHostAdapter` | `RmtStateHostAdapter` |
| `xstateKey` | `projectionKey` |
| `xstateBridge` | `stateProjectionPort` |
| `connectXState()` | `connectStateProjection()` |
| Option `xstate` | `stateProjectionTarget` oder `stateProjectionPort` |

Alte RMT-Optionen werden ignoriert und adaptieren kein Ziel mehr. Projektionen sind ausschließlich Ausgaben; RMT übernimmt sie nie als Model-Initialzustand. Weitere Beispiele stehen in der [XTend-State-Referenz](./components/xtend-state.md).
