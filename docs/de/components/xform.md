# x-form

x-form ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-form ist auf Formularlogik ausgerichtet. Validierungsereignisse, formulargebundener Zustand sowie Attribute wie disabled oder required sind Teil der öffentlichen Integrationsfläche. Die Komponente wird aus `components/xform.js` geladen, über `components/manifest.json` deklariert und über `components/xform.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-form` ein, wenn du das Verhalten aus dem Profil `form, stateful` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-form`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-form` auf `./xform.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-form id="demo-xform"
  density="demo"
  busy
  invalid="demo"
  disabled>
  x-form content
</x-form>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-form');
component.addEventListener('submit', (event) => {
  console.log('submit', event.detail);
});
if ('getFormData' in component) {
  component.getFormData();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `density`
- `busy`
- `invalid`
- `disabled`

Events:
- `submit`
- `invalid`
- `reset`

Methoden:
- `getFormData()`
- `validate()`
- `submit()`
- `reset()`

Slots:
- `default`
- `status`
- `error`

CSS Parts:
- `root`
- `form`
- `label`
- `control`
- `icon`
- `helper`
- `status`
- `error`

CSS Custom Properties:
- `--xtend-form-text`
- `--text-color`
- `--xtend-form-font-family`
- `--xtend-font-family-body`
- `--xtend-form-control-height`
- `--xtend-form-density-control-height`
- `--xtend-form-control-padding`
- `--xtend-form-density-padding`
- `--xtend-form-control-gap`
- `--xtend-form-gap`
- `--xtend-form-control-surface`
- `--xtend-control-bg`
- `--xtend-form-surface`
- `--xtend-form-control-text`
- `--xtend-form-label-text`
- `--xtend-form-helper-text`

## ECH-WP-08 Theme/A11y-Hardening

ECH-WP-08 dokumentiert die Form-Control Tokens fuer `x-form` als oeffentlichen Theme-Vertrag. `signatureDesign` bleibt ein ruhiger Formularrahmen mit klarer Error-, Hint- und Submit-Hierarchie. Density-Profile: `comfortable`, `compact`, `dense`. Invalid: Fehlerzustaende werden ueber Text, Error-Surface, Border, Fokus-Ring und ARIA gespiegelt.

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
- State-Key: `xform-data-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `ui.user-blocking.input`, `a11y.announce`, `diagnostics.snapshot`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-form` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-form` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-form')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
