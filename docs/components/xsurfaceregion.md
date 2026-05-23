# xsurfaceregion - XTend Komponente

`x-surface-region` ist die generische SurfaceManager-Komponente fuer RMT
Surfaces wie `root`, `workspace`, `page`, `card`, `list`, `region` und
`overlay-host`. Sie registriert sich bei einem umgebenden `x-surface-manager`
und uebersetzt RMT Surface Records in Attribute, Bounds, Fokus und Lifecycle
Commands.

## Attribute

- `surface-id`: stabile Surface-ID fuer Controller und Resource Graph
- `kind`: RMT Authoring-Semantik, zum Beispiel `page`, `card` oder `workspace`
- `label`: Accessible Name fuer die Region
- `open`, `hidden`, `active`: Sichtbarkeit und aktiver Manager-Zustand
- `mode`: `region` oder `floating`
- `placement`: optionale Portal-, Docking- oder Layout-Platzierung
- `initial-x`, `initial-y`, `initial-width`, `initial-height`: Start-Bounds
- `role`: explizite ARIA-Rolle, sonst `main` fuer `page` und `region` fuer alle anderen Kinds

## API

`toSurfaceRecord(managerId)`, `applySurfaceSnapshot(record)`,
`openRegion()`, `closeRegion(reason)`, `focusRegion()`, `restoreRegion()` und
`updateRegion(payload)` bilden die SurfaceController-Schnittstelle additiv ab.

Events: `surface-region-command`.

RMT: `xtend.rmt.component-contract.v1`, `xtend.surface.record.v1`,
`surface.visible.render`, `surface.user-blocking.open`,
`surface.transition.layout`, `surface.diagnostics.snapshot`.

## Accessibility und Performance

Der interne Surface-Host setzt `role`, `aria-label`, `aria-hidden` und
`tabindex="-1"`. Das Performance-Profil ist
`xtend.performance.component-profile.v1` mit der Lane
`surface.region.visible`.
