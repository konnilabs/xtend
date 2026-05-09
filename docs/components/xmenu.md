# xmenu – XTend Komponente

> **Siehe auch:** [xlink](./xlink.md), [xrouter](./xrouter.md), [xheader](./xheader.md), [xfooter](./xfooter.md)

## Übersicht

`<x-menu>` ist die Enterprise-Navigationskomponente fuer Menuebars, Toolbars und App-Navigation. Seit `WP-E12-07` besitzt sie einen expliziten Performance-, RMT-, Fabric- und Routing-Contract. RMT kann Menueintraege deklarativ als DOM-Descriptoren erzeugen; der XTend Host Adapter uebernimmt Hydration, Keyboard-Navigation, Active-State-Sync und XRouter-Kompatibilitaet.

## Features

- Slotted Eintraege fuer `a`, `button`, `x-link` und `[role="menuitem"]`
- ARIA-Rollen mit `role="menubar"` und `role="menuitem"`
- Keyboard-Navigation mit Arrow Keys, `Home`, `End`, `Enter` und `Space`
- Roving `tabindex` und `aria-current="page"` fuer aktive Eintraege
- `x-link`- und `x-router`-Kompatibilitaet ueber `x-navigate` und `router-navigate`
- `xtend.performance.component-profile.v1` mit Navigation- und Interaction-Budgets
- Fabric-kompatible Events fuer Navigation, Keyboard und Performance

## Verwendung

```html
<x-menu data-rmt-schedule="ui.user-blocking.navigation" data-xtend-lane="user-blocking">
  <a href="/overview">Overview</a>
  <x-link href="/settings">Settings</x-link>
  <button type="button">Action</button>
</x-menu>
```

## Events

| Event | Detail | Beschreibung |
|-------|--------|--------------|
| `menu-item-clicked` | `{ href, index, label, source, scheduleRef }` | Wird bei Click oder Keyboard-Aktivierung eines Eintrags emittiert |
| `menu-navigate` | `{ href, path, mode, scheduleRef }` | Signalisiert eine interne Navigation an XRouter/RMT |
| `menu-keyboard-navigation` | `{ key, fromIndex, toIndex }` | Misst Roving-Focus-Navigation |
| `menu-performance-measured` | `xtend.performance.measurement.v1` | Fabric-/Diagnostics-Messpunkt fuer Hydration, Slotchange, Keyboard und Route Activation |

## Runtime API

```js
const menu = document.querySelector('x-menu');

menu.getPerformanceBudget();
menu.getInteractionBudget();
menu.snapshotPerformance();
```

`snapshotPerformance()` liefert `xtend.component.performance-snapshot.v1` mit Countern, Budgets und den letzten Messpunkten.

## Performance Contract

`x-menu` nutzt:

- Schema: `xtend.performance.component-profile.v1`
- `componentRef`: `x-menu`
- Profile: `interactive`, `routing`
- Budget Class: `navigation-small`
- Lane: `user-blocking`
- Hydration Policy: `visible`
- kritische Messpunkte:
  - `xtend.component.hydrate`
  - `xtend.component.render`
  - `xtend.component.slotchange`
  - `xtend.interaction.keyboard`
  - `xtend.route.navigate`
  - `xtend.state.sync`

Das Interaction Budget enthaelt `keyboardBudgetMs`, `routeActivationBudgetMs`, `touchTargetMinPx: 44`, `rovingTabindexRequired`, `xLinkCompatible` und `xRouterCompatible`.

## RMT und Fabric

Der RMT Contract bleibt host-neutral:

- Adapter: `xtend.component`
- Template Mode: `dom_descriptor`
- Event Binding Mode: `dom-event-to-rmt-command`
- Schedule Refs: `component.visible.hydrate`, `ui.user-blocking.navigation`, `route.transition.navigate`, `diagnostics.snapshot`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

Fabric kann die Komponente ueber `menu-performance-measured`, `menu-keyboard-navigation`, `menu-navigate` und `snapshotPerformance()` anbinden.

## State und Routing

- `xmenu-active` ist der kanonische `xstate`-Key fuer den aktiven Eintrag.
- `xmenu-state-<id>` enthaelt den vollstaendigen lokalen State inklusive Performance Snapshot.
- Interne Links schreiben `router-navigate` und emittieren `x-navigate`, damit XRouter Hash- und History-Mode ausloesen kann.
- Aktive Eintraege erhalten `aria-current="page"` und bleiben im Roving-Tabindex fokussierbar.

## Styling & Theming

```css
x-menu {
  --xtend-menu-bg: rgba(40, 60, 120, 0.25);
  --xtend-menu-color: #fff;
  --xtend-menu-min-touch-target: 44px;
}
```

## Accessibility

- ARIA-Rollen: `menubar` auf der Shell, `menuitem` auf slotted Items.
- Keyboard-Navigation: `ArrowRight`, `ArrowDown`, `ArrowLeft`, `ArrowUp`, `Home`, `End`, `Enter`, `Space`.
- Focus Visible und Forced Colors werden ohne Bewegungsabhaengigkeit unterstuetzt.
- `prefers-reduced-motion` deaktiviert nicht notwendige Transitions.

## Component-Level-Contract ab WP-E12-07

- `xtendComponentContract`, `xtendRmtMetadata`, `xtendComponentLifecycleTelemetry`, `xtendScaffoldA11yProfile` und `xtendScaffoldPerformanceProfile` sind in der Runtime vorhanden.
- `menu-item-clicked`, `menu-navigate`, `menu-keyboard-navigation` und `menu-performance-measured` bilden die oeffentliche Event-Oberflaeche.
- `snapshotPerformance()`, `getPerformanceBudget()` und `getInteractionBudget()` machen die Komponente fuer Fabric, RMT Adapter und lokale Gates testbar.

---

*Letzte Aktualisierung: 7. Mai 2026*
