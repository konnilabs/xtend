# SurfaceManager Controller

`WP-SM-02` fuehrt den internen Surface Controller fuer XTend ein. Er ist der lauffaehige Unterbau fuer Multi Window Oberflaechen, aber noch kein sichtbares Custom Element.

- Contract: `xtend.surface.controller.v1`
- Runtime: `components/xsurfacemanager-controller.js`
- Types: `components/xsurfacemanager-controller.d.ts`
- Snapshot: `xtend.surface.snapshot.v1`
- Gate: `node scripts/run_xtend_tests.js surface-controller --json`

## Rolle

Der Controller verwaltet Surface Records aus dem `WP-SM-01` Authoring-Modell. RMT kann also weiterhin normale Component Records mit `metadata.surface` beschreiben; der Controller normalisiert diese Records zu einer Laufzeit-Registry.

Er ist bewusst `controller-only-no-custom-element`. `WP-SM-03` baut darauf `x-surface-manager` und `x-surface-window`.

## API

Wichtige Methoden:

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

Unterstuetzt werden `registerSurface`, `openSurface`, `closeSurface`, `focusSurface`, `updateSurface`, `moveSurface`, `resizeSurface`, `minimizeSurface`, `maximizeSurface`, `restoreSurface`, `snapshot` und `dispose`.

## State

Nach jedem Commit spiegelt der Controller:

```text
xtend.surface.registry
xtend.surface.active
xtend.surface.<surfaceId>.state
xtend.surface.<surfaceId>.bounds
xtend.surface.<surfaceId>.lifecycle
xtend.surface.diagnostics
xtend.surface.snapshot
```

Der Snapshot enthaelt nur Layout-, Lifecycle- und UI-State. Raw Metadata, DOM Nodes und Content-Payloads werden nicht serialisiert.

## Diagnostics

Wenn Fabric uebergeben wird, sendet der Controller `xtend.surface.diagnostic.v1` Events ueber `emitDiagnostic`. Ohne Fabric bleibt der Controller trotzdem lauffaehig und spiegelt Diagnostics nach xstate.

## Naechster Schritt

`WP-SM-03` sollte die sichtbare Komponentenfamilie auf diesem Controller aufbauen: `x-surface-manager`, `x-surface-window`, erste Layer-Container, Events und echte Window-Chrome.
