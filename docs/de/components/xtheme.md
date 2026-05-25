# x-theme

x-theme ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-theme ist als theme, stateful klassifiziert. Die dokumentierten Attribute, Ereignisse und Methoden bilden den stabilen Vertrag. Die Komponente wird aus `components/xtheme.js` geladen, über `components/manifest.json` deklariert und über `components/xtheme.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-theme` ein, wenn du das Verhalten aus dem Profil `theme, stateful` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-theme`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-theme` auf `./xtheme.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-theme id="demo-xtheme"
  data-xtend-motion="demo"
  data-xtend-contrast="demo"></x-theme>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-theme');
component.addEventListener('theme-initialized', (event) => {
  console.log('theme-initialized', event.detail);
});
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `data-xtend-motion`
- `data-xtend-contrast`

Events:
- `theme-initialized`
- `theme-changed`
- `theme-variable-changed`
- `theme-preference-changed`
- `theme-a11y-announcement`
- `theme-density-changed`
- `theme-context-changed`
- `theme-performance-measured`

Methoden:
- Keine öffentlichen Methoden außer HTMLElement-Methoden.

Slots:
- Keine benannten Slots; nutze den Standardinhalt, wenn die Komponente Kinder rendert.

CSS Parts:
- Keine öffentlichen CSS Parts in der aktuellen Laufzeit erkannt.

CSS Custom Properties:
- `--xtend-color-action`
- `--xtend-color-primary`
- `--xtend-color-action-hover`
- `--xtend-color-primary-dark`
- `--xtend-color-action-subtle`
- `--xtend-signature-accent-soft`
- `--xtend-color-danger`
- `--xtend-error-bg`
- `--xtend-color-warning`
- `--xtend-warning-bg`
- `--xtend-color-success`
- `--xtend-success-bg`
- `--xtend-surface-page`
- `--xtend-surface`
- `--xtend-surface-panel`
- `--xtend-surface-muted`

## Integrationshinweise

- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `theme.provider.initialize`, `theme.user-blocking.apply`, `theme.density.apply`, `theme.propagate.context`, `diagnostics.snapshot`.
- RMT Hosts nutzen diese Seite als Integrationshinweis für die serviceartige Laufzeitgrenze.
- Theme API markers: `getDesignTokenContract()`, `registerTheme(name, definition)`, `setDensity(density)`, `getDesignTokens(themeName?)`, `dense`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-theme` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-theme` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-theme')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
