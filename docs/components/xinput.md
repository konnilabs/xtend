# xinput – XTend Komponente

> **Siehe auch:** [xform](./xform.md), [xstate](./xstate.md)

## Übersicht

`<x-input>` ist ein vielseitiges Eingabefeld mit Theming, State-Integration und voller Unterstützung für Formulare.

---

## Features
- Standard-Input mit Slot für Label
- State-Integration via xstate
- Theming via CSS Custom Properties
- Form-Integration

---

## Verwendung

```html
<x-input value="Hallo"></x-input>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| `value`     | String  | Wert des Eingabefelds                |
| `type`      | String  | Typ des Inputs (text, number, etc.)  |
| `placeholder`| String | Platzhaltertext                      |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| `input`       | Bei Eingabe ausgelöst                |
| `change`      | Bei Wertänderung ausgelöst           |
| `input-changed` | aktueller XTend-Contract bei Wertänderung, Detail: `{ value }` |
| `validation-failed` | Validierungsfehler, Detail: `{ value }` |

---

## API
- **Wert setzen/lesen:** `element.value = 'Text'`
- **State-Integration:** Automatisch via xstate
- **Validierung:** `element.checkValidity()`, `element.reportValidity()`
- **Reset:** `element.reset()`

## State-Contract ab ER-WP-33

`<x-input>` schreibt seinen Wert nach `xinput-value-<id>` und reagiert auf externe Änderungen dieses Keys. Die Validierungsregion nutzt `role="alert"` und `aria-live="assertive"`, sodass Formularfehler nicht nur farblich, sondern auch semantisch sichtbar werden.

## Form Controls UX ab WP-E11-08

`<x-input>` stellt `xtendFormControlUxProfile` mit `xtend.component.form-control-ux-profile.v1` bereit. Das Profil bindet Label, Hint, Error, `input-changed`, `validation-failed`, `xinput-value-<id>`, `ui.user-blocking.input`, Fabric-Lane `user-blocking` und RMT Shell Authoring zusammen.

---

## Beispiel: Dynamisch per JS

```js
const input = document.createElement('x-input');
input.value = 'Hallo';
document.body.appendChild(input);
```

---

## Styling & Theming

```css
x-input {
  --input-border: 1px solid #ccc;
  --input-bg: #fff;
  --input-bg-dark: #0f0f12;
  --input-placeholder-color-dark: #b8c4d4;
}
```

`<x-input>` nutzt automatisch `--xtend-surface` und `--xtend-text` aus `x-theme`. In `data-theme="dark"` wird ein dunkler Hintergrund ueber `--input-bg-dark`, `--xtend-control-bg-dark` oder den Theme-Surface-Fallback gesetzt, damit Text und Suchfelder in der Docs-App lesbar bleiben.

---

## Accessibility
- Label-Slot, ARIA, Form-Integration

---

*Letzte Aktualisierung: 16. Juli 2025*
