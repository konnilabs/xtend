# WP-E18-11 - Scaffold, Linter, LSP und Diagnostics fuer RMT Apps erweitern

- Status: `completed`
- Epic: `development/docs-evidence/root/epic18-media-manager-vendor-upstream.md`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Contract: `xtend.epic18.rmt-app-platform-tooling.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-app-platform-tooling --json`
- Naechstes Workpackage: `WP-E18-12`

## Ziel

WP-E18-11 macht die App Platform authoring- und buildfaehig. RMT App Sources
bekommen vor Runtime-Ausfuehrung Diagnostics, LSP-Hilfen, Source Maps und
Scaffold Build Reports.

Der Slice bleibt generisch: Er uebernimmt keine Media-Manager-Surfaces als
Produktmodell, sondern stellt Werkzeuge bereit, mit denen Entwickler eigene
App-Strukturen, Records, Komponenten, Events, Resources, Overlays und
Surface-Graphen modellieren koennen.

## Gelieferte Artefakte

- `catalog/epic18-rmt-app-platform-tooling.js`
- `tools/rmt-language/app-platform-tooling.js`
- `tools/rmt-language/app-platform-tooling.d.ts`
- `tools/rmt-language/rules/app-platform-policy.js`
- `xtend-builder/generators/rmt-app-platform.js`
- `tests/fixtures/rmt-app-platform-tooling.rmt`
- `tests/rmt-language/rmt_app_platform_tooling_suite.js`
- `docs/en/rmt-app-platform-tooling.md`
- Package Export `./rmt-language/app-platform-tooling`
- Runner-Gate `rmt-app-platform-tooling`

## Umsetzung

- Analyzer fuer App-Platform-Quellen mit Diagnostics, Summary und Source Map.
- Scaffold Pipeline fuer RMT App Sources als Builder-Generator
  `rmt-app-platform`.
- Default-Linter-Regel fuer App-Platform-Dokumente.
- Diagnostics fuer manuelle HTML-Sinks, unsichere HTML-Fragmente, unkeyed
  Repeats, untyped Events, fehlende Resource Ownership und unaufgeloeste
  Portal-/Resource-/Source-Referenzen.
- Completion/Hover fuer Portale, Overlay-Kinds, Resource-Kinds, Event-Kinds,
  Surface-States und Referenzen im aktiven RMT-Dokument.
- Builder-Befehl `rmt-app-platform` mit Dry-Run, Write und Check Mode.
- Build-Artefakte fuer Diagnostics, Source Map und Scaffold Report unter
  `.xtend-build`.
- TypeExports und Package Export Lock auf 121 Public Exports aktualisiert.

## Akzeptanz

- Entwickler sehen App-Platform-Fehler vor Runtime.
- RMT Apps koennen ueber Scaffold in testbare Artefakte gebaut werden.
- Normale App-UI bleibt frei von `innerHTML`-Hilfskonstrukten.
- LSP-Hilfen machen die neuen RMT-Primitives direkt im Dokument nutzbar.
- Source Maps verknuepfen Surfaces, Overlays, Portale, Resources, Events,
  Actions, DataSources und State mit RMT-Pointern.
- Keine Produkt-Surface-Taxonomie ist im Tooling verdrahtet.

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-app-platform-tooling --json
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime rmt-app-platform-tooling rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
node scripts/run_xtend_tests.js type-exports-rmt type-exports epic13-package-export-lock --json
```

## Handoff an WP-E18-12

`WP-E18-12` kann jetzt die generische App-Platform-Fixture bauen. Sie soll die
neuen Tooling- und Runtime-Primitives in einer domain-neutralen App zeigen:
Records, Listen, Details, Actions, Feedback, dynamische Surfaces, Overlays,
Resources und austauschbare DataSources, ohne eine Media-Manager-Oberflaeche
1:1 zu kopieren.
