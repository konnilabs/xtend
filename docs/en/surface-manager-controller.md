# SurfaceManager Controller

`WP-SM-02` introduces the internal Surface Controller for XTend. It is the runnable foundation for multi-window UIs, but not yet a visible custom element.

- Contract: `xtend.surface.controller.v1`
- Runtime: `components/xsurfacemanager-controller.js`
- Types: `components/xsurfacemanager-controller.d.ts`
- Snapshot: `xtend.surface.snapshot.v1`
- Gate: `node scripts/run_xtend_tests.js surface-controller --json`

## Role

The controller manages surface records from the `WP-SM-01` authoring model. RMT can therefore continue to describe normal component records with `metadata.surface`; the controller normalizes these records into a runtime registry.

It is intentionally `controller-only-no-custom-element`. `WP-SM-03` builds `x-surface-manager` and `x-surface-window` on top of it.

## API

Important methods:

```js
const {
  createSurfaceController
} = require('./components/xsurfacemanager-controller.js');

const controller = createSurfaceController({
  managerId: 'workbench.manager',
  xstate,
  fabric
});

controller.registerSurface(surfaceRecord);
controller.openSurface('workbench.inspector');
controller.focusSurface('workbench.inspector');
controller.moveSurface('workbench.inspector', { x: 128, y: 96 });
controller.resizeSurface('workbench.inspector', { width: 700, height: 460 });
controller.closeSurface('workbench.inspector');

const snapshot = controller.snapshot();
```

Supported methods are `registerSurface`, `openSurface`, `closeSurface`, `focusSurface`, `updateSurface`, `moveSurface`, `resizeSurface`, `minimizeSurface`, `maximizeSurface`, `restoreSurface`, `snapshot` and `dispose`.

## State

After every commit, the controller mirrors:

```text
xtend.surface.registry
xtend.surface.active
xtend.surface.<surfaceId>.state
xtend.surface.<surfaceId>.bounds
xtend.surface.<surfaceId>.lifecycle
xtend.surface.diagnostics
xtend.surface.snapshot
```

The snapshot contains only layout, lifecycle and UI state. Raw metadata, DOM nodes and content payloads are not serialized.

## Diagnostics

If Fabric is passed in, the controller sends `xtend.surface.diagnostic.v1` events through `emitDiagnostic`. Without Fabric, the controller remains runnable and mirrors diagnostics to xstate.

## Next Step

`WP-SM-03` should build the visible component family on this controller: `x-surface-manager`, `x-surface-window`, first layer containers, events and real window chrome.
