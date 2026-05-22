# xradio – XTend Komponente

> **Siehe auch:** [xform](./xform.md), [xinput](./xinput.md), [xstate](./xstate.md)

## Uebersicht

`<x-radio>` vervollstaendigt die TypeScript-first Selection Controls aus `WP-E10-09`. Die Komponente koordiniert Gruppen ueber `name`, unterstuetzt Keyboard-Navigation und liefert RMT-, Fabric-, A11y- und Performance-Metadaten fuer RMT-first Apps.

## Verwendung

```html
<x-radio id="plan-starter" name="plan" value="starter">
  <span slot="label">Starter</span>
</x-radio>
<x-radio id="plan-pro" name="plan" value="pro" checked>
  <span slot="label">Pro</span>
</x-radio>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `name` | String | Gruppen- und Formularname |
| `value` | String | Wert des Radio-Controls |
| `checked` | Boolean | aktueller Auswahlzustand |
| `required` | Boolean | aktiviert Validierung |
| `disabled` | Boolean | deaktiviert das Control |
| `label` | String | ARIA-/Textlabel ohne Slot |

## Slots

| Slot | Zweck |
|------|-------|
| `label` | sichtbares Label |
| `hint` | zusaetzlicher Hinweistext |
| `error` | Validierungsfehler |

## Events

| Event | Detail |
|-------|--------|
| `radio-changed` | `{ checked, value, name, source: 'x-radio' }` |
| `radio-invalid` | `{ checked, value, name, message, source: 'x-radio' }` |

## API

- `element.checked`
- `element.value`
- `element.name`
- `element.check()`
- `element.checkValidity()`
- `element.reportValidity()`
- `element.validate()`
- `element.reset()`
- `element.focus()`

## State, RMT und Fabric

`<x-radio>` schreibt den Einzelzustand nach `xradio-checked-<id>` und den Gruppenwert nach `xradio-value-<name>`. Die RMT-Metadaten nutzen `xtend.rmt.component-contract.v1`; RMT kann eine Radio-Gruppe als DOM-Descriptor templaten und die UI ueber `xtend.component` schedulen, ohne XTend in den RMT-Kernel zu importieren.

## A11y und Performance

Die Komponente nutzt `role="radio"`, `aria-checked`, `aria-describedby`, Space-Aktivierung sowie Arrow-Key-Navigation innerhalb der Gruppe. Das Performance-Profil ist `xtend.performance.component-profile.v1` mit `budgetClass: 'interactive-small'`, `lane: 'user-blocking'` und `hydrationPolicy: 'visible'`.

## Form Controls UX ab WP-E11-08

`<x-radio>` stellt `xtendFormControlUxProfile` mit `xtend.component.form-control-ux-profile.v1` bereit. Das Profil verbindet Label, Hint, Error, `radio-changed`, `radio-invalid`, `xradio-value-<name>`, `ui.user-blocking.input`, Fabric-Lane `user-blocking` und RMT Shell Authoring.

## ECH-WP-08 Form Theme/A11y Hardening

`signatureDesign`: Enterprise-Radio-Option mit robuster nativer Fokusfuehrung, gruppensicherer Validierung und separat themebarem Selection-Icon.

| Token | Zweck |
| --- | --- |
| `--xtend-form-text` | Host-Textfarbe |
| `--xtend-form-control-surface` | Native Control-Flaeche |
| `--xtend-form-control-text` | Control-Text-Fallback |
| `--xtend-form-label-text` | Label |
| `--xtend-form-helper-text` | Helper |
| `--xtend-form-error-text` | Fehlertext |
| `--xtend-form-error-surface` | Fehlerflaeche |
| `--xtend-form-error-border` | Fehlerkante und Marker |
| `--xtend-form-focus-ring` | Focus-Outline |
| `--xtend-form-radius` | Radio-/Error-Radius |
| `--xtend-form-gap` | Label-/Helper-Abstand |
| `--xtend-form-font-family` | Form-Typografie |
| `--xtend-form-control-font-size` | Label-Schrift |
| `--xtend-form-helper-font-size` | Helper/Error-Schrift |
| `--xtend-form-icon-color` | Radio-Akzent |

Density-Profile: `comfortable`, `compact`, `dense`. Invalid ist nicht farb-only und wird per `aria-invalid` gespiegelt.

```css
[data-xtend-form-theme="enterprise-foreign"] x-radio {
  --xtend-form-icon-color: #8f4f2a;
  --xtend-form-label-text: #22312c;
  --xtend-form-helper-text: #596861;
  --xtend-form-error-text: #7d231c;
  --xtend-form-error-border: #a64036;
  --xtend-form-focus-ring: 3px solid #8f4f2a;
}
```
