# XTend SurfaceManager Controller und State Snapshot Contract

- Status: Accepted Controller Contract
- Datum: 9. Mai 2026
- Contract: `xtend.surface.controller.v2`
- Snapshot: `xtend.surface.snapshot.v1`
- Diagnostic: `xtend.surface.diagnostic.v1`
- Workpackage: `WP-SM-02`
- Runtime: `components/xsurfacemanager-controller.js`
- TypeScript Source: `src/components/x-surface-manager/`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`
- Runtime-Modell: `controller-only-no-custom-element`

## Zweck

`WP-SM-02` baut den DOM-freien Controller-Unterbau fuer den SurfaceManager. Der Controller ist die erste lauffaehige State- und Lifecycle-Schicht fuer Multi Window Oberflaechen, ohne bereits `x-surface-manager`, `x-surface-window` oder `x-side-panel` als sichtbare Custom Elements zu implementieren.

Der Controller ist component-owned: Er gehoert zur SurfaceManager-Komponentenfamilie und wird spaeter von `x-surface-manager` instanziiert. Er wird nicht als zweite globale Infrastruktur neben Fabric positioniert.

## API

Der stabile Controller-Schnitt lautet:

```ts
interface XtendSurfaceController {
  registerSurface(record: XtendSurfaceRecord): XtendSurfaceOperationResult;
  openSurface(id: string, input?: XtendSurfaceOpenInput): XtendSurfaceOperationResult;
  closeSurface(id: string, reason?: string): XtendSurfaceOperationResult;
  focusSurface(id: string): XtendSurfaceOperationResult;
  updateSurface(id: string, patch: XtendSurfacePatch): XtendSurfaceOperationResult;
  moveSurface(id: string, bounds: Partial<XtendSurfaceBounds>): XtendSurfaceOperationResult;
  resizeSurface(id: string, bounds: Partial<XtendSurfaceBounds>): XtendSurfaceOperationResult;
  minimizeSurface(id: string): XtendSurfaceOperationResult;
  maximizeSurface(id: string): XtendSurfaceOperationResult;
  restoreSurface(id: string): XtendSurfaceOperationResult;
  snapshot(): XtendSurfaceSnapshot;
  dispose(): XtendSurfaceOperationResult;
}
```

`registerSurface` akzeptiert direkte `xtend.surface.record.v1` Records und die in `WP-SM-01` definierten RMT Component Records mit `metadata.surface`.

## Registry

Die Registry normalisiert:

- Surface IDs und Manager-Zuordnung
- Surface-Typen: `window`, `side-panel`, `modal`, `dialog`, `drawer`, `popover`, `tooltip`
- Bounds, Mindestgroessen und Default-Geometrien
- Capabilities pro Surface-Typ
- Status, Aktivierung und z-Order
- Layout Persistence als reine UI-State-Metadaten

Snapshots speichern keine DOM Nodes und keine rohen Metadata-Payloads. Fuer Debugging werden nur `metadataKeys` gespiegelt.

## xstate Mirror

Der Controller fuehrt den Live-State intern und spiegelt nach jedem Commit stabile Keys nach `xstate`:

```text
xtend.surface.registry
xtend.surface.active
xtend.surface.<surfaceId>.state
xtend.surface.<surfaceId>.bounds
xtend.surface.<surfaceId>.lifecycle
xtend.surface.diagnostics
xtend.surface.snapshot
```

Dieser xstate Mirror macht den SurfaceManager fuer RMT Scheduler, Docs-App-Diagnostics, Component Lab und spaetere Browser-Gates beobachtbar, ohne den RMT Kernel mit XTend-Typen zu koppeln.

## Snapshot

`xtend.surface.snapshot.v1` enthaelt:

- `managerId`
- `stateKey`
- `activeSurfaceId`
- `version`
- `surfaceCount`
- `openSurfaceCount`
- `surfaces`
- `stack`
- `diagnostics`
- `updatedAt`

Der Stack ist z-Order-sortiert und enthaelt verwaltete offene oder minimierte Surfaces. Geschlossene Surfaces bleiben in der Registry, aber nicht im Stack.

## Fabric Diagnostics

Fabric ist optionaler Unterbau. Der Controller publiziert Diagnostics ueber `fabric.emitDiagnostic` und kann als Fallback `fabric.runFiber` nutzen. Fabric bleibt dabei Safety-, Fiber- und Telemetrie-Schicht; der Surface Controller ersetzt Fabric nicht.

Diagnostic Codes:

```text
xtend.surface.controller.created
xtend.surface.registered
xtend.surface.opened
xtend.surface.closed
xtend.surface.focused
xtend.surface.updated
xtend.surface.moved
xtend.surface.resized
xtend.surface.minimized
xtend.surface.maximized
xtend.surface.restored
xtend.surface.snapshot
xtend.surface.disposed
xtend.surface.invalid-record
xtend.surface.not-found
xtend.surface.capability-refused
xtend.surface.state-mirror.failed
xtend.surface.fabric-diagnostic.failed
```

## Abgrenzung

In `WP-SM-02` sind bewusst nicht enthalten:

- sichtbare Custom Elements
- Shadow DOM, Surface Chrome, Drag Handles oder Resize Handles
- Manifest Ensure fuer dynamische Surface-Inhalte
- Browser-Smoke fuer echte Pointer-Interaktion
- native RMT `surfaces` Top-Level-Domain

Diese Punkte gehoeren in `WP-SM-03` bis `WP-SM-08`.

## Gate

Der lokale Gate ist:

```bash
node scripts/run_xtend_tests.js surface-controller --json
```

Er prueft Runtime-Syntax, Controller-Verhalten, Registry, z-Order, xstate Mirror, Fabric Diagnostics, Snapshot-Shape, DOM-Freiheit, Package-/Scaffold-Metadaten und Dokumentationsverdrahtung.

## Handoff

`WP-SM-03` kann nun `x-surface-manager` und `x-surface-window` auf dem Controller aufbauen. Die sichtbaren Komponenten sollen den Controller konsumieren, aber keine zweite lokale Registry erfinden.
