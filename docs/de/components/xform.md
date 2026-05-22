# xform – XTend Komponente

> **Siehe auch:** [xinput](./xinput.md), [xselect](./xselect.md), [xcheckbox](./xcheckbox.md), [xradio](./xradio.md), [xtextarea](./xtextarea.md), [xcalendar](./xcalendar.md), [xstate](./xstate.md)

## Übersicht

`<x-form>` ist eine flexible Formular-Komponente, die beliebige Inhalte kapselt und State-Integration sowie Theming unterstützt.

---

## Features
- Flexibles Layout für Formulare
- Slot für beliebige Inhalte
- State-Integration via xstate
- Aggregation von `x-input`, `x-slider`, `x-calendar`, `x-select`, `x-checkbox`, `x-radio` und `x-textarea`
- Theming via CSS Custom Properties

---

## Verwendung

```html
<x-form>
  <input type="text" />
  <x-button>Absenden</x-button>
</x-form>
```

---

## Attribute
| Attribut    | Typ     | Beschreibung                        |
|-------------|---------|-------------------------------------|
| –           | –       | –                                   |

---

## Events
| Event         | Beschreibung                        |
|---------------|-------------------------------------|
| `submit`      | Wird beim Absenden ausgelöst         |
| `invalid`     | Wird bei fehlgeschlagener Kind-Validierung ausgelöst |
| `reset`       | Wird nach Formular-Reset ausgelöst |

---

## API
- **Formular per JS absenden:** `element.submit()`
- **Formulardaten lesen:** `element.getFormData()`
- **State-Integration:** Automatisch via xstate

## State- und Validierungscontract ab ER-WP-33

`<x-form>` sammelt Werte aus `x-input`, `x-slider`, `x-calendar`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea` und `x-writer`, spiegelt sie nach `xform-data-<id>` und aktualisiert diesen Key bei `input-changed`, `select-changed`, `checkbox-changed`, `radio-changed`, `textarea-changed`, `date-select` und `writer:change`. Checkboxen liefern Boolean-Werte, Radio-Gruppen liefern den Wert des aktivierten Controls. Der Shadow DOM enthaelt `role="form"`, eine `role="status"` Region fuer Submit/Reset-Rueckmeldungen und eine `role="alert"` Region fuer Validierungsfehler.

## Form Controls UX ab WP-E11-08

`<x-form>` stellt `xtendFormControlUxProfile` mit `xtend.component.form-control-ux-profile.v1` bereit. Das Profil beschreibt den Form Host, `submit`, `invalid`, `reset`, `xform-data-<id>`, Validation Aggregation, Fabric-Lane `user-blocking` und RMT Shell Authoring.

---

## Beispiel: Dynamisch per JS

```js
const form = document.createElement('x-form');
form.innerHTML = '<input type="text" />';
document.body.appendChild(form);
```

---

## Styling & Theming

```css
x-form {
  --form-gap: 2em;
  --form-border: 2px solid #007bff;
}
```

---

## Accessibility
- Semantisches HTML, ARIA

---

*Letzte Aktualisierung: 16. Juli 2025*

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: Enterprise-Formhost mit hochwertiger Surface-Komposition, aggregierten Statusregionen und density-sicherem Rhythmus fuer verschachtelte Controls.

| Token | Zweck |
| --- | --- |
| `--xtend-form-text` | Form-Textfarbe |
| `--xtend-form-surface` | Form-Flaeche |
| `--xtend-form-control-surface` | Child-Control-Flaeche |
| `--xtend-form-control-text` | Child-Control-Text |
| `--xtend-form-label-text` | Label-Cascade |
| `--xtend-form-helper-text` | Helper-Cascade |
| `--xtend-form-error-text` | Error-Cascade |
| `--xtend-form-error-surface` | Error-Cascade-Flaeche |
| `--xtend-form-error-border` | Form- und Error-Kante |
| `--xtend-form-focus-ring` | Focus-Cascade |
| `--xtend-form-radius` | Form- und Control-Radius |
| `--xtend-form-gap` | Form- und Control-Abstand |
| `--xtend-form-font-family` | Form-Typografie |
| `--xtend-form-control-font-size` | Control-Schrift |
| `--xtend-form-helper-font-size` | Helper-/Error-Schrift fuer Child Controls |
| `--xtend-form-icon-color` | Child-Control-Icon-Akzent |

Density-Profile: `comfortable`, `compact`, `dense`. `busy`, `disabled` und Invalid werden am Formhost als Flaechenzustand und via ARIA gespiegelt.

```css
[data-xtend-form-theme="enterprise-foreign"] x-form {
  --xtend-form-surface: #fffaf2;
  --xtend-form-control-surface: #fbf8f2;
  --xtend-form-text: #16231f;
  --xtend-form-label-text: #22312c;
  --xtend-form-helper-text: #596861;
  --xtend-form-error-text: #7d231c;
  --xtend-form-error-border: #a64036;
  --xtend-form-focus-ring: 3px solid #8f4f2a;
  --xtend-form-radius: 0.45rem;
  --xtend-form-gap: 0.8rem;
}
```
