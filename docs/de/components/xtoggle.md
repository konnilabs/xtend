# x-toggle - XTend Komponente

`x-toggle` ist ein TypeScript-first Form-Control fuer binaere Einstellungen. Die Laufzeit wird aus `src/components/x-toggle/x-toggle.ts` ueber `tsc` nach `components/xtoggle.js` und `components/xtoggle.d.ts` gebaut und in `components/manifest.json` als `"x-toggle": "./xtoggle.js"` registriert.

## Laden und Registrieren

```html
<script type="module" src="/xtend-loader.js"></script>
<x-toggle name="notifications" value="enabled" checked label="Benachrichtigungen"></x-toggle>
```

Der Schalter nutzt eine native Checkbox im Shadow DOM, `static formAssociated = true`, ElementInternals/FormData und `role="switch"`. Der sichtbare Status wird ueber `aria-checked` gespiegelt. `on-label` und `off-label` sind nur sichtbare Kurzzeichen; der Default nutzt `I` fuer ein und `O` fuer aus. Der Accessible Name kommt aus `label`, dem `label`-Slot oder dem Default-Slot.

## API

Attribute: `name`, `value`, `checked`, `disabled`, `required`, `label`, `busy`, `invalid`, `density`.

Slots: `default`, `label`, `hint`, `error`, `on-label`, `off-label`.

Default-Statuszeichen: `I` im eingeschalteten Zustand, `O` im ausgeschalteten Zustand. Laengere sichtbare Texte koennen ueber `on-label` und `off-label` gesetzt werden, sollten aber nicht den Accessible Name ersetzen.

Events:

- `toggle-changed` mit `{ checked, value, source: "x-toggle" }`
- `toggle-invalid` mit `{ checked, value, message, source: "x-toggle" }`

Properties und Methoden: `checked`, `value`, `stateKey`, `toggle()`, `reset()`, `validate()`, `checkValidity()`, `reportValidity()`, `focus()`.

## A11y und Form

`x-toggle` reagiert auf Klick, Touch und Space. `disabled` und `busy` blockieren Interaktion. `required` setzt bei ausgeschaltetem Zustand einen nativen Validity-Fehler, `invalid`, `aria-invalid` und ein assertives Error-Region-Slot.

Wichtige ARIA-Marker: `role="switch"`, `aria-checked`, `aria-invalid`, `aria-required`, `aria-disabled`, `aria-busy`, `aria-describedby`.

## XState, RMT und Fabric

Die Komponente veroeffentlicht `xtoggle-checked-<id>` und `xtoggle-state-<id>` in `xstate`. Das RMT-Profil nutzt `xtend.rmt.component-contract.v1`, Shell-Authoring, DOM-Event-to-RMT-Command und den Kernel-Boundary `no-rmt-kernel-import-of-xtend-types`.

Das Form-Control-Profil ist `xtend.component.form-control-ux-profile.v1`. Das Performance-Profil ist `xtend.performance.component-profile.v1`, Budget-Klasse `interactive-small`, Lane `user-blocking` mit A11y- und Diagnostics-Lanes. `signatureDesign` orientiert sich am klassischen Switch-Muster der Apple Human Interface Guidelines Toggles.

## Theme, Density und ECH-WP-08

Density-Profile: `comfortable`, `compact`, `dense`.

Invalid und Busy sind nicht nur farblich sichtbar: der Error-Slot nutzt einen Inline-Start-Marker, die Track-Validierung einen zusaetzlichen Ring und `busy` zeigt einen reduzierbaren Statusindikator.

Token-Tabelle:

| Token | Zweck |
| --- | --- |
| `--xtend-form-text` | Textfarbe |
| `--xtend-form-control-surface` | Track-Off Surface |
| `--xtend-form-control-text` | Status-/Icon-Kontrast |
| `--xtend-form-label-text` | Label |
| `--xtend-form-helper-text` | Hint |
| `--xtend-form-error-text` | Fehlertext |
| `--xtend-form-error-surface` | Fehlerflaeche |
| `--xtend-form-error-border` | Fehlerkontur |
| `--xtend-form-focus-ring` | Fokus |
| `--xtend-form-radius` | Track-Radius |
| `--xtend-form-gap` | Abstand |
| `--xtend-form-font-family` | Schrift |
| `--xtend-form-control-font-size` | Control-Schriftgroesse |
| `--xtend-form-helper-font-size` | Hilfetext |
| `--xtend-form-icon-color` | Status-/Icon-Farbe |

Beispiel:

```html
<x-toggle name="alerts" value="enabled" required label="Alerts" density="comfortable">
  <span slot="hint">Sendet Updates sofort.</span>
  <span slot="error">Aktiviere Alerts zum Fortfahren.</span>
</x-toggle>
```
