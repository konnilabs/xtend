# xtooltip - XTend Komponente

> **Siehe auch:** [xpopover](./xpopover.md), [xdrawer](./xdrawer.md), [xdialog](./xdialog.md), [xmodal](./xmodal.md)

## Uebersicht

`<x-tooltip>` ist die leichte Overlay-Hilfe aus `WP-E10-11`. Die Komponente verbindet ein Ziel-Element ueber `aria-describedby`, oeffnet bei Hover oder Fokus und schliesst ueber Blur, Mouseleave oder `Escape`.

## Verwendung

```html
<button id="schedule-help">Inspect schedule</button>
<x-tooltip id="route-tooltip" for="schedule-help" placement="top" delay="20" label="Tooltip help">
  Explains the scheduled action.
</x-tooltip>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `for` | String | ID des Anchor-Elements |
| `placement` | String | `top`, `right`, `bottom` oder `left` |
| `open` | Boolean | oeffnet den Tooltip kontrolliert |
| `delay` | Number | Oeffnungsverzoegerung in Millisekunden |
| `label` | String | zugaenglicher Name fuer den Tooltip |

## Events

| Event | Detail |
|-------|--------|
| `tooltip-opened` | `{ id, open, source, placement }` |
| `tooltip-closed` | `{ id, open, source, placement }` |

## API

- `show()`
- `hide()`
- `toggle()`

## State, RMT und Fabric

`<x-tooltip>` schreibt nach `xtooltip-open-<id>`. Der RMT Contract ist `xtend.rmt.component-contract.v1` und nutzt die Schedules `component.visible.mount`, `component.idle.hydrate` und `overlay.tooltip.position`. Der Kernel Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## A11y und Performance

Die Komponente nutzt `role="tooltip"`, setzt `aria-describedby` am Anchor und dokumentiert `dismiss-on-escape` als Screenreader-Signal. Das Performance-Profil ist `xtend.performance.component-profile.v1` mit `budgetClass: 'overlay-small'`, `lane: 'visible'` und `hydrationPolicy: 'idle'`.

## Overlay Interaction UX Profil

Seit `WP-E11-11` deklariert `<x-tooltip>` das Runtime-Profil `xtend.component.overlay-interaction-ux-profile.v1` ueber `xtendOverlayInteractionUxProfile`.

| Feld | Wert |
|------|------|
| Family | `tooltip` |
| State Key | `xtooltip-open-<id>` |
| Schedule | `overlay.position.update` |
| Commands | `show`, `hide`, `toggle`, `snapshot` |

Das Profil haelt Tooltip-Overlays bewusst nicht modal: kein Focus Trap, kein Inert, kein Scroll Lock. RMT kann Positionierung und Dismissal schedulen, waehrend der Host weiterhin `aria-describedby`, Hover/Fokus und Escape verwaltet.
