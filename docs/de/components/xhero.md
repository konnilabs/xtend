# x-hero

x-hero ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-hero prägt sichtbares Layout oder Medienflächen. Attribute, Slots und Tokens sind stabiler als DOM-Umschreibungen und halten responsive Messungen nachvollziehbar. Die Komponente wird aus `components/xhero.js` geladen, über `components/manifest.json` deklariert und über `components/xhero.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-hero` ein, wenn du das Verhalten aus dem Profil `display` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-hero`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-hero` auf `./xhero.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-hero id="demo-xhero"
  background="demo"
  background-light="demo"
  background-dark="demo"
  background-image="demo">
  x-hero content
</x-hero>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-hero');
component.addEventListener('hero-rendered', (event) => {
  console.log('hero-rendered', event.detail);
});
if ('scrollPast' in component) {
  component.scrollPast();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `background`
- `background-light`
- `background-dark`
- `background-image`
- `align`
- `vertical-align`
- `fullheight`
- `overlay`
- `overlay-light`
- `overlay-dark`
- `animate`
- `scroll-button`
- `font-color`
- `font-color-light`
- `font-color-dark`
- `text-box`

Events:
- `hero-rendered`
- `hero-animated`

Methoden:
- `scrollPast()`
- `snapshot()`

Slots:
- `hero-title`
- `default`

CSS Parts:
- `root`
- `overlay`
- `content`
- `scroll-button`
- `control`
- `scroll-icon`
- `icon`

CSS Custom Properties:
- `--hero-reserved-block-size`
- `--xtend-layout-reserved-block-size`
- `--hero-bg`
- `--hero-text`
- `--overlay-color`
- `--xtend-layout-surface`
- `--xtend-layout-surface-default`
- `--xtend-layout-text-default`
- `--xtend-layout-overlay-default`
- `--hero-max-width`
- `--xtend-layout-content-max`
- `--hero-radius`
- `--xtend-layout-radius`
- `--hero-media-radius`
- `--xtend-layout-media-radius`
- `--hero-blur`

## Integrationshinweise

- UX-Profil: `xtend.component.layout-display-media-ux-profile.v1`.
- State-Key: `xhero-state-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-hero` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-hero` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-hero')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
