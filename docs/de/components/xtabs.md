# x-tabs

x-tabs ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-tabs nimmt an Navigation teil. Route-Zustand, aktive Markierung und Router-Ereignisse bleiben explizit, damit ein Host Verlauf, Fokus und Ansagen synchron halten kann. Die Komponente wird aus `components/xtabs.js` geladen, über `components/manifest.json` deklariert und über `components/xtabs.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-tabs` ein, wenn du das Verhalten aus dem Profil `interactive, routing` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-tabs`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-tabs` auf `./xtabs.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-tabs id="demo-xtabs"
  selected="0"
  orientation="horizontal"
  text-color="demo">
  <x-tab>Overview</x-tab>
  <x-tab>Details</x-tab>
</x-tabs>
```

Nutze `orientation="vertical"`, wenn ein Settings-Panel oder eine dichte Shell von einer linken Tab-Schiene profitiert. Vertikale Tabs setzen `aria-orientation="vertical"` auf der Tablist und behalten dasselbe `tab-selected` Event.

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-tabs');
component.addEventListener('tab-selected', (event) => {
  console.log('tab-selected', event.detail);
});
if ('selectTab' in component) {
  component.selectTab();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `selected`
- `text-color`
- `orientation`

Events:
- `tab-selected`
- `xtend-command`

Methoden:
- `selectTab(index: number)`
- `getPerformanceBudget()`
- `snapshotPerformance()`

Slots:
- `default`

CSS Parts:
- Keine öffentlichen CSS Parts in der aktuellen Laufzeit erkannt.

CSS Custom Properties:
- `--xtend-nav-`
- `--xtend-nav-surface`
- `--xtend-nav-text`
- `--xtend-nav-border-color`
- `--xtend-nav-radius`
- `--xtend-nav-gap`
- `--xtend-nav-font-family`
- `--xtend-nav-font-size`
- `--xtend-nav-active-surface`
- `--xtend-nav-active-text`
- `--xtend-nav-current-indicator`
- `--xtend-nav-hover-surface`
- `--xtend-nav-focus-ring`
- `--xtend-nav-disabled-opacity`
- `--xtend-surface-panel`
- `--xtend-signature-surface-panel`

## Integrationshinweise

- UX-Profil: `xtend.component.navigation-routing-ux-profile.v1`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `component.visible.hydrate`, `ui.user-blocking.tabs`, `route.transition.tab`, `diagnostics.snapshot`.
- Keyboard-Navigation: `ArrowRight`, `ArrowLeft`, `ArrowUp`, `ArrowDown`, `Home`, `End`, `aria-controls`, `bubbles: true`, `composed: true`, `snapshotPerformance()`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-tabs` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-tabs` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-tabs')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## ECH-WP-09 Token-Tabelle und Navigation States

`signatureDesign`: `x-tabs` erzeugt eine eigenstaendige Enterprise-Tabnavigation mit sichtbarer Selected-Schiene, wrap-sicheren Labels und frei austauschbarer Typografie. Active/Current/Selected, Hover, Focus und Disabled sind ueber gemeinsame Navigationstokens themebar.

| Token | Zweck |
| --- | --- |
| `--xtend-nav-surface` | Tablist-Surface |
| `--xtend-nav-text` | Tab-Text |
| `--xtend-nav-border-color` | Tab- und Tablist-Kanten |
| `--xtend-nav-radius` | Tab-Radius |
| `--xtend-nav-gap` | Abstand zwischen Tabs |
| `--xtend-nav-font-family` | Tab-Typografie |
| `--xtend-nav-font-size` | Tab-Textgroesse |
| `--xtend-nav-active-surface` | Selected-Flaeche |
| `--xtend-nav-active-text` | Selected-Text |
| `--xtend-nav-current-indicator` | nicht farb-only Selected-Indikator |
| `--xtend-nav-hover-surface` | Hover-Flaeche |
| `--xtend-nav-focus-ring` | Tastaturfokus |
| `--xtend-nav-disabled-opacity` | Disabled-Dimmung |

## ECH-WP-09 Keyboard-Verhalten

`ArrowRight`, `ArrowLeft`, `Home`, `End`, `Enter` und `Space` bleiben die verbindlichen Tasten. Disabled Tabs werden nicht fokussiert oder aktiviert. Active/Current/Selected wird ueber `aria-selected="true"` am Tab und `role="tabpanel"` am Panel gespiegelt; Route-Tabs koennen zusaetzlich `aria-current="page"` durch Host-Logik tragen.

## ECH-WP-09 Fremdtheme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-tabs {
  --xtend-nav-surface: #f3f0e8;
  --xtend-nav-text: #202520;
  --xtend-nav-border-color: rgba(32, 37, 32, 0.24);
  --xtend-nav-radius: 0.35rem;
  --xtend-nav-gap: 0.4rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 0.95rem;
  --xtend-nav-active-surface: #243c34;
  --xtend-nav-active-text: #fff9ed;
  --xtend-nav-current-indicator: #a65f2d;
  --xtend-nav-hover-surface: rgba(166, 95, 45, 0.14);
  --xtend-nav-focus-ring: 3px solid #a65f2d;
  --xtend-nav-disabled-opacity: 0.42;
}
```
