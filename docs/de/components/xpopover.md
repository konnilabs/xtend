# x-popover

x-popover ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-popover steuert überlagerte Oberflächen. Verwende die Open- oder Close-API zusammen mit Fokusverhalten, Escape-Pfad und stabilen CSS Parts, statt den Shadow DOM zu ersetzen. Die Komponente wird aus `components/xpopover.js` geladen, über `components/manifest.json` deklariert und über `components/xpopover.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-popover` ein, wenn du das Verhalten aus dem Profil `overlay, interactive` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-popover`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-popover` auf `./xpopover.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-popover id="demo-xpopover"
  open
  placement="end"
  modal
  anchor="demo">
  <button slot="trigger" type="button">Open</button>
  <p>Projected content</p>
</x-popover>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-popover');
component.addEventListener('popover-opened', (event) => {
  console.log('popover-opened', event.detail);
});
if ('toggle' in component) {
  component.toggle();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `open`
- `placement`
- `modal`
- `anchor`
- `label`

Events:
- `popover-opened`
- `popover-closed`

Methoden:
- `toggle()`
- `snapshot()`

Slots:
- `trigger`
- `default`
- `actions`

CSS Parts:
- `trigger`
- `backdrop`
- `root`
- `surface`
- `overlay-surface`
- `close`
- `control`
- `close-icon`
- `icon`
- `content`
- `actions`

CSS Custom Properties:
- `--xtend-overlay-surface`
- `--xtend-surface`
- `--xtend-overlay-text`
- `--xtend-text`
- `--xtend-overlay-border-color`
- `--xtend-border-color`
- `--xtend-overlay-elevation`
- `--xtend-shadow-overlay`
- `--xtend-overlay-radius`
- `--xtend-radius`
- `--xtend-overlay-backdrop`
- `--xtend-overlay-bg`
- `--xtend-overlay-focus-ring`
- `--xtend-focus-color`
- `--xtend-color-primary`
- `--xtend-overlay-z`

## Integrationshinweise

- UX-Profil: `xtend.component.overlay-interaction-ux-profile.v1`.
- State-Key: `xpopover-open-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input`, `overlay.popover.position`, `diagnostics.snapshot`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-popover` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-popover` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-popover')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
