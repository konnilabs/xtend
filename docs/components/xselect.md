# xselect – XTend Komponente

> **Siehe auch:** [xform](./xform.md), [xinput](./xinput.md), [xstate](./xstate.md)

## Uebersicht

`<x-select>` ist das TypeScript-first Selection-Control aus `WP-E10-09`. Die Komponente kapselt ein natives `select`, bleibt form-associated, schreibt ihren Wert nach `xstate` und besitzt RMT-, Fabric-, A11y- und Performance-Metadaten ohne XTend in den RMT-Kernel einzubetten.

## Verwendung

```html
<x-select id="plan-select" name="plan" value="pro" required>
  <span slot="label">Plan</span>
  <option value="starter">Starter</option>
  <option value="pro">Pro</option>
  <span slot="error">Bitte einen Plan waehlen.</span>
</x-select>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `name` | String | Formularname |
| `value` | String | aktueller Wert |
| `multiple` | Boolean | erlaubt Mehrfachauswahl |
| `required` | Boolean | aktiviert native Validierung |
| `disabled` | Boolean | deaktiviert das Control |
| `placeholder` | String | optionale Platzhalteroption |
| `label` | String | ARIA-/Textlabel ohne Slot |

## Slots

| Slot | Zweck |
|------|-------|
| default | `option`-Elemente fuer das native Select |
| `label` | sichtbares Label |
| `hint` | zusaetzlicher Hinweistext |
| `error` | Validierungsfehler |

## Events

| Event | Detail |
|-------|--------|
| `select-changed` | `{ value, values, source: 'x-select' }` |
| `select-invalid` | `{ value, message, source: 'x-select' }` |

## API

- `element.value`
- `element.values`
- `element.checkValidity()`
- `element.reportValidity()`
- `element.validate()`
- `element.reset()`
- `element.focus()`

## State, RMT und Fabric

`<x-select>` schreibt nach `xselect-value-<id>` und reagiert auf externe Wertupdates. Die RMT-Metadaten nutzen `xtend.rmt.component-contract.v1`, `adapter: 'xtend.component'` und `kernelBoundary: 'no-rmt-kernel-import-of-xtend-types'`. Shell-first Templates koennen die Komponente als DOM-Descriptor schedulen, waehrend XTend die UI-Oberflaeche bleibt.

## A11y und Performance

Das Control nutzt `role="combobox"`, `aria-describedby`, sichtbare Label-/Hint-/Error-Slots und eine assertive Fehlerregion. Das Performance-Profil ist `xtend.performance.component-profile.v1` mit `budgetClass: 'interactive-medium'`, `lane: 'user-blocking'` und `hydrationPolicy: 'visible'`.

## Form Controls UX ab WP-E11-08

`<x-select>` stellt `xtendFormControlUxProfile` mit `xtend.component.form-control-ux-profile.v1` bereit. Das Profil verbindet Label, Hint, Error, `select-changed`, `select-invalid`, `xselect-value-<id>`, `ui.user-blocking.input`, Fabric-Lane `user-blocking` und RMT Shell Authoring.
