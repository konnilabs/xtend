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

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: Praezises Enterprise-Textfeld mit ruhiger Flaeche, klarer Status-Typografie und dichter, aber lesbarer Form-Rhythmik.

| Token | Zweck |
| --- | --- |
| `--xtend-form-text` | Host-Textfarbe |
| `--xtend-form-control-surface` | Eingabeflaeche |
| `--xtend-form-control-text` | Eingabetext |
| `--xtend-form-label-text` | Label |
| `--xtend-form-helper-text` | Helper/Hinweis |
| `--xtend-form-error-text` | Fehlertext |
| `--xtend-form-error-surface` | Fehlerflaeche |
| `--xtend-form-error-border` | Fehlerkante und Marker |
| `--xtend-form-focus-ring` | Native Focus-Outline |
| `--xtend-form-radius` | Control- und Error-Radius |
| `--xtend-form-gap` | Label-, Helper- und Error-Abstand |
| `--xtend-form-font-family` | Form-Typografie |
| `--xtend-form-control-font-size` | Control-Schrift |
| `--xtend-form-helper-font-size` | Helper/Error-Schrift |
| `--xtend-form-icon-color` | Icon-/Affordance-Farbe fuer Controls mit Icon |

Density-Profile: `density="comfortable"`, `density="compact"` und `density="dense"`. Invalid/Error ist nicht farb-only: Control-Kante, innerer Ring und Error-Marker bleiben auch in Dark/Forced-Colors erkennbar.

```css
[data-xtend-form-theme="enterprise-foreign"] x-input {
  --xtend-form-control-surface: #fbf8f2;
  --xtend-form-control-text: #16231f;
  --xtend-form-label-text: #22312c;
  --xtend-form-helper-text: #596861;
  --xtend-form-error-text: #7d231c;
  --xtend-form-error-border: #a64036;
  --xtend-form-focus-ring: 3px solid #8f4f2a;
  --xtend-form-radius: 0.35rem;
}
```
