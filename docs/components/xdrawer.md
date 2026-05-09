# xdrawer - XTend Komponente

> **Siehe auch:** [xpopover](./xpopover.md), [xtooltip](./xtooltip.md), [xrouter](./xrouter.md), [xlink](./xlink.md)

## Uebersicht

`<x-drawer>` ist die Shell- und Navigationskomponente aus `WP-E10-11`. Sie liefert Side Panels und Navigation Drawer fuer RMT-first Apps, unterstuetzt Focus Trap, Escape Close, Outside Click und optional route-aware Verhalten.

## Verwendung

```html
<x-drawer id="app-nav" placement="left" modal label="App navigation" route-aware>
  <button slot="trigger" type="button">Open navigation</button>
  <strong slot="header">Navigation</strong>
  <a href="#/overview">Overview</a>
  <small slot="footer">Signed in</small>
</x-drawer>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `open` | Boolean | oeffnet den Drawer kontrolliert |
| `placement` | String | `left`, `right` oder `bottom` |
| `modal` | Boolean | aktiviert Focus Trap und `aria-modal` |
| `label` | String | zugaenglicher Name fuer den Drawer |
| `route-aware` | Boolean | schliesst nach XRouter-Routenwechseln und emittiert Routensignal |

## Events

| Event | Detail |
|-------|--------|
| `drawer-opened` | `{ id, open, source, placement, modal }` |
| `drawer-closed` | `{ id, open, source, placement, modal }` |
| `drawer-route-selected` | `{ id, routeRef, source: 'x-router' }` |

## API

- `openDrawer()`
- `closeDrawer()`
- `toggle()`

## Theme und Tokens

`<x-drawer>` synchronisiert `data-theme` vom `document.documentElement` und nutzt automatisch die globalen XTend-Tokens aus `x-theme`. Ohne eigene Drawer-Tokens fallen Hintergrund, Text, Border und Overlay auf `--xtend-surface`, `--xtend-text`, `--xtend-border-color` und `--xtend-overlay-bg` zurueck. Dadurch bleiben Navigation Drawer in Bright Mode und Dark Mode lesbar, auch wenn eine App Shell keine eigenen Drawer-Farben setzt.

| Token | Zweck |
|-------|-------|
| `--drawer-bg` / `--drawer-bg-dark` | Surface-Hintergrund |
| `--drawer-color` / `--drawer-color-dark` | Textfarbe |
| `--drawer-border` / `--drawer-border-dark` | Rahmen und Trenner |
| `--drawer-overlay-bg` / `--drawer-overlay-bg-dark` | Backdrop-Farbe |
| `--drawer-focus` | Focus-Ring |
| `--drawer-close-size` | Groesse des Close-Icon-Buttons |
| `--drawer-close-border` / `--drawer-close-color` | Rahmen und Icon-Farbe des Close-Buttons |
| `--drawer-close-hover-bg` / `--drawer-close-hover-bg-dark` | Hover-Flaeche des Close-Buttons |

## State, RMT und Fabric

`<x-drawer>` schreibt nach `xdrawer-open-<id>`. Der RMT Contract ist `xtend.rmt.component-contract.v1` und nutzt `component.lazy.hydrate`, `route.visible.render` und `overlay.drawer.transition`. Der Kernel Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## A11y und Performance

Die Komponente nutzt `role="dialog"`, `aria-modal`, `aria-hidden`, `aria-expanded`, `inert`, Focus Trap und Focus Return. Beim Schliessen wird Fokus zuerst auf den Trigger oder das zuletzt aktive Element zurueckgegeben, bevor die Drawer-Surface vor Assistive Technology verborgen wird. Das Screenreader-Signal `route-change-announcement` ist fuer App-Shell-Navigation vorgesehen. Das Performance-Profil ist `xtend.performance.component-profile.v1` mit `budgetClass: 'overlay-large'`, `lane: 'visible'` und `hydrationPolicy: 'lazy'`.

## Overlay Interaction UX Profil

Seit `WP-E11-11` deklariert `<x-drawer>` das Runtime-Profil `xtend.component.overlay-interaction-ux-profile.v1` ueber `xtendOverlayInteractionUxProfile`.

| Feld | Wert |
|------|------|
| Family | `drawer` |
| State Key | `xdrawer-open-<id>` |
| Schedule | `overlay.stack.open` |
| Commands | `open`, `close`, `toggle`, `focus-trap`, `apply-inert`, `lock-scroll`, `snapshot` |

Das Profil beschreibt Drawer als route-aware Overlay: modal optional, Focus Trap nur bei modalem Betrieb, Escape schliesst das oberste Overlay und XRouter-Routenwechsel duerfen den Drawer kontrolliert schliessen.
