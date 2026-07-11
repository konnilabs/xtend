# XTend Fabric

Fabric coordinates lanes, telemetry and runtime diagnostics.

## What it covers

XTend Fabric runs small units of work as fibers in named lanes. It collects lifecycle, performance, and failure diagnostics and creates backpressure signals without owning canonical application state or DOM.

## Public building blocks

- `fabric/xtend-fabric.js` provides `createXtendFabric()`.
- `fabric/xtend-fabric.d.ts` describes lanes, reporters, fibers, and telemetry.
- `fabric/xtend-policy-public-types.d.ts` contains shared result and diagnostic types.

## Recommended workflow

Create one Fabric instance for each controlled runtime boundary, register optional reporters, and dispose it with its host:

```js
const fabric = window.XTendFabric.createXtendFabric();
const result = await fabric.runFiber({ kind: "component.mount", lane: "visible" });
const snapshot = fabric.createTelemetrySnapshot();
fabric.dispose();
```

A blocked fiber remains visible as a diagnostic. Do not retry work blindly when backpressure already signals `defer`, `shed`, or `block`.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
