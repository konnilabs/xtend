# x-side-panel

x-side-panel ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-side-panel steuert überlagerte Oberflächen. Verwende die Open- oder Close-API zusammen mit Fokusverhalten, Escape-Pfad und stabilen CSS Parts, statt den Shadow DOM zu ersetzen. Die Komponente wird aus `components/xsidepanel.js` geladen, über `components/manifest.json` deklariert und über `components/xsidepanel.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-side-panel` ein, wenn du das Verhalten aus dem Profil `overlay, stateful, interactive` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-side-panel`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-side-panel` auf `./xsidepanel.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-side-panel id="demo-xsidepanel"
  surface-id="demo"
  label="Demo"
  open
  active>
  x-side-panel content
</x-side-panel>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-side-panel');
component.addEventListener('surface-panel-command', (event) => {
  console.log('surface-panel-command', event.detail);
});
if ('toSurfaceRecord' in component) {
  component.toSurfaceRecord();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `surface-id`
- `label`
- `open`
- `active`
- `minimized`
- `collapsed`
- `pinned`
- `mode`
- `placement`
- `responsive-mode`
- `resizable`
- `collapsible`
- `collapsable` (Legacy-Alias fuer `collapsible`)
- `closable`
- `pinnable`
- `route-aware`
- `modal`
- `initial-width`
- `initial-height`

Events:
- `surface-panel-command`

Methoden:
- `toSurfaceRecord(managerId: string)`
- `applySurfaceSnapshot(record: XtendSurfaceRecord)`
- `openPanel()`
- `closePanel(reason?: string)`
- `focusPanel()`
- `minimizePanel()`
- `pinPanel()`
- `collapsePanel()`
- `expandPanel(mode?: XSidePanelMode)`
- `setPanelMode(mode: XSidePanelMode, placement?: XSidePanelPlacement)`
- `resizePanel(bounds: Partial<XtendSurfaceRecord['bounds']>)`
- `restorePanel()`

Slots:
- `default`

CSS Parts:
- `backdrop`
- `scrim`
- `root`
- `surface`
- `overlay-surface`
- `header`
- `title`
- `actions`
- `pin`
- `control`
- `pin-icon`
- `icon`
- `collapse`
- `collapse-icon`
- `close`
- `close-icon`

CSS Custom Properties:
- `--xtend-overlay-surface`
- `--xtend-surface`
- `--section-bg`
- `--xtend-overlay-text`
- `--xtend-text`
- `--text-color`
- `--xtend-overlay-border-color`
- `--xtend-border-color`
- `--border-color`
- `--xtend-overlay-elevation`
- `--xtend-shadow-overlay`
- `--xtend-elevation-2`
- `--xtend-overlay-backdrop`
- `--xtend-overlay-bg`
- `--xtend-overlay-focus-ring`
- `--xtend-focus-color`

## Integrationshinweise

- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `surface.visible.render`, `surface.user-blocking.open`, `surface.user-blocking.close`, `surface.transition.layout`, `surface.diagnostics.snapshot`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Verwende `collapsible`, `closable="false"` und `pinnable="false"`, um die Panel-Chrome fuer fokussierte Produktshells zu begrenzen. Diese Flags wirken auf die sichtbaren Header-Controls und auf die erzeugten Surface-Record-Capabilities; ein nicht schliessbares Panel bewirbt also keine `close`-Aktion.

Surface-Modi bleiben Teil des Runtime-Vertrags: `docked`, `overlay`, `pinned`, `collapsed`, `fullscreen` und die responsive Vorgabe `fullscreen-under-720`.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-side-panel` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-side-panel` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-side-panel')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
