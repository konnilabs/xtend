# XTend UI Runtime Layer

The XTend UI runtime layer is the visible edge of the XTend stack. It provides framework-neutral Web Components, SurfaceManager, DOM descriptor rendering and manifest-based component resolution.

## What This Layer Is

XTend UI renders concrete UI. The layer receives component and surface records from RMT adapters and materializes them as Custom Elements, surface windows, side panels, portals or DOM descriptor previews.

## What this layer knows

XTend UI knows custom element tags, attributes, properties, slots, events, component manifests, surface state, theme tokens, hydration status and DOM boundaries.

SurfaceManager knows open, minimized, closed and focused surfaces. Components know their public attributes, events and hydration calls.

## What it does not know

XTend UI does not know the complete RMT program logic, global scheduler decisions, foreign MFE framework internals or the product meaning of every state record.

An XTend component should not depend directly on the RMT kernel. It receives data through adapters and publishes events back to the host.

## Interfaces

```js
import '@ccslabs/xtend/components/xsurfacemanager.js';
import '@ccslabs/xtend/components/xsurfacewindow.js';
import '@ccslabs/xtend/components/xstatus.js';
import { createRmtXtendComponentAdapter, createRmtSurfaceAdapter } from '@ccslabs/xtend/rmt';
```

The primary public entry points are component imports, `components/manifest.json`, `x-surface-manager`, `x-surface-window`, DOM descriptor renderer, `createRmtXtendComponentAdapter` and `createRmtSurfaceAdapter`.

## Communication with other layers

RMT describes surfaces and components. The kernel keeps those records host-neutral. Fabric provides scheduling and hydration context. XTend UI materializes the visible elements and sends DOM events back to the adapter.

In MFE systems, the same boundary can also host React, Vue or VanillaJS. The important rule is that each framework is connected through a host adapter and the kernel does not import framework details.

## Next Steps

- [RMT Stack Topography](./rmt-stack-topography.md)
- [RMT Component Primitives and XTend UI](./rmt-vnext-component-primitives.md)
- [SurfaceManager Runtime](./surface-manager-runtime.md)
- [Component Development](./components.md)
