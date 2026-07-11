# XTensions Authoring Guide

An XTension connects an existing framework or library island to an XTend or RMT app through an explicit boundary. Use one when a team must retain a React, Vue, Three.js, OpenUI5, Angular or imperative surface. Native Web Components remain the simpler default for new XTend-owned UI.

The kernel never receives framework objects. It works with serializable lifecycle, capability, signal, event and diagnostic records. A HostController translates between those records and the concrete runtime.

## Prerequisites

Before implementing an adapter, decide:

- which host element and surface the adapter owns;
- who provides the external runtime;
- which props or signals the island accepts;
- which events it emits upstream;
- how listeners, timers, observers, workers and render loops stop;
- which fallback remains visible without the framework runtime.

Framework packages are classified as external or host-provided peers. They are not hidden root dependencies or vendored copies inside XTend.

## Implement the HostController

A HostController exposes a small lifecycle. This example demonstrates the shape rather than a framework implementation:

```js
const controller = {
  mount(target, initialProps) {
    return { status: 'mounted', target, initialProps };
  },
  update(signal) {
    return { status: 'updated', signal };
  },
  suspend(reason) {
    return { status: 'suspended', reason };
  },
  resume(reason) {
    return { status: 'resumed', reason };
  },
  reportError(error) {
    return { status: 'error', message: error.message };
  },
  unmount(reason) {
    return { status: 'unmounted', reason };
  },
  snapshot() {
    return { status: 'ready' };
  }
};
```

After a successful `mount()`, the controller owns the host element. `unmount()` must remove every side effect created during the lifecycle. An adapter must not rely on a full shell reload after an error.

## Describe the manifest and capabilities

The project-local Maraca manifest names identity, version, entry, integrity, runtime dependencies, required host capabilities and fallback. Runtime Capability Registry decides whether the XTension starts as `ready`, `degraded` or `policy-blocked`.

```js
const adapterRecord = {
  id: 'customer.react.dashboard',
  framework: 'react',
  version: '1.2.0',
  entry: {
    module: './customer/react-dashboard-adapter.js',
    exportName: 'createDashboardAdapter',
    dynamicImport: true
  },
  dependencies: [
    {
      name: 'react',
      versionRange: '18.x || 19.x',
      classification: 'host-provided',
      bundled: false
    }
  ],
  fallback: {
    mode: 'native-placeholder',
    message: 'Dashboard runtime unavailable'
  }
};
```

A manifest is provenance and policy input. It does not fetch an unknown runtime from the network by itself.

## Connect signals and events

Downstream communication travels as KernelSignal records on Fabric lanes. Upstream communication is published as a SurfaceEvent with owner, direction, payload schema and trust boundary. Do not pass framework contexts, DOM events or class instances across that boundary.

Choose a lane based on user impact. Visible input may require `user-blocking`; diagnostic export or preloading belongs on a background lane. Framework schedulers may provide hints, but they do not own kernel priority.

## Handle errors and fallback

When a peer runtime, capability, integrity value or policy is missing, the host does not partially mount the island. It emits a Diagnostic Record and displays the declared fallback. Other surfaces, navigation and kernel work must remain usable.

Errors inside the island flow through `reportError()`. Retain framework stacks only where redaction policy permits them. The serialized XTend diagnostic contains a stable error class, surface, lifecycle phase and correlation, but no secrets.

## Verify the adapter

Run shared contracts first, followed by the suite for your adapter:

```bash
node scripts/run_xtend_tests.js xtensions-host-controller xtensions-signal-bridge xtensions-runtime-capability-registry --json
node scripts/run_xtend_tests.js xtensions-security-integrity-gate --json
```

React and Vue have additional host-adapter suites. Imperative Canvas or WebGL hosts also need a browser smoke proving that render loops, resize observers and GPU resources have stopped after `unmount()`.

The expected result is a `ready` adapter with complete cleanup. A missing peer must reproducibly produce `degraded` or `policy-blocked` without blocking the shell.

## Troubleshooting

If an adapter remains `blocked`, inspect dependency classification, host capabilities, integrity and fallback first. A dependency with `bundled: true` violates the boundary for a host-provided runtime.

If listeners remain active after `unmount()`, route all registrations through an adapter-owned cleanup stack. Do not rely on the framework when the host created additional observers or Fabric subscriptions.

If events are not received, compare direction, owner, payload schema and lane. A direct global event bus between framework islands is outside the XTensions contract.

## Next steps

- [XTensions Migration and Coexistence](./xtensions-migration-coexistence-guide.md)
- [XTensions Security Checklist](./xtensions-security-checklist.md)
- [XTend Fabric](./xtend-fabric.md)
- [Supply Chain Checks](./supply-chain-gates.md)
