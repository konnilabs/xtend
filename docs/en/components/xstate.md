# xstate - XTend Component

> **See also:** [xalert](./xalert.md), [xtoast](./xtoast.md), [xbutton](./xbutton.md), [xtheme](./xtheme.md)

## Overview

`xstate` is the central state management module for XTend components. It
supports global and local state, subscriptions, and reactive updates.

Since `WP-E12-08`, `xstate` is explicitly documented as a non-visual
**boundary probe**. The module is not reinterpreted as a Custom Element.
Instead, it provides a gateable adapter, typing, and lifecycle surface for
XTend UI, Fabric, and XTendRMT.

---

## Features

- Global and component-based state management
- Subscriptions for state changes with key filters
- Reactive updates for components
- Path updates, batch updates, and storage helpers
- Compatibility facade for `on/off`
- Lifecycle events for state operations
- Fabric-compatible diagnostics snapshots
- RMT State Scheduler Adapter without kernel coupling

---

## Usage

```js
import { xstate } from 'components/xstate.js';

xstate.set('key', 'value');
const value = xstate.get('key');
const unsubscribe = xstate.subscribe((key, value, allData) => { ... }, 'key');
```

---

## API

| Method | Description |
|--------|-------------|
| `get(key)` | returns the value for a key |
| `set(key, val)` | sets a value and notifies listeners |
| `subscribe(fn, keyFilter?)` | canonical subscription contract with optional key filter |
| `remove(key)` | removes a key from state |
| `getPath(path)` | reads nested values through dot notation |
| `setPath(path, value)` | writes nested values through dot notation |
| `batchUpdate(updates)` | applies multiple updates in one step |
| `saveToStorage(type?, key?)` | persists state to local or session storage |
| `loadFromStorage(type?, key?)` | loads state from browser storage |
| `on(key, fn)` | legacy compatibility for key-based listeners |
| `off(key, fn)` | removes a listener registered through `on` |
| `subscribeLifecycle(fn)` | subscribes to lifecycle/diagnostics events from the state boundary |
| `snapshot()` | returns a stable state snapshot for tests and adapters |
| `snapshotDiagnostics()` | returns Fabric-compatible diagnostics |
| `createRmtStateAdapter(options?)` | creates a host-neutral RMT state adapter |

---

## Example: Use State in a Component

```js
xstate.set('user', { name: 'Konni' });
const unsubscribe = xstate.subscribe((key, value) => {
  if (key === 'user') {
    // React to changes
  }
});
```

### Canonical Recommendation

- New core implementations should use `subscribe(fn, keyFilter)`.
- `on/off` remain allowed as a compatibility facade, but they are not the
  canonical contract.

---

## Boundary Probe Contract

`xstate` is not a visual element. Component catalog hardening therefore checks
it as an infrastructure boundary:

- Boundary Schema: `xtend.state.boundary-probe.v1`
- Snapshot Schema: `xtend.state.snapshot.v1`
- Lifecycle Schema: `xtend.state.lifecycle-event.v1`
- Diagnostics Schema: `xtend.fabric.state-diagnostics.v1`
- RMT Compatibility Schema: `xtend.rmt.state-scheduler-compatibility.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

```js
import { xstate } from '/components/xstate.js';

const unsubscribeLifecycle = xstate.subscribeLifecycle((event, diagnostics) => {
  console.log(event.type, diagnostics.operationCounts);
});

xstate.set('rmt.bridge.ready', true);

const snapshot = xstate.snapshot();
const diagnostics = xstate.snapshotDiagnostics();

unsubscribeLifecycle();
```

## RMT State Scheduler Compatibility

RMT must not import `xstate` directly. An XTend host can intentionally create
an adapter and pass it to the State/Scheduler/Diagnostics Bridge:

```js
const stateAdapter = xstate.createRmtStateAdapter({
  schedulerId: 'docs.app.shell'
});

stateAdapter.set('rmt.scheduler.lastEndpoint', {
  id: 'docs.header.search',
  lane: 'user-blocking'
});

stateAdapter.snapshot();
stateAdapter.diagnostics();
```

XTendRMT therefore remains framework-agnostic. `xstate` is an optional host
capability and not a kernel dependency.

---

## XTendRMT Bridge State

XTendRMT uses `xstate` optionally as a host-state mirror. The
State/Scheduler/Diagnostics Bridge writes into `xstate` only when a host passes
a compatible target. Without `xstate`, an in-memory state handle remains
active.

Current bridge keys:

- `rmt.bridge.ready`
- `rmt.scheduler.lastEndpoint`
- `rmt.adapter.lastResult`
- `rmt.diagnostics.last`
- `rmt.route.<id>.lastResult`
- `rmt.component.<id>.lastResult`

The implementation lives in `createRmtStateSchedulerDiagnosticsBridge`; details
are in [XTendRMT Runtime Bridge](../xtendrmt-runtime-bridge.md).

---

## Notes

- Used by almost all XTend components
- Can also be used for custom purposes
- In XTend Core, `xstate` is the first bootstrap base module

---

*Last updated: May 7, 2026*
