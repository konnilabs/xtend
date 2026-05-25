# x-header

x-header ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-header prägt sichtbares Layout oder Medienflächen. Attribute, Slots und Tokens sind stabiler als DOM-Umschreibungen und halten responsive Messungen nachvollziehbar. Die Komponente wird aus `components/xheader.js` geladen, über `components/manifest.json` deklariert und über `components/xheader.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-header` ein, wenn du das Verhalten aus dem Profil `display` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-header`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-header` auf `./xheader.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-header id="demo-xheader"
  src="/docs/assets/rmt-stack-topography.svg"
  logo-size="demo"
  title="demo"
  sticky="demo">
  x-header content
</x-header>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-header');
component.addEventListener('header-ready', (event) => {
  console.log('header-ready', event.detail);
});
if ('toggleMenu' in component) {
  component.toggleMenu();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `src`
- `logo-size`
- `title`
- `sticky`
- `shadow`
- `menu-mode`
- `menu-placement`
- `menu-modal`
- `menu-open`
- `menu-breakpoint`
- `menu-width`
- `menu-max-height`
- `menu-align`

Events:
- `header-ready`
- `header-layout-changed`
- `menu-before-open`
- `menu-before-close`
- `menu-opened`
- `menu-closed`
- `menu-mode-changed`
- `menu-placement-changed`
- `logo-loaded`

Methoden:
- `toggleMenu(open: boolean)`
- `toggleMenu(open: boolean, options?: XHeaderToggleMenuOptions)`
- `isMenuOpen()`
- `snapshot()`

Slots:
- `title`
- `search`
- `actions`
- `utility`
- `nav`
- `logo`

CSS Parts:
- `root`
- `brand`
- `title`
- `logo`
- `search`
- `actions`
- `utility`
- `trigger`
- `control`
- `trigger-icon`
- `icon`
- `backdrop`
- `menu`
- `drawer`
- `nav`
- `menu-surface`

CSS Custom Properties:
- `--header-reserved-block-size`
- `--xtend-layout-reserved-block-size`
- `--header-slot-template-areas`
- `--header-tablet-slot-template-areas`
- `--header-mobile-slot-template-areas`
- `--header-title-grid-area`
- `--header-search-grid-area`
- `--header-actions-grid-area`
- `--header-trigger-grid-area`
- `--xtend-nav-`
- `--xtend-nav-surface`
- `--xtend-nav-text`
- `--xtend-nav-border-color`
- `--xtend-nav-radius`
- `--xtend-nav-gap`
- `--xtend-nav-font-family`

## Integrationshinweise

- UX-Profil: `xtend.component.layout-display-media-ux-profile.v1`, `xtend.component.navigation-routing-ux-profile.v1`.
- State-Key: `xheader-state-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- Menu Presentation Modes: `drawer`, `side-panel`, `popover`, `fullscreen`, `inline-main`.
- Legacy CSS Parts remain documented for older drawer skins.
- Menu attributes: `menu-mode`, `menu-placement`, `menu-modal`, `menu-open`, `menu-breakpoint`, `menu-width`, `menu-max-height`, `menu-align`.
- Menu events: `menu-before-open`, `menu-before-close`, `menu-mode-changed`, `menu-placement-changed`.
- Menu tokens: `--xtend-header-menu-width`, `--xtend-header-menu-max-height`, `--xtend-header-menu-backdrop`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-header` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-header` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-header')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
