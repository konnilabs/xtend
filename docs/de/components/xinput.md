# x-input

x-input ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-input ist auf Formularlogik ausgerichtet. Validierungsereignisse, formulargebundener Zustand sowie Attribute wie disabled oder required sind Teil der öffentlichen Integrationsfläche. Die Komponente wird aus `components/xinput.js` geladen, über `components/manifest.json` deklariert und über `components/xinput.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-input` ein, wenn du das Verhalten aus dem Profil `form` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-input`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-input` auf `./xinput.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-input id="demo-xinput"
  type="info"
  name="demo"
  value="demo"
  placeholder="demo">
  <span slot="label">Demo label</span>
  <span slot="hint">Helpful context</span>
  <span slot="error">Validation message</span>
</x-input>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-input');
component.addEventListener('input-changed', (event) => {
  console.log('input-changed', event.detail);
});
if ('checkValidity' in component) {
  component.checkValidity();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `type`
- `name`
- `value`
- `placeholder`
- `required`
- `disabled`
- `busy`
- `invalid`
- `density`

Events:
- `input-changed`
- `validation-failed`

Methoden:
- `checkValidity()`
- `reportValidity()`
- `validate()`
- `reset()`
- `focus()`

Slots:
- `label`
- `hint`
- `error`

CSS Parts:
- `label`
- `control`
- `helper`
- `error`
- `status`

CSS Custom Properties:
- `--xtend-form-text`
- `--xtend-text`
- `--text-color`
- `--xtend-form-font-family`
- `--xtend-font-family-body`
- `--xtend-form-control-font-size`
- `--xtend-form-control-height`
- `--xtend-form-density-control-height`
- `--xtend-form-control-padding`
- `--xtend-form-density-padding`
- `--xtend-form-control-gap`
- `--xtend-form-gap`
- `--xtend-form-icon-color`
- `--xtend-form-control-text`
- `--xtend-form-status-marker`
- `--xtend-form-dense-font-size`

## Integrationshinweise

- UX-Profil: `xtend.component.form-control-ux-profile.v1`.
- State-Key: `xinput-value-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input`, `a11y.announce`, `diagnostics.snapshot`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-input` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-input` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-input')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
