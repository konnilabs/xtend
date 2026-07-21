# x-router

x-router ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-router nimmt an Navigation teil. Route-Zustand, aktive Markierung und Router-Ereignisse bleiben explizit, damit ein Host Verlauf, Fokus und Ansagen synchron halten kann. Die Komponente wird aus `components/xrouter.js` geladen, über `components/manifest.json` deklariert und über `components/xrouter.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-router` ein, wenn du das Verhalten aus dem Profil `routing` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-router`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-router` auf `./xrouter.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-router id="demo-xrouter"
  mode="hash"
  routesrc="demo"
  reuse-component="demo"
  skeleton
  skeleton-profile="route">
  <x-route path="/" component="x-section">Home</x-route>
</x-router>
```

`skeleton-profile` verweist auf ein mit `XTendSkeletonLoader.registerProfile()` registriertes, strukturiertes Profil. Der Router übernimmt daraus stabile Zeilen, Tracks und Mindesthöhen; `skeleton-lines` und `skeleton-min-height` bleiben gezielte Overrides. Ein unbekanntes Profil degradiert auf das eingebaute `route`-Profil und führt kein HTML aus.

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-router');
component.addEventListener('xrouter-before-navigate', (event) => {
  console.log('xrouter-before-navigate', event.detail);
});
if ('focusRoute' in component) {
  component.focusRoute();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

### Serverseitig vorgerenderte Route übernehmen

Mit `adopt-prerendered-route` kann ein Host genau einen bereits sichtbaren, direkten Route-Knoten bereitstellen. Der Router prüft Pfad, optionale Route-ID, Locale, Component-Tag sowie Content- und Trust-Marker und verschiebt denselben Knoten in sein Outlet. Die Route-Komponente implementiert dafür `adoptRoute(context)` oder kompatibel `updateRoute(context)` und ergänzt nur Verhalten; der Host muss den Artikel nicht nochmals in einem Bootstrap-Payload ablegen.

```html
<x-router mode="history" adopt-prerendered-route>
  <x-route path="/docs/de/start" component="docs-page"
    data-rmt-route-id="docs.start"></x-route>
  <docs-page data-xrouter-prerendered-route
    data-xrouter-route-path="/docs/de/start"
    data-xrouter-route-id="docs.start"
    data-xrouter-route-locale="de"
    data-xrouter-route-component="docs-page"
    data-xrouter-content-sha256="…">
    <!-- bereits serverseitig bereinigter Inhalt mit passendem Trust-Nachweis -->
  </docs-page>
</x-router>
```

Erfolg und kontrollierte Ablehnung werden als `xrouter-route-adopted` mit dem Schema `xtend.router.route-adoption.v1` veröffentlicht. Bei abweichenden Nachweisen verwirft der Router den Kandidaten und verwendet den normalen Skeleton-/Renderpfad.

## API-Referenz

Attribute:
- `mode`
- `routesrc`
- `reuse-component`
- `adopt-prerendered-route`
- `skeleton`
- `skeleton-profile`
- `skeleton-lines`
- `skeleton-min-height`
- `title-template`
- `document-title-template`
- `title-prefix`
- `title-suffix`
- `default-title`
- `path`
- `component`
- `import`
- `title`
- `document-title`
- `meta-description`
- `meta-keywords`
- `hydrate-schedule`

Events:
- `xrouter-before-navigate`
- `route-changed`
- `routechange`
- `xrouter-after-navigate`
- `route-announced`
- `xrouter-routes-registered`
- `xrouter-route-reused`
- `xrouter-route-adopted`
- `xrouter-skeleton-shown`
- `xrouter-skeleton-hidden`
- `xrouter-route-hydrated`
- `xrouter-scroll-boundary-normalized`
- `xrouter-navigation-overlays-closed`
- `xrouter-title-updated`
- `xrouter-route-import-refused`

Methoden:
- `focusRoute(detail?: XRouterRouteChangeDetail | null)`
- `announceRoute(detail?: XRouterRouteChangeDetail | null)`
- `snapshot()`

Slots:
- Keine benannten Slots; nutze den Standardinhalt, wenn die Komponente Kinder rendert.

CSS Parts:
- `root`
- `outlet`
- `announcer`

CSS Custom Properties:
- `--xtend-router-reserved-block-size`
- `--xtend-layout-reserved-block-size`
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

## Integrationshinweise

- UX-Profil: `xtend.component.navigation-routing-ux-profile.v1`.
- State-Key: `xtend.router.current`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `route.visible.render`, `route.transition.render`, `route.focus.restore`, `component.dynamic.hydrate`, `a11y.announce`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-router` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-router` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-router')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
