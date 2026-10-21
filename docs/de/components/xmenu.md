# x-menu

x-menu ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-menu ist als interactive klassifiziert. Die dokumentierten Attribute, Ereignisse und Methoden bilden den stabilen Vertrag. Die Komponente wird aus `components/xmenu.js` geladen, über `components/manifest.json` deklariert und über `components/xmenu.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-menu` ein, wenn du das Verhalten aus dem Profil `interactive` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-menu`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-menu` auf `./xmenu.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-menu id="demo-xmenu">
  x-menu content
</x-menu>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-menu');
component.addEventListener('menu-item-clicked', (event) => {
  console.log('menu-item-clicked', event.detail);
});
if ('getPerformanceBudget' in component) {
  component.getPerformanceBudget();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- Keine komponentenspezifischen Attribute außer Standard-HTML-Attributen.

Events:
- `menu-item-clicked`
- `menu-navigate`
- `menu-keyboard-navigation`
- `menu-performance-measured`
- `x-navigate`
- `xtend-command`

Methoden:
- `getPerformanceBudget()`
- `getInteractionBudget()`
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
- `--xtend-surface-muted`

## Integrationshinweise

- UX-Profil: `xtend.component.navigation-routing-ux-profile.v1`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `component.visible.hydrate`, `ui.user-blocking.navigation`, `route.transition.navigate`, `route.visible.render`, `diagnostics.snapshot`.
- Aktuelle Seite und Tastaturfokus sind getrennt: Nur ein zur Route passender oder explizit markierter Eintrag erhält `aria-current="page"`; `focusIndex` hält unabhängig davon genau einen Eintrag über den roving Tabindex erreichbar.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-menu` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-menu` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-menu')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## ECH-WP-09 Token-Tabelle und Navigation States

`signatureDesign`: `x-menu` nutzt eine ruhige Enterprise-Menueleiste mit klar sichtbarer aktiver Route, nicht farb-only Current-Indikator und frei ersetzbarer Typografie. Active/Current/Selected, Hover, Focus und Disabled muessen in Fremdthemes sichtbar bleiben.

| Token | Zweck |
| --- | --- |
| `--xtend-nav-surface` | Menue-Surface |
| `--xtend-nav-text` | Menue- und Item-Text |
| `--xtend-nav-border-color` | Menuekante |
| `--xtend-nav-radius` | Menue- und Item-Radius |
| `--xtend-nav-gap` | Abstand zwischen Navigationseintraegen |
| `--xtend-nav-font-family` | Navigationstypografie |
| `--xtend-nav-font-size` | Navigationstextgroesse |
| `--xtend-nav-active-surface` | Active/Current/Selected Flaeche |
| `--xtend-nav-active-text` | Active/Current/Selected Text |
| `--xtend-nav-current-indicator` | nicht farb-only Route-Indikator |
| `--xtend-nav-hover-surface` | Hover-Flaeche |
| `--xtend-nav-focus-ring` | Tastaturfokus |
| `--xtend-nav-disabled-opacity` | Disabled-Dimmung |

## ECH-WP-09 Keyboard-Verhalten

`ArrowRight`, `ArrowDown`, `ArrowLeft`, `ArrowUp`, `Home`, `End`, `Enter` und `Space` bleiben gatebar. Disabled Items werden nicht aktiviert und beim Roving Focus uebersprungen. Verschachtelte Menues duerfen Disclosure Controls nur mit Icon Controls wie `part="disclosure-icon control icon"` oder autorisierten `x-icon`-Elementen darstellen, nicht mit Textglyphen.

## ECH-WP-09 Fremdtheme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-menu {
  --xtend-nav-surface: #f7f4ee;
  --xtend-nav-text: #19231f;
  --xtend-nav-border-color: rgba(25, 35, 31, 0.24);
  --xtend-nav-radius: 0.4rem;
  --xtend-nav-gap: 0.35rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 0.96rem;
  --xtend-nav-active-surface: #173f35;
  --xtend-nav-active-text: #fffaf0;
  --xtend-nav-current-indicator: #b56b35;
  --xtend-nav-hover-surface: rgba(181, 107, 53, 0.14);
  --xtend-nav-focus-ring: 3px solid #b56b35;
  --xtend-nav-disabled-opacity: 0.44;
}
```
