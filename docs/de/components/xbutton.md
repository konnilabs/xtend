# xbutton – XTend Komponente

> **Siehe auch:** [xalert](./xalert.md), [xstate](./xstate.md), [xtheme](./xtheme.md)

## Uebersicht

`<x-button>` ist der interaktive Basisbutton fuer XTend Apps. Die Komponente bietet Varianten, Groessen, Ladezustand, dekorative Icons, Focus-Visible-Styles, Reduced-Motion-/Forced-Colors-Pfade und seit `WP-E12-06` ein explizites Performance- und Interaction-Budget.

## Features

- Varianten: `primary`, `secondary`, `danger`
- Groessen: `small`, normal, `large`
- Ladezustand ueber `loading` und `aria-busy`
- Disabled-/Busy-Guards fuer Click- und Keyboard-Aktivierung
- Touch Target Token `--xtend-button-min-touch-target`
- State-Integration ueber `xbutton-state-<id>`
- Fabric-kompatible Events `button-interaction` und `button-performance-measured`
- Slot-Fallback bleibt erhalten, damit spaet nachgereichte Inhalte wie `x-icon` sauber hydrieren

## Verwendung

```html
<x-button variant="primary" size="large" icon="/icons/save.svg">Speichern</x-button>
<x-button loading aria-label="Speichern laeuft">Bitte warten...</x-button>
<x-button aria-label="Theme wechseln"><x-icon name="sun" decorative></x-icon></x-button>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `disabled` | Boolean | Deaktiviert Interaktion und setzt `aria-disabled` |
| `label` | String | Fallback-Text, wenn kein Slot-Inhalt vorhanden ist |
| `variant` | String | `primary`, `secondary`, `danger` oder Custom-Klasse |
| `size` | String | `small`, normal oder `large` |
| `icon` | String | SVG-String oder Icon-URL |
| `loading` | Boolean | Zeigt Spinner, sperrt Interaktion und setzt Busy-State |
| `aria-label` | String | Zugänglicher Name fuer Screenreader |
| `aria-busy` | Boolean | Expliziter Busy-Status ohne zwingenden Loading-Spinner |

## Events

| Event | Beschreibung |
|-------|--------------|
| `click` | weitergeleiteter Click der internen Button-Shell |
| `focus` / `blur` | weitergeleitete Focus-Events |
| `loading-start` | `loading` wurde aktiviert |
| `loading-end` | `loading` wurde deaktiviert |
| `button-interaction` | Fabric-kompatible Interaktionsmessung fuer Click/Keyboard |
| `button-performance-measured` | Performance-Messpunkt nach Hydration, Update oder Interaktion |

## API

| Methode | Zweck |
|---------|-------|
| `setLoading(loading, options?)` | toggelt den Ladezustand programmatisch |
| `getPerformanceBudget()` | liefert die ms-Budgets des Performance-Profils |
| `getInteractionBudget()` | liefert Click-, Keyboard-, Busy- und Touch-Target-Budgets |
| `snapshotPerformance()` | liefert den aktuellen Snapshot `xtend.component.performance-snapshot.v1` |

## Performance-Profil

`x-button` besitzt das Runtime-Profil `xtend.performance.component-profile.v1` mit:

- `budgetClass`: `interactive-small`
- `lane`: `user-blocking`
- `hydrationPolicy`: `visible`
- `criticalMeasurements`: `xtend.component.hydrate`, `xtend.component.render`, `xtend.component.update`, `xtend.event.handler`, `xtend.interaction.click`, `xtend.interaction.keyboard`
- `budgetsMs`: `hydrate`, `renderUpdate`, `eventAction`, `keyboardAction`, `busyToggle`, `stateSync`

Damit kann der Button von Fabric, Regression-Gates und spaeteren RMT Shells als kleine, user-blocking Interaktion geplant werden.

## RMT und Fabric

Die Komponente deklariert `xtendRmtMetadata` mit `adapter: 'xtend.component'`, `templateMode: 'dom_descriptor'`, `eventBindingMode: 'dom-event-to-rmt-command'` und der Boundary `no-rmt-kernel-import-of-xtend-types`. RMT kann den Button damit authoren und schedulen, ohne XTend-Typen in den Kernel zu importieren.

Fabric konsumiert:

- `button-interaction`
- `button-performance-measured`
- `snapshotPerformance()`
- State-Key `xbutton-state-<id>`

## Styling & Theming

```css
x-button {
  --primary-color: #007bff;
  --focus-color: #80bfff;
  --xtend-button-min-touch-target: 44px;
}
```

Der Button respektiert `prefers-reduced-motion` und `forced-colors`. In Forced-Colors-Modus werden Systemfarben, sichtbarer Fokus und ein textuelles Busy-Signal genutzt.

## Accessibility

- nativer Button im Shadow DOM mit `role="button"`
- sichtbarer `:focus-visible` Zustand
- `aria-disabled` und `aria-busy`
- dekorative Icons mit leerem `alt`
- minimale Touch-Zielflaeche ueber Token
- Keyboard-Aktivierung ueber native Button-Semantik plus Messpunkt fuer `Enter` und `Space`
