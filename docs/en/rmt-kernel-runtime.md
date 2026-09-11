# RMT Kernel Runtime

XTend 0.8.0 separates the host-neutral microkernel from the runtime services built on it. `createRmtKernelScheduler()` owns the shared scheduler queue; the RMT runtime processes compiled records through injected Model, Surface and Host ports.

## What This Layer Is

The microkernel owns prioritization, jobs, cooperative continuations, cancellation and host dispatch. State, selectors, actions, events, resources and surfaces belong to composed runtime services. The same scheduler can therefore serve XTend apps, MFE shells and React, Vue or VanillaJS integrations.

## What this layer knows

The runtime knows RMT core records, runtime state, selector outputs, action and event contracts, resource lifecycles and surface records. The microkernel receives work intents with a scope, lane, priority and abort contract; it needs no knowledge of DOM or business models.

It also knows policy, panic, recovery and backpressure signals when they are represented as runtime data or diagnostics.

## What it does not know

The kernel does not know concrete DOM components, CSS, framework components, React or Vue internals, or app-specific security decisions.

It does not execute foreign remote UI. Remote surfaces and framework modules are connected through adapters, allowlists and host policies.

## Interfaces

```js
import {
  createRmtRuntime,
  createRmtCore,
  createRmtProductSurface,
  createRmtBrowserRuntime,
  createRmtServerRuntime,
  createRmtWorkerRuntime,
  createRmtBrowserHostAdapter
} from '@ccslabs/xtend/rmt';

const hostAdapter = createRmtBrowserHostAdapter({
  windowTarget: window,
  documentTarget: document
});

const runtime = createRmtRuntime({ hostAdapter });
```

The primary public entry points are `createRmtRuntime`, `createRmtCore`, `createRmtProductSurface`, `createRmtBrowserRuntime`, `createRmtServerRuntime`, `createRmtWorkerRuntime`, host adapters and the diagnostics hub.

## Communication with other layers

The compiler provides core records. The Orchestration Controller connects their runtime services to exactly one scheduler instance and the host adapters.

Fabric supplies work intents, backpressure and telemetry to that instance and owns no second queue. UI adapters translate surface and component records into DOM or framework calls. Product Surface and Prewarm Worker remain explicit opt-ins; an ESM import does not boot a runtime.

## Next Steps

- [XTend DEV API](./xtend-dev-api.md)
- [RMT Kernel Topography Map](./rmt-kernel-topography-map.md)
- [RMT Kernel Feature Adoption Evaluation](./rmt-kernel-feature-adoption-evaluation.md)
- [RMT Stack Topography](./rmt-stack-topography.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)
- [RMT State Selector Runtime](./rmt-state-selector-runtime.md)

## Host waits in 0.8.0

Waiting for paint, idle or `postTask` does not occupy an active execution slot. A host callback marks the job ready; shared priority selection decides when it runs. Cooperative continuations retain their progress. Cancellation, timeout and dispose remove host handles; `postTask` also receives the `AbortSignal`. Synchronous JavaScript still needs cooperative splitting.

See the [0.8 migration](./rmt-kernel-0-8-migration.md) for `RmtJobHandle`, the six public lanes and removed queue bypasses; [FastPass](./maraca-fastpass-abort-boundary.md) builds urgent shell actions on this scheduler.
