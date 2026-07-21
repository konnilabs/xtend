# x-textarea

x-textarea ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-textarea ist auf Formularlogik ausgerichtet. Validierungsereignisse, formulargebundener Zustand sowie Attribute wie disabled oder required sind Teil der öffentlichen Integrationsfläche. Die Komponente wird aus `components/xtextarea.js` geladen, über `components/manifest.json` deklariert und über `components/xtextarea.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-textarea` ein, wenn du das Verhalten aus dem Profil `form, stateful` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-textarea`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-textarea` auf `./xtextarea.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-textarea id="demo-xtextarea"
  name="demo"
  value="demo"
  placeholder="demo"
  line-numbering="false"
  required>
  <span slot="label">Demo label</span>
  <span slot="hint">Helpful context</span>
  <span slot="error">Validation message</span>
</x-textarea>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-textarea');
component.addEventListener('textarea-changed', (event) => {
  console.log('textarea-changed', event.detail);
});
if ('checkValidity' in component) {
  component.checkValidity();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

Editor-Oberflächen können `line-numbering="true"` setzen. Dann rendert `x-textarea` eine Monaco-ähnliche Zeilennummernspalte im Shadow DOM; `line-numbering="false"` oder ein fehlendes Attribut deaktiviert sie. Das ist vor allem für RMT-Playgrounds und Diagnosepanels nützlich, weil Compilerfehler mit Zeilennummern direkt neben der Quelle lesbar werden.

Prompt-Oberflächen können `submit-on-enter` setzen. In diesem Modus löst Enter `textarea-submit` aus und reicht die Eingabe an das nächste Formular weiter, sofern das Event nicht abgebrochen wird. Shift+Enter behält das native Textarea-Verhalten und erzeugt eine neue Zeile.

Mit `submit-command` erhält das anschließende `xtend-command` einen expliziten RMT-Command-Namen; ohne das Attribut bleibt der Command leer und kann über die normale Event-Bindung geroutet werden.

`textarea-changed` und `textarea-submit` liefern `value`, `length`, `trimmedLength`, `empty`, `maxLength` und `source`. `textarea-changed` ergänzt den Highlight-Status. `textarea-invalid` liefert `value`, `message` und `source`; `xtend-command` verwendet den öffentlichen `XtendRmtCommandDetail` mit dem jeweiligen Textarea-Payload. Ein Aufruf von `reportValidity()` emittiert pro fehlgeschlagener Prüfung genau ein natives `textarea-invalid`.

## API-Referenz

Attribute:
- `name`
- `value`
- `placeholder`
- `required`
- `disabled`
- `readonly`
- `maxlength`
- `minlength`
- `rows`
- `label`
- `busy`
- `invalid`
- `density`
- `fill`
- `submit-on-enter`
- `submit-command`
- `syntax-highlight`
- `highlight`
- `line-numbering`
- `lang`
- `language`

Events:
- `textarea-changed`
- `textarea-invalid`
- `textarea-submit`
- `xtend-command`

Methoden:
- `checkValidity()`
- `reportValidity()`
- `validate()`
- `reset()`
- `focus()`
- `snapshot()`

Slots:
- `label`
- `hint`
- `error`

CSS Parts:
- `label`
- `editor`
- `highlight`
- `syntax`
- `highlight-code`
- `syntax-code`
- `line-numbers`
- `line-number`
- `control`
- `helper`
- `status`
- `error`

CSS Custom Properties:
- `--xtend-form-control-min-height`
- `--xtend-form-text`
- `--text-color`
- `--xtend-form-font-family`
- `--xtend-font-family-body`
- `--xtend-form-control-font-size`
- `--xtend-form-density-control-min-height`
- `--textarea-min-height`
- `--xtend-form-control-padding`
- `--xtend-form-density-padding`
- `--xtend-form-control-gap`
- `--xtend-form-gap`
- `--xtend-form-icon-color`
- `--xtend-form-control-text`
- `--xtend-textarea-code-font-family`
- `--x-code-font-family`
- `--xtend-textarea-line-number-width`
- `--xtend-textarea-line-number-gap`
- `--xtend-textarea-line-number-text`
- `--xtend-textarea-line-number-border`
- `--xtend-textarea-line-number-surface`

## Theme und Accessibility

`signatureDesign` bleibt ein mehrzeiliges Eingabefeld mit klarer Label-, Hint- und Error-Hierarchie. Density-Profile: `comfortable`, `compact`, `dense`. Invalid: Fehlerzustände werden über Text, Error-Surface, Border, Fokus-Ring und ARIA gespiegelt.

Token-Tabelle:
- `--xtend-form-text`
- `--xtend-form-control-surface`
- `--xtend-form-control-text`
- `--xtend-form-label-text`
- `--xtend-form-helper-text`
- `--xtend-form-error-text`
- `--xtend-form-error-surface`
- `--xtend-form-error-border`
- `--xtend-form-focus-ring`
- `--xtend-form-radius`
- `--xtend-form-gap`
- `--xtend-form-font-family`
- `--xtend-form-control-font-size`
- `--xtend-form-helper-font-size`
- `--xtend-form-icon-color`

## Integrationshinweise

- UX-Profil: `xtend.component.form-control-ux-profile.v1`.
- State-Key: `xtextarea-value-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input`, `diagnostics.snapshot`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Ein RMT-State kann die gesamte Attributfläche über gleichnamige Felder steuern; für `minlength`, `maxlength`, `submit-on-enter`, `submit-command`, `syntax-highlight` und `line-numbering` werden die camelCase-Felder `minLength`, `maxLength`, `submitOnEnter`, `submitCommand`, `syntaxHighlight` und `lineNumbering` verwendet. Die Statefelder `label`, `hint` und `error` werden als echte Slots materialisiert, sodass kein Zugriff auf den Shadow DOM nötig ist.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-textarea` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-textarea` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-textarea')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
