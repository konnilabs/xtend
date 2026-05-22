# xcalendar – XTend Komponente

> **Siehe auch:** [xcards](./xcards.md), [xform](./xform.md), [xstate](./xstate.md)

## Übersicht

`<x-calendar>` ist ein moderner, barrierearmer Kalender mit Form-Integration, State-Management und Theming. Er eignet sich für Datumsauswahl und Terminverwaltung.

---

## Features
- Form-assoziiert (HTML5 Form API)
- State-Integration via xstate
- Theming via CSS Custom Properties
- Responsive Design

---

## Verwendung

```html
<x-calendar></x-calendar>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| `value`     | String  | Ausgewähltes Datum (ISO-Format)      |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| `change`      | Wird bei Datumsauswahl ausgelöst     |
| `date-select` | aktueller XTend-Contract bei Datumsauswahl, Detail: `{ value, date }` |

---

## API
- **Wert setzen/lesen:** `element.value = '2025-07-16'`
- **State-Integration:** Automatisch via xstate

## Component-Level-Contract ab ER-WP-33

`<x-calendar>` ist form-associated, schreibt Auswahl und View-Date nach `xcalendar-state-<id>` und rendert die Monatsansicht als ARIA-Grid. Tageszellen nutzen `role="gridcell"` und `aria-selected`; Monatsnavigation wird ueber beschriftete Buttons angeboten.

## Form Controls UX ab WP-E11-08

`<x-calendar>` stellt `xtendFormControlUxProfile` mit `xtend.component.form-control-ux-profile.v1` bereit. Das Profil verbindet Datumsauswahl, `date-select`, `xcalendar-state-<id>`, `ui.user-blocking.input`, Grid-A11y, Fabric-Lane `user-blocking` und RMT Shell Authoring.

---

## Beispiel: Dynamisch per JS

```js
const cal = document.createElement('x-calendar');
cal.value = '2025-07-16';
document.body.appendChild(cal);
```

---

## Styling & Theming

```css
x-calendar {
  --border-color: #ccc;
  --background-color: #fff;
}
```

---

## Accessibility
- ARIA-Rollen, Keyboard-Navigation

---

*Letzte Aktualisierung: 16. Juli 2025*
