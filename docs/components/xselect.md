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

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: Enterprise-Select mit klarer nativer Affordance, nicht-farblicher Validierung und density-sicherem Label-/Helper-Rhythmus.

| Token | Zweck |
| --- | --- |
| `--xtend-form-text` | Host-Textfarbe |
| `--xtend-form-control-surface` | Select-Flaeche |
| `--xtend-form-control-text` | Select-Text |
| `--xtend-form-label-text` | Label |
| `--xtend-form-helper-text` | Helper |
| `--xtend-form-error-text` | Fehlertext |
| `--xtend-form-error-surface` | Fehlerflaeche |
| `--xtend-form-error-border` | Fehlerkante und Marker |
| `--xtend-form-focus-ring` | Focus-Outline |
| `--xtend-form-radius` | Select- und Error-Radius |
| `--xtend-form-gap` | Vertikaler Rhythmus |
| `--xtend-form-font-family` | Form-Typografie |
| `--xtend-form-control-font-size` | Select-Schrift |
| `--xtend-form-helper-font-size` | Helper/Error-Schrift |
| `--xtend-form-icon-color` | Native Select-Affordance |

Density-Profile: `comfortable`, `compact`, `dense`. Invalid, `disabled`, `required` und `busy` werden visuell und per ARIA gespiegelt.

```css
[data-xtend-form-theme="enterprise-foreign"] x-select {
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
