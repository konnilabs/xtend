# xtextarea - XTend Komponente

> **Siehe auch:** [xform](./xform.md), [xinput](./xinput.md), [xselect](./xselect.md), [xstate](./xstate.md)

## Uebersicht

`<x-textarea>` ist das Long-Form-Input aus `WP-E10-10`. Die Komponente kapselt eine native `textarea`, ist form-associated, schreibt ihren Wert nach `xstate` und bringt RMT-, Fabric-, A11y- und Performance-Metadaten mit.

## Verwendung

```html
<x-textarea id="notes" name="notes" maxlength="240" rows="5" required>
  <span slot="label">Notes</span>
  <span slot="hint">Keep the message concise.</span>
  <span slot="error">A note is required.</span>
</x-textarea>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `name` | String | Formularname |
| `value` | String | aktueller Textwert |
| `placeholder` | String | Platzhaltertext |
| `required` | Boolean | aktiviert native Validierung |
| `disabled` | Boolean | deaktiviert das Control |
| `readonly` | Boolean | macht das Control lesbar |
| `maxlength` | Number | maximale Zeichenanzahl |
| `minlength` | Number | minimale Zeichenanzahl |
| `rows` | Number | sichtbare Zeilen |
| `label` | String | Label ohne Slot |

## Events

| Event | Detail |
|-------|--------|
| `textarea-changed` | `{ value, length, maxLength, source: 'x-textarea' }` |
| `textarea-invalid` | `{ value, message, source: 'x-textarea' }` |

## API

- `element.value`
- `element.maxLength`
- `element.checkValidity()`
- `element.reportValidity()`
- `element.validate()`
- `element.reset()`
- `element.focus()`

## State, RMT und Fabric

`<x-textarea>` schreibt nach `xtextarea-value-<id>` und akzeptiert externe Wertupdates ueber denselben Key. Die RMT-Metadaten nutzen `xtend.rmt.component-contract.v1`, `adapter: 'xtend.component'` und `kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'`. RMT kann das Control als DOM-Descriptor erzeugen und Events wie `textarea-changed` an Scheduler-Kommandos binden.

## A11y und Performance

Das Control nutzt `role="textbox"` ueber die native Textarea, `aria-describedby`, eine polite Counter-Region mit `character-count-announcement` und eine assertive Fehlerregion. Das Performance-Profil ist `xtend.performance.component-profile.v1` mit `budgetClass: 'interactive-medium'`, `lane: 'user-blocking'` und `hydrationPolicy: 'visible'`.

## Form Controls UX ab WP-E11-08

`<x-textarea>` stellt `xtendFormControlUxProfile` mit `xtend.component.form-control-ux-profile.v1` bereit. Das Profil verbindet Label, Hint, Error, `textarea-changed`, `textarea-invalid`, `xtextarea-value-<id>`, `ui.user-blocking.input`, Fabric-Lane `user-blocking` und RMT Shell Authoring.

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: Enterprise-Schreibflaeche mit ruhiger Flaechenqualitaet, Live-Counter und getrennt themebaren Helper-/Error-Rollen.

| Token | Zweck |
| --- | --- |
| `--xtend-form-text` | Host-Textfarbe |
| `--xtend-form-control-surface` | Textarea-Flaeche |
| `--xtend-form-control-text` | Textarea-Text |
| `--xtend-form-label-text` | Label |
| `--xtend-form-helper-text` | Helper und Counter |
| `--xtend-form-error-text` | Fehlertext |
| `--xtend-form-error-surface` | Fehlerflaeche |
| `--xtend-form-error-border` | Fehlerkante und Marker |
| `--xtend-form-focus-ring` | Focus-Outline |
| `--xtend-form-radius` | Textarea-/Error-Radius |
| `--xtend-form-gap` | Meta- und Error-Abstand |
| `--xtend-form-font-family` | Form-Typografie |
| `--xtend-form-control-font-size` | Textarea-Schrift |
| `--xtend-form-helper-font-size` | Helper/Error-Schrift |
| `--xtend-form-icon-color` | Status-/Affordance-Fallback |

Density-Profile: `comfortable`, `compact`, `dense`. Invalid/Error nutzt Kante, Ring und Marker statt ausschliesslich Farbe.

```css
[data-xtend-form-theme="enterprise-foreign"] x-textarea {
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
