# xpopover - XTend Komponente

> **Siehe auch:** [xtooltip](./xtooltip.md), [xdrawer](./xdrawer.md), [xdialog](./xdialog.md), [xmodal](./xmodal.md)

## Uebersicht

`<x-popover>` ist ein interaktives, verankertes Overlay aus `WP-E10-11`. Es eignet sich fuer Filter, Menues, Toolbars und kontextuelle Aktionen, kann modal betrieben werden und bleibt als Custom Element ueber RMT beschreibbar.

## Verwendung

```html
<x-popover id="filters" placement="bottom" modal label="Filter options">
  <button slot="trigger" type="button">Open filters</button>
  <p>Filter content can be mounted by RMT.</p>
  <button slot="actions" type="button">Apply</button>
</x-popover>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `open` | Boolean | oeffnet das Popover kontrolliert |
| `placement` | String | `top`, `right`, `bottom` oder `left` |
| `modal` | Boolean | aktiviert Focus Trap und `aria-modal` |
| `anchor` | String | vorbereitetes Anchor-Mapping fuer RMT Authoring |
| `label` | String | zugaenglicher Name fuer den Dialog |

## Events

| Event | Detail |
|-------|--------|
| `popover-opened` | `{ id, open, source, placement, modal }` |
| `popover-closed` | `{ id, open, source, placement, modal }` |

## API

- `show()`
- `hide()`
- `toggle()`

## State, RMT und Fabric

`<x-popover>` schreibt nach `xpopover-open-<id>`. RMT nutzt `xtend.rmt.component-contract.v1`, `dom_descriptor` Templates und kann Events als `dom-event-to-rmt-command` binden. Fuer interaktive UIs ist die Lane `user-blocking`; der Kernel Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## A11y und Performance

Das Popover nutzt `role="dialog"`, `aria-expanded`, `aria-controls`, optional `aria-modal` und Focus Return. `Escape`, Outside Click und `focus-return` sind Pflichtsignale. Das Performance-Profil ist `xtend.performance.component-profile.v1` mit `budgetClass: 'overlay-medium'`, `lane: 'user-blocking'` und `hydrationPolicy: 'visible'`.

## Overlay Interaction UX Profil

Seit `WP-E11-11` deklariert `<x-popover>` das Runtime-Profil `xtend.component.overlay-interaction-ux-profile.v1` ueber `xtendOverlayInteractionUxProfile`.

| Feld | Wert |
|------|------|
| Family | `popover` |
| State Key | `xpopover-open-<id>` |
| Schedule | `overlay.position.update` |
| Commands | `show`, `hide`, `toggle`, `focus-trap`, `snapshot` |

Das Profil trennt die leichte Anchor-Schicht vom modal optionalen Betrieb. Focus Trap wird nur bei `modal` aktiviert, Escape schliesst das oberste Popover und Outside Click bleibt als bewusstes Dismiss-Verhalten dokumentiert.
