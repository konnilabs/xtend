# XTend State

XTend State is the dynamic Classic state runtime for manifest-loaded XTend components. It remains intentionally separate from the strictly typed `createStore()` API, the RMT Model, and `XUtils`. The runtime serves existing browser integrations that need dynamic keys, immediate subscription callbacks, and the established Classic lifecycle protocol.

## What it solves

Classic components often need to share small pieces of state without constructing a full application model. XTend State provides a singleton with key and path access, batching, persistence, snapshots, and diagnostic events. The manifest loader resolves the `xtend-state` key; the same singleton is then available as `window.XTend.state`. Modern application data belongs in `createStore()` or the RMT Model instead. This boundary keeps ownership explicit and prevents a projection target from silently becoming a second model.

## When to use it

Use XTend State for Classic components, browser scripts, and incremental migrations when keys are discovered at runtime or existing callback semantics must be preserved. For new typed application state, prefer `createStore()` from `@ccslabs/xtend`. In an RMT application the RMT Model remains the source of truth, and XTend State may only be supplied as an injected output target.

## Avoid when

Do not use the runtime as hidden global initial state, for unredacted sensitive payloads, or as a second queue or scheduling authority. The root package import is side-effect-free and deliberately does not load the Classic runtime. Applications that require a fixed TypeScript schema, transactions around an application model, or reproducible server execution should use `createStore()` or the corresponding RMT ports.

## Load and register

The public package subpath loads the Classic runtime explicitly:

```js
// XTend State package entry
import { xtendState } from '@ccslabs/xtend/classic-state';

xtendState.set('demo.ready', true);
const unsubscribe = xtendState.subscribe((key, value, snapshot) => {
  console.log(key, value, snapshot);
}, 'demo.ready');
```

Alternatively, import `components/xtend-state.js` locally. The component manifest must map `xtend-state` to that local path. After loading, `window.XTend.state === xtendState`; retired globals such as `window.xstate` are not recreated.

## Examples

Path operations and batching avoid unnecessary individual updates. A subscription can be filtered to one key and stopped through the returned function:

```js
// XTend State batch and path example
import { xtendState } from '/components/xtend-state.js';

const stop = xtendState.subscribe((_key, _value, snapshot) => {
  renderPreferences(snapshot.preferences);
}, 'preferences');

xtendState.batchUpdate({
  'preferences.theme': 'dark',
  'preferences.density': 'compact'
});
xtendState.setPath('preferences.motion.reduced', true);
stop();
```

## API reference

`get`, `set`, `remove`, and `clear` operate on keys. `getPath` and `setPath` access nested values. `subscribe` returns an unsubscribe function and immediately calls the listener with the current snapshot. `batchUpdate` groups changes while retaining the Classic single-notification behavior. Persistence writes to `xtend-state-data`; on the first 0.7 load the previous key can be migrated safely. Lifecycle subscriptions and diagnostics are separate from normal state callbacks.

The public diagnostic events are `state:set`, `state:remove`, `state:clear`, `state:set-path`, `state:batch-update`, `state:subscribe`, `state:unsubscribe`, `state:storage-save`, `state:storage-load`, `state:lifecycle-subscribe`, `state:lifecycle-unsubscribe`, and `rmt-state-adapter:create`. Browser lifecycle telemetry is emitted exclusively through `xtend-state:lifecycle`.

## Integration notes

RMT injects Classic state only as a projection. The adapter never reads an implicit initial state back from the target:

```js
// XTend State as an output-only RMT projection
import { xtendState } from '@ccslabs/xtend/classic-state';
import { createRmtStateHostAdapter } from '@ccslabs/xtend/rmt/state-host-adapter';

const stateProjectionPort = createRmtStateHostAdapter({ target: xtendState });
```

Pass verified initial data to the RMT Model through `initialState`. Components should unsubscribe when disconnected and must not forward complete snapshots to external telemetry.

## Troubleshooting

If `xtendState` is unavailable, verify the package subpath or the `xtend-state` manifest key first. If UI values remain stale, inspect the subscription filter and confirm that a batch completed. Persistence failures can be narrowed down through `state:storage-load` and `state:storage-save`. If an RMT projection is absent, pass `createRmtStateHostAdapter()` explicitly to the runtime port; global factory lookup is not a supported substitute.

## Next steps

- [0.7 state migration](../migration-0-7-state.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
