# x-toggle

`x-toggle` ist ein formulargebundener Schalter für binäre Einstellungen. Die Komponente kombiniert eine native Checkbox im Shadow DOM mit `ElementInternals`, einem öffentlichen `role="switch"` und XTends State-, RMT- und Fabric-Verträgen. Die Source of Truth ist `src/components/x-toggle/x-toggle.ts`; der Build erzeugt `components/xtoggle.js` und `components/xtoggle.d.ts`.

## Was es löst

Ein Schalter muss sichtbaren Zustand, Formularwert, Tastaturbedienung und Validierung gleichzeitig konsistent halten. `x-toggle` spiegelt den Zustand über die Property `checked`, das gleichnamige Attribut, `aria-checked`, den Formwert und die Events `toggle-changed` beziehungsweise `toggle-invalid`. Dadurch muss ein Host keine private Shadow-DOM-Struktur kennen.

Die Zustandszeichen `I` und `O` im Track ergänzen den Farbwechsel. Eigene kurze Zeichen können über `on-label` und `off-label` eingesetzt werden; der zugängliche Name kommt weiterhin aus `label`, dem `label`-Slot oder dem Standard-Slot.

## Einsatz

Nutze `x-toggle` für unmittelbar wirksame Ja/Nein-Einstellungen wie Benachrichtigungen oder automatische Aktualisierung. Für die Auswahl mehrerer unabhängiger Werte ist [x-checkbox](./xcheckbox.md) geeigneter. Wenn eine Änderung erst zusammen mit weiteren Feldern gespeichert werden soll, sollte die Oberfläche klar machen, dass der Schalter nur einen Formularwert ändert.

`disabled` und `busy` sperren Interaktionen. `required` bedeutet bei diesem Control, dass der eingeschaltete Zustand erforderlich ist. Die Dichte kann mit `comfortable`, `compact` oder `dense` gewählt werden, ohne das 44-Pixel-Interaktionsziel des Performance-Profils stillschweigend zu umgehen.

## Nicht einsetzen, wenn

Verwende `x-toggle` nicht als Aktionsbutton, als Auswahl zwischen mehr als zwei Optionen oder als rein dekorative Statusanzeige. Nutze keine Shadow-DOM-Selektoren, um Zustand zu lesen oder den Thumb zu verschieben. Properties, Attribute, Events, Slots, Parts und Custom Properties sind die öffentliche Integrationsfläche.

## Laden und registrieren

Der lokale Loader löst `x-toggle` über `components/manifest.json` auf. Ein eigener Manifest-Pfad wird mit `data-manifest` angegeben.

```html
<script type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json"></script>

<form id="preferences">
  <x-toggle
    id="notifications"
    name="notifications"
    value="enabled"
    required
    label="Benachrichtigungen">
    <span slot="hint">Informiert dich über neue Aufgaben.</span>
    <span slot="error">Aktiviere Benachrichtigungen, um fortzufahren.</span>
  </x-toggle>
</form>
```

Warte bei einem dynamisch nachgeladenen Host vor dem Methodenaufruf auf `customElements.whenDefined('x-toggle')`. Der Loader und das Manifest bleiben lokal; die Komponente benötigt keine CDN-Runtime.

## Beispiele

Das Änderungsereignis liefert den booleschen Zustand und den Formwert. `reportValidity()` zeigt den Fehlerbereich an, falls ein erforderlicher Schalter ausgeschaltet bleibt.

```js
await customElements.whenDefined('x-toggle');

const toggle = document.querySelector('#notifications');
toggle.addEventListener('toggle-changed', (event) => {
  console.log(event.detail.checked, event.detail.value);
});

document.querySelector('#preferences').addEventListener('submit', (event) => {
  if (!toggle.reportValidity()) event.preventDefault();
});
```

Ein Host darf `toggle.checked = true` setzen oder `toggle.toggle()` aufrufen. Der Wert wird anschließend über `ElementInternals.setFormValue()` mit dem Formular synchronisiert.

## API-Referenz

Attribute:
- `name`
- `value`
- `checked`
- `disabled`
- `required`
- `label`
- `busy`
- `invalid`
- `density`

Events:
- `toggle-changed` mit `{ checked, value, source: "x-toggle" }`
- `toggle-invalid` mit `{ checked, value, message, source: "x-toggle" }`

Properties und Methoden:
- `checked: boolean`
- `value: string`
- `stateKey: string` (read-only)
- `checkValidity(): boolean`
- `reportValidity(): boolean`
- `validate(): boolean`
- `toggle(): void`
- `reset(): void`
- `focus(): void`

Slots:
- `default` und `label` für den zugänglichen Namen
- `hint` für ergänzende Hilfe
- `error` für die Validierungsmeldung
- `on-label` und `off-label` für kurze sichtbare Zustandszeichen

CSS Parts:
- `root`, `control`, `track`, `state`, `thumb`
- `label`, `helper`, `error`, `status`

Wichtige CSS Custom Properties:
- `--xtend-toggle-width`, `--xtend-toggle-height`, `--xtend-toggle-thumb-size`
- `--xtend-toggle-track-off`, `--xtend-toggle-track-on`, `--xtend-toggle-track-border`
- `--xtend-toggle-thumb`, `--xtend-toggle-focus`, `--xtend-toggle-radius`
- `--xtend-form-label-text`, `--xtend-form-helper-text`, `--xtend-form-error-text`
- `--xtend-form-error-surface`, `--xtend-form-error-border`, `--xtend-form-disabled-opacity`

## Theme und Accessibility

Tab setzt den Fokus auf das native Control; Leertaste wechselt den Zustand. `aria-checked`, `aria-required`, `aria-disabled`, `aria-busy`, `aria-invalid` und `aria-describedby` werden aus dem öffentlichen Zustand abgeleitet. Der Error-Bereich verwendet `role="alert"` und `aria-live="assertive"`, Statusänderungen eine höfliche Live Region.

Bei `prefers-reduced-motion: reduce` darf der Zustand nicht allein durch eine Thumb-Animation erkennbar sein. Unter `forced-colors: active` bleiben Fokus und Ein/Aus-Zeichen sichtbar. Theme-Anpassungen sollten bei den dokumentierten Tokens beginnen und erst dann einzelne Parts adressieren.

## Integrationshinweise

- Komponentenvertrag: `xtend.component.contract.v2`
- Form-Control-Profil: `xtend.component.form-control-ux-profile.v1`
- RMT-Vertrag: `xtend.rmt.component-contract.v1`
- Performance-Profil: `xtend.performance.component-profile.v1`
- Schedules: `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input`, `a11y.announce`, `diagnostics.snapshot`

Die Komponente veröffentlicht `xtoggle-checked-<id>` und `xtoggle-state-<id>` in `xstate`. In einer RMT Surface werden `toggle-changed` und `toggle-invalid` als DOM-Events an deklarative Commands gebunden. Weder die Komponente noch ein Wrapper sollte dazu den RMT Kernel importieren.

## Fehlerbehebung

- Bleibt das Element ungestylt, prüfe in `components/manifest.json` den Eintrag `"x-toggle": "./xtoggle.js"` und den Manifest-Pfad des Loaders.
- Fehlt der Formwert, kontrolliere `name`, `value` und ob der Schalter tatsächlich `checked` ist. Ein ausgeschalteter Schalter trägt keinen Wert bei.
- Reagiert die Leertaste nicht, prüfe `disabled`, `busy` und ob ein äußerer Handler das Keyboard-Event vor dem Control stoppt.
- Erscheint `toggle-invalid`, obwohl der Wert optional sein soll, entferne `required` statt den Fehlerbereich mit CSS zu verstecken.
- Fehlt der zugängliche Name, setze `label` oder liefere Text im `label`- beziehungsweise Standard-Slot.

## Nächste Schritte

- [Formulare und Validierung](./xform.md)
- [Komponenten entwickeln](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
