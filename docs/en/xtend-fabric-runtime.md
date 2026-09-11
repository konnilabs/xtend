# XTend Fabric Runtime

XTend Fabric is the coordination layer for runtime work. It maps RMT scheduling intent into lanes and fibers, makes hydration decisions and exposes telemetry plus diagnostics.

## What This Layer Is

Fabric supplies work intents and policy hints to the shared injected RMT scheduler. In 0.8.0, only that microkernel owns the queue, priority selection and host execution. Fabric does not run a second scheduler.

## What this layer knows

Fabric knows Fabric lanes, RMT lane mapping, schedule records, fiber context, hydration policies, backpressure, completion signals, diagnostics and telemetry snapshots.

Fabric can identify whether work is visible, idle, diagnostic or user-blocking. That helps the app control repaints, reflows and unnecessary hydration work.

## What it does not know

Fabric does not parse RMT, render UI, own framework components or execute business logic.

Fabric does not decide whether a React, Vue or XTend component is correct for the product. It only evaluates runtime intent, priority, hydration and diagnostic information.

## Interfaces

```js
import { createXtendFabric } from '@ccslabs/xtend/fabric';
import { resolveRmtScheduleForFiber } from '@ccslabs/xtend/fabric/rmt-lane-mapping';

const fabric = createXtendFabric();
const schedule = resolveRmtScheduleForFiber({
  lane: 'visible',
  scheduleRef: 'component.visible.hydrate',
  kind: 'component.hydrate'
});
```

The primary public entry points are `createXtendFabric`, hydration policy helpers, RMT lane mapping, diagnostics and telemetry snapshots.

## Communication with other layers

Compiled RMT records and host adapters provide scheduling intent. Fabric normalizes lanes and hydration hints, forwards work intents and backpressure to the shared scheduler, and consumes its completion and diagnostic signals.

XTend UI and other framework adapters can use Fabric context to prioritize visible work before idle work, collect diagnostics and make component hydration traceable.

## Next Steps

- [XTend DEV API](./xtend-dev-api.md)
- [RMT Stack Topography](./rmt-stack-topography.md)
- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [XTend Fabric](./xtend-fabric.md)
- [Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)

The [0.8 migration](./rmt-kernel-0-8-migration.md) describes this shared authority. [Maraca FastPass](./maraca-fastpass-abort-boundary.md) uses its existing `user-blocking` lane.
