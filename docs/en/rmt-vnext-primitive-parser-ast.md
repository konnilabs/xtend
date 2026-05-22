# RMT vNext Primitive Parser AST

- Contract: `xtend.rmt.vnext-primitive-parser-ast.v1`
- Workpackage: `RMT-VNEXT-PRIM-02`
- Status: `completed`
- Parent backlog: [RMT vNext Primitive Compiler Backlog](./rmt-vnext-primitives-compiler-backlog.md)
- Grammar contract: [RMT vNext Primitive Grammar Design](./rmt-vnext-primitive-grammar-design.md)
- Parser module: `tools/rmt-language/vnext-parser.js`
- Parser suite: `tests/rmt-language/rmt_vnext_parser_suite.js`
- Fixture: `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt`

## Goal

PRIM-02 extends the existing vNext parser so the primitive syntax defined in PRIM-01 becomes visible as real AST nodes. The slice remains backward-compatible with the previous `template/surface/lane` syntax.

Compiler lowering and kernel ingestion remain follow-up work in `RMT-VNEXT-PRIM-04`. The first app graph semantics started in `RMT-VNEXT-PRIM-03`.

## Implemented Parser Scope

The parser now accepts the design fixture `vnext-primitives-grammar-design.rmt` without syntax diagnostics and creates initial AST nodes for:

| Primitive | AST nodes |
|-----------|-----------|
| State | `RmtStateDeclaration`, `RmtInitialBlock`, `RmtInitialValueEntry`, `RmtPrimitiveValue`, `RmtTypeReference` |
| Selector | `RmtSelectorDeclaration`, `RmtSelectorWhereClause`, `RmtSelectorFindClause`, `RmtSelectorSortClause`, `RmtSelectorOutputClause` |
| DataSource | `RmtDataSourceDeclaration`, `RmtPrimitiveSourceReference`, `RmtDataSourceMethodClause`, `RmtDataSourceContractClause`, `RmtDataSourceResultClause`, `RmtDataSourceFallbackClause` |
| Action | `RmtActionDeclaration`, `RmtActionInputClause`, `RmtActionStatusClause`, `RmtEffectStatement`, `RmtReducerStatement`, `RmtEmitStatement`, `RmtActionResultHandler` |
| Portal | `RmtPortalDeclaration`, `RmtPrimitiveAttribute`, `RmtPortalPolicyClause` |
| Overlay | `RmtOverlayDeclaration`, `RmtOverlayPolicyClause` |
| Resource | `RmtResourceDeclaration`, `RmtResourceImportClause`, `RmtResourceSourceClause`, `RmtResourceDisposeClause` |
| Surface | extended `RmtSurfaceDeclaration`, `RmtSurfaceHeaderClause`, `RmtSurfaceSourceClause`, `RmtSurfaceRepeatClause`, `RmtSurfaceKeyClause`, `RmtSurfacePortalClause`, `RmtSurfaceBoundsClause`, `RmtSurfacePreserveClause`, `RmtSurfaceDestroyClause` |
| Event | extended `RmtEventBinding`, `RmtEventSelector`, `RmtEventPayloadBlock`, `RmtEventPayloadMapping`, `RmtEventOptionClause` |

## Parser Boundaries

- Selector expressions such as `contains(record.name, state.media.filters.query)` are preserved in PRIM-02 as declarative raw clauses with source range. The semantic operator AST follows in PRIM-03.
- Action result handlers such as `on success -> reduce ...` keep the effect text and source range. Typed effect nodes follow in PRIM-03/04.
- The compiler continues to ignore unknown template body nodes so existing vNext Core builds remain stable. Primitive lowering is PRIM-04.
- The RMT kernel is not ingested in PRIM-02. The source-to-sea gate is PRIM-06.

## Verification

Direct local checks:

```bash
node --check tools/rmt-language/vnext-parser.js
node --check tests/rmt-language/rmt_vnext_parser_suite.js
node -e "const { runRmtVNextParserSuite } = require('./tests/rmt-language/rmt_vnext_parser_suite'); const result = runRmtVNextParserSuite(); process.exit(result.ok ? 0 : 1)"
node -e "const { runRmtVNextCompilerSuite } = require('./tests/rmt-language/rmt_vnext_compiler_suite'); const result = runRmtVNextCompilerSuite(); process.exit(result.ok ? 0 : 1)"
```

The global runner `node scripts/run_xtend_tests.js rmt-vnext-parser --json` is currently blocked by existing merge conflict markers in `tests/references/reference_path_suite.js`, because the runner imports this suite at startup.

## Handoff

- `RMT-VNEXT-PRIM-03`: [RMT vNext Primitive Semantic Graph](./rmt-vnext-primitive-semantic-graph.md)
  builds indexes, references and pre-runtime diagnostics for the primitive AST nodes.
- `RMT-VNEXT-PRIM-04`: lower primitive AST and semantic graph into Core/App Platform records.
- Update the Language Server: completions, hover, symbols and code actions for the new node types.
