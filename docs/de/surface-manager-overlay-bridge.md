# SurfaceManager Overlay Bridge

Contract: `xtend.surface.overlay-stack-bridge.v1`

Die SurfaceManager Overlay Bridge verbindet bestehende Overlay-Komponenten mit dem gemeinsamen Surface Stack. Sie bewahrt die Legacy-Komponenten und führt sie optional als Surface Records.

## Komponenten

- `x-modal`
- `x-dialog`
- `x-drawer`
- `x-popover`
- `x-tooltip`
- `x-toast`
- `x-lightbox`
- `x-menu`

## Laufzeit

`components/xsurfaceoverlay-bridge.js` erzeugt Surface Records für Overlays, setzt Stack-Z-Werte und reagiert auf `surface-overlay-command`.

Die Bridge ist ein Surface Stack Adapter. Sie ersetzt keine Komponente, erstellt keine zweite Registry und behält bestehende Lifecycle Events.

## Gate

```bash
node scripts/run_xtend_tests.js surface-overlay-bridge --json
```
