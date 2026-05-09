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
