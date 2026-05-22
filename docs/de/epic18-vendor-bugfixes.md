# Epic 18 Vendor Bugfixes

Diese Seite dokumentiert die Komponentenfixes, die aus der Media-Manager-
Vendor-Version in XTend main zurueckgefuehrt wurden. Sie ist bewusst kein
Produktleitfaden fuer eine konkrete App, sondern eine Bugfix- und
Kompatibilitaetsreferenz fuer XTend-Komponenten.

## Komponenten

| Komponente | Verhalten |
|------------|-----------|
| `x-tooltip` | Nutzt eine viewport-feste Overlay-Schicht, schreibt Positionswerte ueber `--xtooltip-left` und `--xtooltip-top` und bleibt nach Scroll- oder Container-Verschiebungen im sichtbaren Bereich. |
| `x-player` | Registriert Custom Events nur einmal, bleibt in Surface-Containern begrenzt und nutzt kanonische `xplayer-*` Events fuer Play, Pause, Fullscreen, PIP, Caption und Mute. |
| `x-surface-window` | Behaelt lange Titel, Scrollbars und Resize-Grenzen stabil, ohne die SurfaceManager-Registry neu zu zeichnen. |
| `x-side-panel` | Haelt Placement- und Icon-Controls stabil und kompatibel mit den SurfaceManager-Layout-Gates. |
| `x-surface-manager-controller` | Stellt generische Surface-Typen fuer Window, Side Panel, Modal, Dialog, Drawer, Popover und Tooltip bereit. |

## Gates

Der lokale Bugfix-Gate bleibt:

```bash
node scripts/run_xtend_tests.js components surface-controller surface-manager-browser overlay-interaction-ux layout-display-media-ux epic18-vendor-bugfix-smokes browser references --json
```

Der Browser-nahe Smoke liegt in
`tests/browser/fixtures/epic18-vendor-bugfix-smoke.html`; der Contract-Gate in
`tests/components/epic18_vendor_bugfix_smoke_suite.js`.

## Handoff

Die Fixes sind Plattformverhalten. Sie duerfen nicht als Media-Manager-
Sonderpfade in XTend verbleiben. Neue Apps sollen die generischen Component-,
Surface-, Event- und RMT-App-Platform-Contracts verwenden.
