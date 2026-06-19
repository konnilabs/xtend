# RMT Kernel Runtime

The RMT kernel runtime is the host-neutral core of XTendRMT. It processes compiled RMT records, schedules runtime work and keeps app logic separate from concrete UI frameworks.

## What This Layer Is

The kernel is not a renderer. It is the layer that brings state, selectors, actions, events, resources, surfaces and scheduling intent together. That lets RMT act as an orchestration scheduler inside XTend apps, MFE shells or existing React, Vue and VanillaJS applications.

## What this layer knows

The kernel knows RMT core records, runtime state, selector outputs, action and event contracts, resource lifecycles, surface records, schedule refs, lanes, diagnostics and host adapter capabilities.

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

The compiler provides core records. The kernel processes them and forwards scheduling, state and diagnostics signals to Fabric or host adapters.

Fabric reads schedule records and lane intent. UI adapters translate surface and component records into concrete DOM or framework calls. This separation makes the kernel useful as a scheduler in mixed application landscapes.

## Next Steps

- [RMT Kernel Topography Map](./rmt-kernel-topography-map.md)
- [RMT Kernel Feature Adoption Evaluation](./rmt-kernel-feature-adoption-evaluation.md)
- [RMT Stack Topography](./rmt-stack-topography.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)
- [RMT State Selector Runtime](./rmt-state-selector-runtime.md)
