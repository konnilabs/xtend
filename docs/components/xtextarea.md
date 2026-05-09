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
