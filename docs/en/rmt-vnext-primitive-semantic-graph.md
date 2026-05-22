# RMT vNext Primitive Semantic Graph

- Contract: `xtend.rmt.vnext.primitive-semantic-graph.v1`
- Workpackage: `RMT-VNEXT-PRIM-03`
- Status: `completed`
- Source: Media Manager downstream transfer, `2026-05-19`

## Goal

`RMT-VNEXT-PRIM-03` makes vNext primitives semantically visible before runtime. The parser provides typed AST nodes; the new graph builds indexes, references, diagnostics and completion hints for the App Platform primitives from them.

The API is additive:

```js
const {
  buildRmtVNextPrimitiveSemanticGraph
} = require('./tools/rmt-language/semantic-graph');

const graph = buildRmtVNextPrimitiveSemanticGraph({ text, filePath });
```

The existing `buildSemanticGraph(...)` for Legacy/Core RMT remains stable. The vNext primitive graph is the new handoff between parser and later lowering into Kernel records.

## Index Domains

The graph creates dedicated domains for:

- `states`
- `selectors`
- `dataSources`
- `actions`
- `surfaces`
- `portals`
- `overlays`
- `resources`
- `events`

Each domain provides `records`, `byId`, `ids` and duplicate diagnostics. In addition, `catalogHints` provides directly usable IDs for completions and docs.

## Reference Model

PRIM-03 validates the most important vNext primitive edges:

- Selector -> State
- Action Effect -> DataSource
- Reducer -> State
- Surface Source/Repeat/Lifecycle -> Selector or State
- Surface -> Portal
- Overlay -> Portal
- Resource -> Owner Surface/Overlay
- Resource Source -> Selector/State/Resource
- Surface Destroy -> Resource
- Event -> Action

The references follow the same structure as the existing semantic graph:

- `references.records`
- `references.bySourcePointer`
- `references.byTargetId`
- `references.unresolved`

This keeps the later language-server path for go-to-definition, references and completion consistent.

## Diagnostics

PRIM-03 introduces these vNext primitive diagnostics:

| Code | Meaning |
|------|---------|
| `rmt.vnext.primitive.duplicate-id` | A primitive is defined more than once in the same domain. |
| `rmt.vnext.primitive.unknown-reference` | A primitive reference cannot be resolved. |
| `rmt.vnext.primitive.owner-missing` | A resource has no surface or overlay owner. |
| `rmt.vnext.primitive.unkeyed-repeat` | A surface repeater has no `key` clause. |
| `rmt.vnext.primitive.payload-contract-missing` | An event or emit leads to a runtime payload without a contract. |
| `rmt.vnext.primitive.initial-missing` | A state has no initial value. |
| `rmt.vnext.primitive.resource-kind-missing` | A resource has no `kind`. |
| `rmt.vnext.primitive.action-reducer-missing` | An action has input, status or effect but no reducer target. |
| `rmt.vnext.primitive.effect-source-missing` | An `effect fetch` has no data source, selector or resource source. |
| `rmt.vnext.primitive.unsafe-html` | Unsafe HTML becomes visible without a trust boundary. |
| `rmt.vnext.primitive.kernel-boundary` | A primitive import violates Kernel/Fabric boundaries. |

The negative fixture `tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt` proves cross-reference, ownership, event-payload, repeater and kernel-boundary errors as pre-runtime diagnostics.

## Evidence

The semantic-graph suite verifies both directions:

- `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt` must index as a positive vNext primitive graph without error diagnostics.
- `tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt` must produce the expected PRIM-03 diagnostics.

Targeted local gates:

```bash
node --check tools/rmt-language/semantic-graph.js
node --check tests/rmt-language/rmt_semantic_graph_suite.js
node -e "const suite=require('./tests/rmt-language/rmt_semantic_graph_suite'); const result=suite.runRmtSemanticGraphSuite({rootDir:process.cwd()}); process.exit(result.ok ? 0 : 1);"
```

## Next Handoff

`RMT-VNEXT-PRIM-04` uses the new graph as lowering input. The compiler stops primitive sources with semantic errors before Core output and produces deterministic Kernel/App Platform records for valid sources.

Handoff: [RMT vNext Primitive Lowering](./rmt-vnext-primitive-lowering.md)
