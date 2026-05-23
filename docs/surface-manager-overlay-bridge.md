# SurfaceManager Overlay Bridge

`WP-SM-06` fuehrt `xtend.surface.overlay-stack-bridge.v1` ein. Die Bridge macht `x-modal`, `x-dialog`, `x-drawer`, `x-popover`, `x-tooltip`, `x-toast`, `x-lightbox` und `x-menu` optional kompatibel mit dem `x-surface-manager` Surface Stack.

## Was sich aendert

`x-surface-manager` registriert im `overlays` Slot nun auch:

- `x-modal` als Surface Type `modal`
- `x-dialog` als Surface Type `dialog`
- `x-drawer` als Surface Type `drawer`
- `x-popover` als Surface Type `popover`
- `x-tooltip` als Surface Type `tooltip`
- `x-toast` als Surface Type `toast`
- `x-lightbox` als Surface Type `lightbox`
- `x-menu` als Surface Type `menu`

Die bestehenden Overlay APIs bleiben erhalten. Ein Modal kann weiter ueber `open()` und `close()` gesteuert werden, ein Drawer weiter ueber `openDrawer()` und `closeDrawer()`. Die Legacy Events `modal-opened`, `dialog-opened`, `drawer-opened`, `popover-opened`, `tooltip-opened`, `toast-shown` und `lightbox-opened` bleiben sichtbar.

## Command Bridge

Overlays koennen innerhalb des Managers ein `surface-overlay-command` Event nutzen:

```js
manager.dispatchEvent(new CustomEvent('surface-overlay-command', {
  bubbles: true,
  composed: true,
  detail: {
    surfaceId: 'settings.dialog',
    command: 'open'
  }
}));
```

Unterstuetzt werden die vorhandenen Surface-Operationen wie `open`, `close`, `focus` und `update`. `show`, `hide`, `toggle` und `dismiss` werden additiv auf die Manager-Operationen normalisiert. Der Manager nutzt dafuer denselben Controller Stack wie Windows und SidePanels.

## Stack-Verhalten

Die Bridge spiegelt den Surface Snapshot in Overlay CSS Custom Properties:

- `--surface-overlay-z`
- `--surface-overlay-backdrop-z`

Ausserhalb eines SurfaceManagers behalten die Overlay-Komponenten ihre bisherigen Default-z-Indizes.

## RMT und Lifecycle

RMT bleibt fuer diese Stufe bei `xtend.component`. Die Bridge erzeugt intern `xtend.surface.record.v1`, aber sie aktiviert noch keine native `xtend.surface` Domain.

Der lokale Gate:

```bash
node scripts/run_xtend_tests.js surface-overlay-bridge --json
```

## Abgrenzung

`WP-SM-06` bereitet die Stack-Kompatibilitaet vor. Browser-, A11y-, Performance- und Visual-Smokes folgen in `WP-SM-07`; die native RMT `surfaces` Domain folgt spaeter in `WP-SM-08`.
