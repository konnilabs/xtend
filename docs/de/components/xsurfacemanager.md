# xsurfacemanager - XTend Komponente

`x-surface-manager` ist die App-Shell-Surface-Wurzel fuer Multi Window Oberflaechen. Die Komponente instanziiert den `xtend.surface.controller.v1`, registriert slotted `x-surface-window`, `x-side-panel` und kompatible Overlay-Elemente und spiegelt Layout-, Fokus- und Lifecycle-Aenderungen als `xtend.surface.snapshot.v1`.

## Attribute

- `manager-id`: stabile Manager-ID fuer Surface Records
- `state-key`: xstate Registry-Key, standardmaessig `xtend.surface.registry`
- `layout`: Layout-Profil fuer die Surface-Zone
- `restore-key`: spaeterer Persistence-Key fuer Layout-Restore
- `route-aware`: markiert Route-gebundene Surface-Verwaltung
- `modal-policy`: Policy fuer spaetere modale Surface-Stacks

## Slots

- `windows`: frei positionierbare Windows
- `panels`: `x-side-panel` Surfaces mit Docked/Pinned/Overlay/Collapsed Modes
- `overlays`: optionale Overlay-Bridge fuer `x-modal`, `x-dialog` und `x-drawer`
- `default`: einfache Light-DOM-Fallbacks

## API

`registerSurface(surface)`, `openSurface(id)`, `closeSurface(id)`, `focusSurface(id)`, `updateSurface(id, patch)`, `moveSurface(id, bounds)`, `resizeSurface(id, bounds)`, `minimizeSurface(id)`, `maximizeSurface(id)`, `restoreSurface(id)`, `pinSurface(id)`, `collapseSurface(id)`, `expandSurface(id)`, `dockSurface(id)` und `snapshot()` delegieren auf den Surface Controller.

Events: `surface-manager-ready`, `surface-registered`, `surface-opened`, `surface-closed`, `surface-focused`, `surface-updated`, `surface-layout-changed`, `surface-window-command`, `surface-panel-command` und `surface-overlay-command`.

RMT: `xtend.rmt.component-contract.v1`, `xtend.surface.manager.v1`, `xtend.surface.controller.v1`, `xtend.surface.overlay-stack-bridge.v1`, `surface.visible.render`, `surface.user-blocking.open`, `surface.user-blocking.close`, `surface.transition.layout`, `surface.diagnostics.snapshot`.
