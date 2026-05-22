# RMT vNext Primitive Semantic Graph

- Contract: `xtend.rmt.vnext.primitive-semantic-graph.v1`
- Workpackage: `RMT-VNEXT-PRIM-03`
- Status: `completed`
- Quelle: Media-Manager-Downstream-Transfer, `2026-05-19`

## Ziel

`RMT-VNEXT-PRIM-03` macht vNext-Primitives vor der Runtime semantisch
sichtbar. Der Parser liefert typisierte AST-Knoten; der neue Graph baut daraus
Indexe, Referenzen, Diagnostics und Completion-Hints fuer die App-Platform-
Primitives.

Die API ist additiv:

```js
const {
  buildRmtVNextPrimitiveSemanticGraph
} = require('./tools/rmt-language/semantic-graph');

const graph = buildRmtVNextPrimitiveSemanticGraph({ text, filePath });
```

Der bestehende `buildSemanticGraph(...)` fuer Legacy/Core-RMT bleibt stabil.
Der vNext-Primitive-Graph ist der neue Handoff zwischen Parser und spaeterem
Lowering in Kernel Records.

## Index-Domains

Der Graph erzeugt eigene Domains fuer:

- `states`
- `selectors`
- `dataSources`
- `actions`
- `surfaces`
- `portals`
- `overlays`
- `resources`
- `events`

Jede Domain stellt `records`, `byId`, `ids` und Duplicate-Diagnostics bereit.
Zusaetzlich liefert `catalogHints` direkt nutzbare IDs fuer Completions und
Docs.

## Referenzmodell

PRIM-03 prueft die wichtigsten vNext-Primitive-Kanten:

- Selector -> State
- Action Effect -> DataSource
- Reducer -> State
- Surface Source/Repeat/Lifecycle -> Selector oder State
- Surface -> Portal
- Overlay -> Portal
- Resource -> Owner Surface/Overlay
- Resource Source -> Selector/State/Resource
- Surface Destroy -> Resource
- Event -> Action

Die Referenzen sind analog zum bestehenden Semantic Graph aufgebaut:

- `references.records`
- `references.bySourcePointer`
- `references.byTargetId`
- `references.unresolved`

Damit bleibt der spaetere Language-Server-Pfad fuer Go-to-Definition,
References und Completion konsistent.

## Diagnostics

PRIM-03 fuehrt diese vNext-Primitive-Diagnostics ein:

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.primitive.duplicate-id` | Ein Primitive ist in derselben Domain mehrfach definiert. |
| `rmt.vnext.primitive.unknown-reference` | Eine Primitive-Referenz kann nicht aufgeloest werden. |
| `rmt.vnext.primitive.owner-missing` | Eine Resource besitzt keinen Surface- oder Overlay-Owner. |
| `rmt.vnext.primitive.unkeyed-repeat` | Ein Surface-Repeater besitzt keine `key`-Klausel. |
| `rmt.vnext.primitive.payload-contract-missing` | Event oder Emit fuehrt zu Runtime-Payload ohne Contract. |
| `rmt.vnext.primitive.initial-missing` | Ein State besitzt keinen initialen Wert. |
| `rmt.vnext.primitive.resource-kind-missing` | Eine Resource besitzt keinen `kind`. |
| `rmt.vnext.primitive.action-reducer-missing` | Eine Action besitzt Input, Status oder Effect, aber kein Reducer-Ziel. |
| `rmt.vnext.primitive.effect-source-missing` | Ein `effect fetch` besitzt keine DataSource-, Selector- oder Resource-Quelle. |
| `rmt.vnext.primitive.unsafe-html` | Unsicheres HTML wird ohne Trust Boundary sichtbar. |
| `rmt.vnext.primitive.kernel-boundary` | Primitive-Import verletzt Kernel-/Fabric-Grenzen. |

Die negative Fixture
`tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt` beweist
Cross-Reference-, Ownership-, Event-Payload-, Repeater- und Kernel-Boundary-
Fehler als Pre-Runtime-Diagnostics.

## Evidence

Die Semantic-Graph-Suite prueft beide Richtungen:

- `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt` muss als
  positiver vNext-Primitive-Graph ohne Error-Diagnostics indexieren.
- `tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt` muss die
  erwarteten PRIM-03-Diagnostics liefern.

Gezielte lokale Gates:

```bash
node --check tools/rmt-language/semantic-graph.js
node --check tests/rmt-language/rmt_semantic_graph_suite.js
node -e "const suite=require('./tests/rmt-language/rmt_semantic_graph_suite'); const result=suite.runRmtSemanticGraphSuite({rootDir:process.cwd()}); process.exit(result.ok ? 0 : 1);"
```

## Naechster Handoff

`RMT-VNEXT-PRIM-04` nutzt den neuen Graph als Lowering-Input. Der Compiler
stoppt Primitive-Quellen mit Semantic-Errors vor dem Core-Output und erzeugt
fuer valide Quellen deterministische Kernel-/App-Platform-Records.

Handoff: [RMT vNext Primitive Lowering](./rmt-vnext-primitive-lowering.md)
