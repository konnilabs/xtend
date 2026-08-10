# WP-E18-10 - Surface-, Overlay-, Portal- und Resource-Graph generisch haerten

- Status: `completed`
- Epic: `development/docs-evidence/root/epic18-media-manager-vendor-upstream.md`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Contract: `xtend.epic18.rmt-surface-resource-graph-runtime.v2`
- Gate: `node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json`
- Naechstes Workpackage: `WP-E18-11`

## Ziel

WP-E18-10 schliesst die Blind Spots BS6, BS9 und BS10 als generischen RMT-
Runtime-Slice. RMT kann jetzt dynamische Surface-Instanzen aus beliebigen
Records erzeugen, Surface-Lifecycle und Bounds verwalten, Overlays in Portal-
Layern stapeln und Ressourcen pro Instanz aufraeumen.

Das Paket uebernimmt keine Media-Manager-Surfaces als Framework-Produktmodell.
Die neue API ist bewusst frei: Entwickler definieren ihre eigenen Surface-
Kinds, Records, Templates, Portale, Overlay-Policies und Ressourcen.

## Gelieferte Artefakte

- `catalog/epic18-rmt-surface-resource-graph-runtime.js`
- `xtendrmt/rmt-surface-resource-graph-runtime.js`
- `xtendrmt/rmt-surface-resource-graph-runtime.d.ts`
- `tests/fixtures/rmt-surface-resource-graph-runtime.rmt`
- `tests/rmt/rmt_surface_resource_graph_runtime_suite.js`
- `docs/rmt-surface-resource-graph-runtime.md`
- Package Export `./rmt/surface-resource-graph-runtime`
- XTendRMT Subexport `./surface-resource-graph-runtime`
- Runner-Gate `rmt-surface-resource-graph-runtime`

## Umsetzung

- Keyed Surface Repeater mit stabilen Instanz-IDs wie
  `surface.workspace:alpha`.
- Lifecycle-Operationen fuer `open`, `close`, `destroy`, `minimize`,
  `restore`, `focus`, `setBounds`, `move` und `resize`.
- Re-Materialisierung erhaelt Bounds, Status, Fokus und Ressourcenflags fuer
  bestehende Keys.
- Portal-Stack fuer Tooltip, Toast, Popover, Lightbox, Menu und Dialog.
- `closeTopOverlay` respektiert Dismiss- und Escape-Policies.
- Resource Ownership nutzt den injizierten WP-E18-08 Resource Manager.
- Destroy ruft `releaseOwner(owner)` und optional
  `eventRuntime.detachOwner(owner)` auf.
- `persistSnapshot` und `hydrateSnapshot` bilden die Persistenzgrenze.
- Diagnostics laufen ueber den Channel
  `rmt.app_platform.surface_resource_graph`.

## Akzeptanz

- Entwickler koennen eigene dynamische Surface-Modelle aus beliebigen Records
  erzeugen.
- Bounds, Fokus, Minimize/Restore, Close, Destroy und Persistenz sind Runtime-
  Primitives.
- Tooltips, Toasts, Popovers, Lightboxes, Menus und Dialoge teilen eine
  generische Portal-/Layer-Policy.
- Ressourcen werden pro Surface- oder Overlay-Instanz erworben und freigegeben.
- Keine produktlokale Registry-Repaint-Pflicht.
- Keine Produkt-Surface-Taxonomie als Framework-Default.
- Keine normalen UI-HTML-String-Renderer im Runtime-Slice.

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
node scripts/run_xtend_tests.js type-exports-rmt type-exports epic13-package-export-lock --json
```

## Handoff an WP-E18-11

`WP-E18-11` kann jetzt Scaffold, Linter, LSP und Diagnostics erweitern. Die
Tooling-Welle soll Authoring-Fehler im Surface Graph sichtbar machen: fehlende
Portal-Referenzen, instabile Keys, Ressourcen ohne Owner, unklare Overlay-
Policies und nicht persistierbare Bounds.
