# xcheckbox – XTend Komponente

> **Siehe auch:** [xform](./xform.md), [xinput](./xinput.md), [xstate](./xstate.md)

## Uebersicht

`<x-checkbox>` ist das TypeScript-first Binary-Control aus `WP-E10-09`. Es ist form-associated, unterstuetzt `checked` und `indeterminate`, meldet Aenderungen ueber XTend Events und kann von RMT als framework-agnostische UI-Komponente scheduled werden.

## Verwendung

```html
<x-checkbox id="terms" name="terms" required checked>
  <span slot="label">Nutzungsbedingungen akzeptieren</span>
  <span slot="error">Die Zustimmung ist erforderlich.</span>
</x-checkbox>
```

## Attribute

| Attribut | Typ | Beschreibung |
|----------|-----|--------------|
| `name` | String | Formularname |
| `value` | String | Formularwert bei aktivem Zustand, Standard `on` |
| `checked` | Boolean | aktueller Auswahlzustand |
| `indeterminate` | Boolean | visueller Mischzustand |
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
| `checkbox-changed` | `{ checked, value, source: 'x-checkbox' }` |
| `checkbox-invalid` | `{ checked, value, message, source: 'x-checkbox' }` |

## API

- `element.checked`
- `element.value`
- `element.indeterminate`
- `element.toggle()`
- `element.checkValidity()`
- `element.reportValidity()`
- `element.validate()`
- `element.reset()`
- `element.focus()`

## State, RMT und Fabric

`<x-checkbox>` schreibt nach `xcheckbox-checked-<id>`. RMT sieht die Komponente ueber `xtend.rmt.component-contract.v1` als DOM-Descriptor und nicht als XTend-Kernel-Abhaengigkeit. Die Fabric-Metadaten binden Events an die `user-blocking` Lane und halten den Boundary-String `no-rmt-kernel-import-of-xtend-types` sichtbar.

## A11y und Performance

Das Control spiegelt `aria-checked`, `aria-describedby`, `required` und `disabled` auf die native Checkbox. Das Performance-Profil nutzt `xtend.performance.component-profile.v1` mit `budgetClass: 'interactive-small'`, `lane: 'user-blocking'` und `hydrationPolicy: 'visible'`.

## Form Controls UX ab WP-E11-08

`<x-checkbox>` stellt `xtendFormControlUxProfile` mit `xtend.component.form-control-ux-profile.v1` bereit. Das Profil verbindet Label, Hint, Error, `checkbox-changed`, `checkbox-invalid`, `xcheckbox-checked-<id>`, `ui.user-blocking.input`, Fabric-Lane `user-blocking` und RMT Shell Authoring.
