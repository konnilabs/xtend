# XTend SurfaceManager Overlay Stack Bridge Contract

Status: accepted for `WP-SM-06`
Schema: `xtend.surface.overlay-stack-bridge.v1`
Local Gate: `node scripts/run_xtend_tests.js surface-overlay-bridge --json`

## Ziel

`WP-SM-06` bindet bestehende XTend Overlays optional an denselben Surface Stack wie Windows und SidePanels an. `x-modal`, `x-dialog`, `x-drawer`, `x-popover`, `x-tooltip`, `x-toast`, `x-lightbox` und `x-menu` behalten ihre bisherigen Public APIs, Events und xstate Keys, koennen aber vom `x-surface-manager` als `xtend.surface.record.v1` registriert werden.

Der Bridge-Ansatz ist bewusst kompatibel:

- kein neuer globaler Overlay-Manager
- keine zweite Surface Registry neben dem Controller aus `WP-SM-02`
- keine Breaking Changes fuer `modal-opened`, `dialog-opened`, `drawer-opened` oder bestehende `open()` / `close()` APIs
- keine RMT-Kernel-Imports von XTend Runtime-Typen

## Runtime-Artefakte

- `components/xsurfaceoverlay-bridge.js`
- `components/xsurfaceoverlay-bridge.d.ts`
- `components/xsurfacemanager.js`
- `components/xmodal.js`
- `components/xdialog.js`
- `components/xdrawer.js`
- `components/xpopover.js`
- `components/xtooltip.js`
- `components/xtoast.js`
- `components/xlightbox.js`
- `components/xmenu.js`
- `components/xsurfacemanager-controller.js`

## Bridge-Profil

Jede kompatible Overlay-Komponente deklariert:

```json
{
  "schema": "xtend.surface.overlay-stack-bridge.v1",
  "managerSlot": "overlays",
  "managerEvent": "surface-overlay-command",
  "surfaceRecordSchema": "xtend.surface.record.v1",
  "legacyApiPreserved": true
}
```

Die konkrete Typabbildung:

| Komponente | Surface Type | Legacy State Key | Legacy Events |
|------------|--------------|------------------|---------------|
| `x-modal` | `modal` | `modal-open-<id>` | `modal-opened`, `modal-closed`, `modal-action` |
| `x-dialog` | `dialog` | `dialog-open-<id>` | `dialog-opened`, `dialog-closed` |
| `x-drawer` | `drawer` | `xdrawer-open-<id>` | `drawer-opened`, `drawer-closed`, `drawer-route-selected` |
| `x-popover` | `popover` | `xpopover-open-<id>` | `popover-opened`, `popover-closed` |
| `x-tooltip` | `tooltip` | `xtooltip-open-<id>` | `tooltip-opened`, `tooltip-closed` |
| `x-toast` | `toast` | `xtoast-state-<id>` | `toast-shown`, `toast-dismissed` |
| `x-lightbox` | `lightbox` | `xlightbox-open-<id>` | `lightbox-opened`, `lightbox-closed` |
| `x-menu` | `menu` | `xmenu-state-<id>` | `menu-opened`, `menu-closed`, `menu-navigate` |

## Manager-Integration

`x-surface-manager` scannt neben `x-surface-window` und `x-side-panel` auch `x-modal`, `x-dialog`, `x-drawer`, `x-popover`, `x-tooltip`, `x-toast`, `x-lightbox` und `x-menu` im `overlays` Slot oder in verschachtelten DOM-Teilbaeumen. Die Bridge erzeugt fuer jedes Overlay einen Surface Record:

- `type`: `modal`, `dialog`, `drawer`, `popover`, `tooltip`, `toast`, `lightbox` oder `menu`
- `kind`: entspricht dem Surface Type fuer RMT-Autoren
- `status`: aus dem `open` Attribut
- `modal`: true fuer Modal/Dialog, fuer Drawer nur bei `modal`
- `placement`: nur fuer Drawer
- `stateKey`: Legacy-kompatibel
- `metadata.overlayCompatibility`: `xtend.surface.overlay-stack-bridge.v1`

Der Manager verarbeitet `surface-overlay-command` mit derselben Operationstabelle wie Window- und Panel-Commands. `show`, `hide`, `toggle` und `dismiss` werden additiv auf `open`, `close`, `open/close` und `close` normalisiert. Legacy Lifecycle Events werden nicht gestoppt; sie bleiben fuer bestehende Consumer sichtbar und werden nur zusaetzlich in Controller-Operationen uebersetzt.

## Stack- und Z-Index-Policy

Der Controller bleibt die einzige Wahrheit fuer aktive Surface, Stack und z-Order. Die Bridge spiegelt den Controller Snapshot in CSS Custom Properties:

- `--surface-overlay-z`
- `--surface-overlay-backdrop-z`

Die bestehenden sehr hohen Default-z-Indizes bleiben als Fallback erhalten, falls eine Overlay-Komponente ausserhalb eines SurfaceManagers genutzt wird.

## Grenzen

`WP-SM-06` ist eine Kompatibilitaetsbruecke. Native RMT `surfaces` Top-Level-Domain und browsernahe A11y-, Visual- und Performance-Smokes bleiben getrennte Gates.

Diese Punkte gehen an `WP-SM-07` und `WP-SM-08`.

## Kernel Boundary

Der Contract behaelt `no-rmt-kernel-import-of-xtend-types`. RMT authoring bleibt bei `xtend.component`; die spaetere native Domain `xtend.surface` wird nicht vorweggenommen.
