# WP-E14-04 - Semantic Graph fuer RMT-Domains und Referenzen implementieren

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.semantic-graph.v1`
- Report Schema: `xtend.rmt.semantic-graph-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-semantic-graph --json`
- Package Script: `npm run test:rmt-semantic-graph`
- Zielzustand: `rmt-semantic-graph-ready`

## Ziel

`WP-E14-04` baut aus RMT-Autorendokumenten einen wiederverwendbaren Semantic Graph fuer Linter, Completion, Definition, Hover, Rename und Code Actions.

Die Schicht parst und normalisiert nicht erneut. Fuer IDE- und LSP-Genauigkeit nutzt sie das Raw Document als autoritative Pointer-Quelle und haelt die normalisierte Runtime-Ansicht weiterhin als Kontext bereit:

- `formatAdapterResult.rawDocument`
- `formatAdapterResult.normalizedDocument`
- `sourceModel.findJsonPointerRange(...)`
- `sourceModel.createDiagnostic(...)`

## Umgesetzt

- `tools/rmt-language/semantic-graph.js` als Sprachkern-Schicht angelegt
- Pflichtdomains indexiert:
  - `adapters`
  - `components`
  - `routes`
  - `schedules`
  - `templates`
- Pflichtindizes aufgebaut:
  - `adapters.byId`
  - `components.byId`
  - `components.byTag`
  - `routes.byId`
  - `routes.byPath`
  - `schedules.byId`
  - `schedules.byEndpointName`
  - `schedules.byLane`
  - `templates.byId`
  - `references.bySourcePointer`
  - `references.byTargetId`
- Cross-Domain-Referenzen modelliert:
  - Route -> Component
  - Route -> Template
  - Route -> Schedule
  - Route -> Router Adapter
  - Component -> Adapter
  - Component -> Schedule
  - Component Slot -> Template/Component
  - Template Node -> Component/Template/Schedule
  - Template Hydration Endpoint -> Schedule Endpoint
  - Template Metadata -> Component/Schedule
- Semantic Diagnostics erzeugt:
  - `rmt.id.duplicate`
  - `rmt.ref.route.duplicate-path`
  - `rmt.adapter.unknown`
  - `rmt.ref.component.unresolved`
  - `rmt.ref.template.unresolved`
  - `rmt.ref.schedule.unresolved`
  - `rmt.schedule.endpoint.missing`
  - `rmt.fabric.lane.conflict`
- Completion-Grundlage ueber `listCompletions(domain, options)` bereitgestellt
- Definition-Grundlage ueber `getDefinition(...)` und `getDefinitionForReference(...)` bereitgestellt
- Manifest- und Catalog-Hints fuer Komponenten-Tags, Route-Paths, Schedule-Lanes und Endpoint-Namen bereitgestellt
- `tests/rmt-language/rmt_semantic_graph_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-semantic-graph` erweitert

## Architekturentscheidung

Der Semantic Graph ist die erste semantische Schicht im RMT-Tooling. Er erzeugt Diagnosen, aber er ist noch keine Rule Engine.

Das ist wichtig fuer die naechsten Pakete:

- `WP-E14-05` kann Linter-Regeln auf Graph-Daten aufbauen
- `WP-E14-07` kann Completion Provider auf Graph-Indizes aufbauen
- `WP-E14-08` kann Definition, Hover und Document Symbols auf dieselben Pointer und Ranges setzen
- `WP-E14-10` kann Code Actions mit stabilen Source-Pointern bauen

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| unresolved References sind erkennbar | erfuellt: `references.unresolved` und Diagnosen |
| duplicate IDs sind erkennbar | erfuellt: `rmt.id.duplicate` |
| duplicate Route Paths sind erkennbar | erfuellt: `rmt.ref.route.duplicate-path` |
| Cross-Domain References sind indexiert | erfuellt: `references.bySourcePointer`, `references.byTargetId` |
| Completion Provider kann Graph nutzen | erfuellt: `listCompletions(...)` |
| Definition Provider kann Graph nutzen | erfuellt: `getDefinition(...)`, `getDefinitionForReference(...)` |
| Manifest- und Catalog-Hints sind verfuegbar | erfuellt |
| keine Runtime-/XTend-Kopplung im Sprachkern | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-semantic-graph --json
```

## Handoff

`WP-E14-04` ist abgeschlossen. `WP-E14-05` kann nun die Linter Rule Engine und Basisregeln aufbauen.

Die Rule Engine soll den Graph nutzen und keine zweite Referenzanalyse implementieren.
