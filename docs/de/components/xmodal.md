# x-modal

x-modal ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-modal steuert überlagerte Oberflächen. Verwende die Open- oder Close-API zusammen mit Fokusverhalten, Escape-Pfad und stabilen CSS Parts, statt den Shadow DOM zu ersetzen. Die Komponente wird aus `components/xmodal.js` geladen, über `components/manifest.json` deklariert und über `components/xmodal.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-modal` ein, wenn du das Verhalten aus dem Profil `overlay` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-modal`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-modal` auf `./xmodal.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-modal id="demo-xmodal"
  open
  overlay
  title="demo"
  content="demo">
  x-modal content
</x-modal>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-modal');
component.addEventListener('modal-opened', (event) => {
  console.log('modal-opened', event.detail);
});
if ('open' in component) {
  component.open();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `open`
- `overlay`
- `title`
- `content`
- `actions`

Events:
- `modal-opened`
- `modal-closed`
- `modal-action`

Methoden:
- `open()`
- `close(options?: { source?: XModalCloseSource })`
- `snapshot()`

Slots:
- Keine benannten Slots; nutze den Standardinhalt, wenn die Komponente Kinder rendert.

CSS Parts:
- `root`
- `overlay-root`
- `backdrop`
- `overlay`
- `surface`
- `overlay-surface`
- `close`
- `control`
- `close-icon`
- `icon`
- `title`
- `content`
- `actions`

CSS Custom Properties:
- `--xtend-overlay-backdrop`
- `--xtend-overlay-bg`
- `--xtend-overlay-surface`
- `--xtend-surface-muted`
- `--xtend-overlay-text`
- `--xtend-text`
- `--xtend-overlay-elevation`
- `--xtend-shadow`
- `--xtend-overlay-radius`
- `--xtend-radius`
- `--xtend-overlay-focus-ring`
- `--xtend-focus-outline`
- `--xtend-overlay-z`
- `--surface-overlay-z`
- `--xmodal-overlay-bg`
- `--modal-backdrop`

## Integrationshinweise

- UX-Profil: `xtend.component.overlay-interaction-ux-profile.v1`.
- State-Key: `modal-open-<id>`.
- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `component.visible.mount`, `component.idle.hydrate`, `overlay.stack.open`, `overlay.stack.close`, `overlay.focus.trap`, `overlay.inert.apply`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-modal` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-modal` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-modal')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
