# x-surface-region

x-surface-region ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-surface-region prägt sichtbares Layout oder Medienflächen. Attribute, Slots und Tokens sind stabiler als DOM-Umschreibungen und halten responsive Messungen nachvollziehbar. Die Komponente wird aus `components/xsurfaceregion.js` geladen, über `components/manifest.json` deklariert und über `components/xsurfaceregion.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-surface-region` ein, wenn du das Verhalten aus dem Profil `display, stateful` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-surface-region`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-surface-region` auf `./xsurfaceregion.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-surface-region id="demo-xsurfaceregion"
  surface-id="demo"
  label="Demo"
  kind="demo"
  open>
  x-surface-region content
</x-surface-region>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-surface-region');
component.addEventListener('surface-region-command', (event) => {
  console.log('surface-region-command', event.detail);
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
- `kind`
- `open`
- `active`
- `hidden`
- `mode`
- `placement`
- `initial-x`
- `initial-y`
- `initial-width`
- `initial-height`
- `initial-min-width`
- `initial-min-height`
- `initial-max-width`
- `initial-max-height`
- `bounds-mode`
- `bounds-scope`
- `role`

Events:
- `surface-region-command`

Methoden:
- `toSurfaceRecord(managerId: string)`
- `applySurfaceSnapshot(record: XtendSurfaceRecord)`
- `openRegion()`
- `closeRegion(reason?: string)`
- `focusRegion()`
- `restoreRegion()`
- `updateRegion(payload?: Record<string, unknown>)`

Slots:
- `default`

CSS Parts:
- `region`

CSS Custom Properties:
- `--surface-region-x`
- `--surface-region-y`
- `--surface-region-width`
- `--surface-region-height`
- `--surface-region-z`
- `--surface-region-active-outline`

## Integrationshinweise

- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `surface.visible.render`, `surface.user-blocking.open`, `surface.transition.layout`, `surface.diagnostics.snapshot`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-surface-region` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-surface-region` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-surface-region')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
