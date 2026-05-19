# RMT Surface Resource Graph Runtime

- Contract: `xtend.epic18.rmt-surface-resource-graph-runtime.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json`
- Workpackage: `WP-E18-10`
- Handoff: `WP-E18-11`

## Ziel

Die Surface Resource Graph Runtime macht dynamische App-Layouts in RMT als
generische Plattformfaehigkeit modellierbar. Entwickler koennen eigene
Surface-Modelle aus beliebigen Records erzeugen, Bounds und Fokus verwalten,
Overlays ueber Portale stapeln und instanzgebundene Ressourcen aufraeumen,
ohne eine produktlokale Registry oder Shell-spezifische Repaint-Logik zu
schreiben.

Der Media Manager bleibt dabei nur Proof-of-Need. Die Runtime kennt keine
Produkt-Surface-Liste und importiert keine XTend-Komponenten.

## Keyed Surface Repeater

`surface` Definitionen koennen `source`, `repeat` und `key` deklarieren. Die
Runtime erzeugt daraus stabile Surface-Instanzen wie
`surface.workspace:alpha`. Beim erneuten Materialisieren mit denselben Keys
bleiben Runtime-Zustand, Bounds, Fokusreihenfolge, Ressourcenstatus und
Persistenzdaten erhalten.

Wichtige Operationen:

- `materialize(recordsBySource)`: erzeugt oder reused Surface-Instanzen.
- `openSurface(id)`: oeffnet eine Instanz und uebernimmt ihre Ressourcen.
- `minimizeSurface(id)`: minimiert, ohne DOM- oder Ressourcenstatus zu
  verwerfen.
- `restoreSurface(id)`: stellt Bounds und offenen Zustand wieder her.
- `closeSurface(id)`: schliesst nach Policy, ohne zwingend zu zerstoeren.
- `destroySurface(id)`: gibt instanzgebundene Ressourcen frei und trennt den
  Event-Owner.

## Portal Layer Stack

Portale beschreiben Layer- und Policy-Grenzen fuer Tooltips, Toasts, Popovers,
Lightboxes, Menus, Dialoge und weitere Overlay-Arten. `openOverlay` legt
Overlay-Instanzen in ihrem Portal ab und vergibt eine stabile Stack-Reihenfolge
ueber `zIndexStart` und `zStep`. `closeTopOverlay` schliesst den obersten
dismissible Overlay-Eintrag pro Portal oder global.

Die Portal-Policy ist generisch:

- `stacked` fuer normale App-Flächen.
- `modal` und `nonmodal` fuer blockierende und nicht blockierende Overlays.
- `toast-region` fuer Feedback-Layer.
- `clipping-escape` fuer Viewport-feste Layer wie Tooltips.

## Resource Ownership

Ressourcen werden ueber den WP-E18-08 Resource Manager injiziert. Die Surface
Runtime besitzt keine eigenen Adapter, sondern ruft `acquireMany` und
`releaseOwner` pro Surface- oder Overlay-Instanz auf.

Dadurch gelten klare Regeln:

- Minimize erhaelt Ressourcen und Component-State.
- Close kann Ressourcen optional freigeben.
- Destroy gibt Ressourcen der betroffenen Instanz frei.
- Overlay-Close gibt Overlay-Ressourcen frei.
- Destroy einer Surface ruft zusaetzlich `eventRuntime.detachOwner(owner)` auf.

## Persistenz

`persistSnapshot` liefert einen Snapshot mit Surface-Zustand, Bounds, Fokus,
offenen Overlays und Portal-Metadaten. Ein optionaler Persistence Adapter kann
diesen Snapshot speichern. `hydrateSnapshot` spielt ihn spaeter in bereits
materialisierte Instanzen zurueck.

## Grenzen

- Keine Produkt-Surface-Taxonomie als Framework-Default.
- Keine produktlokale Registry-Repaint-Pflicht.
- Keine XTend-Component-Imports im RMT Kernel.
- Normale UI bleibt bei DOM Descriptoren und Component Templates; HTML-String-
  Renderer bleiben eine separate Trusted-DOM-Grenze.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime --json
```

`WP-E18-11` erweitert darauf aufbauend Scaffold, Linter, LSP und Diagnostics,
damit Surface-, Overlay-, Portal- und Resource-Graphen schon beim Authoring
sichtbar und pruefbar werden.
