# x-surface-manager

x-surface-manager ist eine öffentliche XTend Komponentenreferenz für Drittanbieter, die die Komponente ohne internes Projektwissen einbinden müssen.

## Was es löst

x-surface-manager steuert überlagerte Oberflächen. Verwende die Open- oder Close-API zusammen mit Fokusverhalten, Escape-Pfad und stabilen CSS Parts, statt den Shadow DOM zu ersetzen. Die Komponente wird aus `components/xsurfacemanager.js` geladen, über `components/manifest.json` deklariert und über `components/xsurfacemanager.d.ts` typisiert. Damit ist diese Seite ein praktischer Vertrag: Ein Host sieht, welche Attribute stabil sind, welche Events abonniert werden können, welche Methoden aufrufbar sind und welche CSS-Hooks zur Anpassung vorgesehen sind.

Nutze diese Seite, wenn du XTend in eine Produktshell, ein Micro Frontend, eine CMS-Seite oder eine RMT Surface integrierst. Der Fokus liegt auf der öffentlichen Oberfläche und nicht auf internen Details; externe Teams können die Hinweise deshalb direkt als Integrationsbasis verwenden.

## Einsatz

Setze `x-surface-manager` ein, wenn du das Verhalten aus dem Profil `overlay, stateful` brauchst und eine lokale Web Component mit XTend Theming, Accessibility und Scheduling-Konventionen verwenden möchtest. Das passt besonders gut, wenn der Host framework-neutral bleiben, Komponenten lokal laden und CDN-Abhängigkeiten vermeiden soll.

Drittanbieter sollten zuerst die dokumentierten Attribute, Slots, Events und Methoden verwenden. Wrapper sind möglich, sollten die öffentliche API aber durchreichen und nicht in den Shadow DOM greifen.

## Nicht einsetzen, wenn

Vermeide `x-surface-manager`, wenn du Verhalten brauchst, das nicht durch die dokumentierte API abgedeckt ist, oder wenn dein Host `xtend-loader.js` und `components/manifest.json` nicht laden kann. Verlasse dich nicht auf private Klassennamen, erzeugte interne Knoten oder nicht gelistete State-Keys. Für Designvarianten sind Tokens, CSS Parts oder Slots stabiler als ein Fork der Laufzeitdatei.

## Laden und registrieren

Lade den XTend Loader einmal pro Seite. Der Loader liest das lokale Manifest und löst `x-surface-manager` auf `./xsurfacemanager.js` auf. Die Manifest-URL sollte same-origin bleiben, sofern deine Sicherheitsrichtlinie keine andere Quelle erlaubt.

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-surface-manager id="demo-xsurfacemanager"
  layout="demo"
  restore-key="demo"
  route-aware
  modal-policy="demo">
  x-surface-manager content
</x-surface-manager>
```

## Beispiele

Das Integrationsbeispiel zeigt das Host-Muster: Element abfragen, das erste öffentliche Event abonnieren, sofern eines existiert, und eine öffentliche Methode erst nach dem Upgrade aufrufen. So bleiben Hydration und RMT-Materialisierung nachvollziehbar.

```js
const component = document.querySelector('x-surface-manager');
component.addEventListener('surface-manager-ready', (event) => {
  console.log('surface-manager-ready', event.detail);
});
if ('registerSurface' in component) {
  component.registerSurface();
}
```

Für produktive Oberflächen sollten IDs stabil bleiben, wenn State-Keys oder Diagnoseeinträge `<id>` enthalten. Stabile IDs machen Ereignisprotokolle, RMT Schedules und Browser-Tests zwischen Deployments vergleichbar.

## API-Referenz

Attribute:
- `layout`
- `restore-key`
- `route-aware`
- `modal-policy`
- `manager-id`
- `state-key`
- `persistence-mode`
- `restore-policy`
- `surface-loading-policy`
- `surface-skeleton`
- `surface-hydration-timeout`
- `route-lifecycle-policy`
- `layout-engine`
- `surface-layout-gap`
- `surface-layout-snap`
- `remote-surface-policy`
- `remote-origin-allowlist`
- `remote-capabilities`

Events:
- `surface-manager-ready`
- `surface-registered`
- `surface-materialized`
- `surface-opened`
- `surface-closed`
- `surface-focused`
- `surface-updated`
- `surface-layout-changed`
- `surface-snapshot-persisted`
- `surface-snapshot-restored`
- `surface-snapshot-cleared`
- `surface-snapshot-reset`
- `surface-restore-skipped`
- `surface-persistence-error`
- `surface-content-loading`
- `surface-content-hydrated`
- `surface-content-hydration-skipped`
- `surface-content-hydration-error`
- `surface-route-lifecycle-applied`
- `surface-route-lifecycle-skipped`
- `surface-stack-policy-applied`
- `surface-stack-policy-escape`
- `surface-stack-policy-focus`
- `surface-stack-policy-focus-restored`
- `surface-stack-policy-error`
- `surface-layout-engine-applied`
- `surface-region-command`
- `surface-portal-policy`
- `remote-surface-mounted`
- `remote-surface-degraded`
- `remote-surface-refused`
- `remote-surface-event-governed`
- `remote-surface-event-refused`

Methoden:
- `registerSurface(surface: HTMLElement | Record<string, unknown>)`
- `openSurface(id: string, input?: Record<string, unknown>)`
- `closeSurface(id: string, reason?: string)`
- `focusSurface(id: string)`
- `updateSurface(id: string, patch?: Record<string, unknown>)`
- `moveSurface(id: string, bounds: Record<string, unknown>)`
- `resizeSurface(id: string, bounds: Record<string, unknown>)`
- `minimizeSurface(id: string)`
- `maximizeSurface(id: string)`
- `restoreSurface(id: string)`
- `materializeSurface(id: string, input?: Record<string, unknown>)`
- `toggleSurface(id: string, input?: Record<string, unknown>)`
- `readSnapshot()`
- `pinSurface(id: string, pinned?: boolean)`
- `collapseSurface(id: string)`
- `expandSurface(id: string, mode?: string)`
- `dockSurface(id: string, placement?: string, mode?: string)`
- `undockSurface(id: string, bounds?: Record<string, unknown>)`
- `snapshot()`
- `snapshotSurfaceLoading()`
- `hydrateSurfaceContent(surfaceRef: string | HTMLElement | Record<string, unknown>, options?: Record<string, unknown>)`
- `snapshotRouteLifecycle()`
- `applyRouteLifecycle(routeInput?: string | Event | Record<string, unknown> | null, options?: Record<string, unknown>)`
- `snapshotStackPolicy()`
- `applyStackPolicy(options?: Record<string, unknown>)`
- `snapshotSurfaceLayout()`
- `applyLayoutEngine(engine?: XSurfaceManagerLayoutEngine, options?: Record<string, unknown>)`
- `evaluateRemoteSurfacePolicy(surfaceInput?: Record<string, unknown>, options?: Record<string, unknown>)`
- `applyRemoteSurfacePolicy(surfaceInput?: Record<string, unknown>, options?: Record<string, unknown>)`
- `registerRemoteSurface(remoteSurface?: Record<string, unknown>, options?: Record<string, unknown>)`
- `snapshotRemoteSurfacePolicy()`
- `governRemoteSurfaceEvent(eventInput?: Record<string, unknown>, payload?: Record<string, unknown>, options?: Record<string, unknown>)`
- `snapshotPersistence(options?: Record<string, unknown>)`
- `persistSnapshot(snapshot?: XtendSurfaceSnapshot, options?: Record<string, unknown>)`
- `restorePersistedSnapshot(options?: Record<string, unknown>)`
- `clearPersistedSnapshot(options?: Record<string, unknown>)`
- `resetSurfaceLayout(options?: Record<string, unknown>)`

Slots:
- `windows`
- `panels`
- `overlays`
- `default`

CSS Parts:
- `root`
- `workspace`
- `panels`
- `overlays`
- `surface-tray`
- `surface-tray-button`
- `surface-tray-popover`

CSS Custom Properties:
- `--surface-manager-min-height`
- `--surface-manager-color`
- `--xtend-text`
- `--text-color`
- `--surface-manager-bg`
- `--xtend-surface-muted`
- `--surface-muted`
- `--surface-manager-tray-offset`
- `--surface-manager-tray-z`
- `--surface-manager-tray-hover-bridge-width`
- `--surface-manager-tray-hover-bridge-height`
- `--surface-manager-tray-border`
- `--xtend-border-color`
- `--border-color`
- `--surface-manager-tray-radius`
- `--surface-manager-tray-bg`

## Integrationshinweise

- RMT contract: `xtend.rmt.component-contract.v1`.
- Performance profile: `xtend.performance.component-profile.v1`.
- RMT schedules: `surface.visible.render`, `surface.user-blocking.open`, `surface.user-blocking.close`, `surface.transition.layout`, `surface.diagnostics.snapshot`, `surface.eager.hydrate`.

RMT Hosts sollten die Komponente als Custom-Element-Grenze behandeln: Attribute werden als Component Props gesetzt, DOM-Events werden an Commands gebunden, und Scheduling-Metadaten bleiben außerhalb der Komponente. Reine HTML-Hosts verwenden dieselben Attribute und Events ohne RMT Compiler.

Theming sollte zuerst über XTend Design Tokens laufen. CSS Parts sind für gezieltes Skinning freigegebener Controls gedacht, während CSS Custom Properties breitere Anpassungen an Farbe, Abstand, Radius und Bewegung abdecken. Accessibility-Hooks wie Labels, Live-Regionen und Fokusverhalten sollten beim Komponieren erhalten bleiben.

## Fehlerbehebung

- Wenn `x-surface-manager` nicht upgradet, prüfe, ob `xtend-loader.js` geladen wurde und `components/manifest.json` `x-surface-manager` enthält.
- Wenn Events fehlen, lausche erst nach `customElements.whenDefined('x-surface-manager')` und prüfe, ob die Interaktion deaktiviert oder durch Validierung blockiert ist.
- Wenn Styling nicht greift, nutze dokumentierte CSS Variablen und Parts; Shadow-DOM-Interna sind absichtlich nicht stabil.
- Wenn ein RMT Host veralteten Zustand rendert, prüfe zuerst State-Key und Schedule Records aus dieser Seite.

## Nächste Schritte

- [Komponenten-Entwicklung](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
