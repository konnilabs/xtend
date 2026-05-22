# RMT vNext Primitive Parser AST

- Contract: `xtend.rmt.vnext-primitive-parser-ast.v1`
- Workpackage: `RMT-VNEXT-PRIM-02`
- Status: `completed`
- Parent backlog: [RMT vNext Primitive Compiler Backlog](./rmt-vnext-primitives-compiler-backlog.md)
- Grammar contract: [RMT vNext Primitive Grammar Design](./rmt-vnext-primitive-grammar-design.md)
- Parser module: `tools/rmt-language/vnext-parser.js`
- Parser suite: `tests/rmt-language/rmt_vnext_parser_suite.js`
- Fixture: `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt`

## Ziel

PRIM-02 erweitert den bestehenden vNext-Parser so, dass die in PRIM-01
definierte Primitive-Syntax als echte AST-Nodes sichtbar wird. Der Slice bleibt
abwaertskompatibel mit der bisherigen `template/surface/lane`-Syntax.

Compiler-Lowering und Kernel-Ingestion bleiben Folgearbeit in
`RMT-VNEXT-PRIM-04`. Die erste App-Graph-Semantik ist in
`RMT-VNEXT-PRIM-03` gestartet.

## Implementierter Parser-Umfang

Der Parser akzeptiert jetzt die Design-Fixture
`vnext-primitives-grammar-design.rmt` ohne Syntaxdiagnosen und erzeugt
initiale AST-Nodes fuer:

| Primitive | AST Nodes |
|-----------|-----------|
| State | `RmtStateDeclaration`, `RmtInitialBlock`, `RmtInitialValueEntry`, `RmtPrimitiveValue`, `RmtTypeReference` |
| Selector | `RmtSelectorDeclaration`, `RmtSelectorWhereClause`, `RmtSelectorFindClause`, `RmtSelectorSortClause`, `RmtSelectorOutputClause` |
| DataSource | `RmtDataSourceDeclaration`, `RmtPrimitiveSourceReference`, `RmtDataSourceMethodClause`, `RmtDataSourceContractClause`, `RmtDataSourceResultClause`, `RmtDataSourceFallbackClause` |
| Action | `RmtActionDeclaration`, `RmtActionInputClause`, `RmtActionStatusClause`, `RmtEffectStatement`, `RmtReducerStatement`, `RmtEmitStatement`, `RmtActionResultHandler` |
| Portal | `RmtPortalDeclaration`, `RmtPrimitiveAttribute`, `RmtPortalPolicyClause` |
| Overlay | `RmtOverlayDeclaration`, `RmtOverlayPolicyClause` |
| Resource | `RmtResourceDeclaration`, `RmtResourceImportClause`, `RmtResourceSourceClause`, `RmtResourceDisposeClause` |
| Surface | erweiterte `RmtSurfaceDeclaration`, `RmtSurfaceHeaderClause`, `RmtSurfaceSourceClause`, `RmtSurfaceRepeatClause`, `RmtSurfaceKeyClause`, `RmtSurfacePortalClause`, `RmtSurfaceBoundsClause`, `RmtSurfacePreserveClause`, `RmtSurfaceDestroyClause` |
| Event | erweiterte `RmtEventBinding`, `RmtEventSelector`, `RmtEventPayloadBlock`, `RmtEventPayloadMapping`, `RmtEventOptionClause` |

## Parser-Grenzen

- Selector-Ausdruecke wie `contains(record.name, state.media.filters.query)`
  werden in PRIM-02 als deklarative Raw-Clause mit Source Range erhalten.
  Die semantische Operator-AST folgt in PRIM-03.
- Action-Result-Handler wie `on success -> reduce ...` erhalten den Effekttext
  und die Source Range. Typisierte Effect-Nodes folgen in PRIM-03/04.
- Der Compiler ignoriert unbekannte Template-Body-Nodes weiterhin, damit
  bestehende vNext-Core-Builds stabil bleiben. Primitive-Lowering ist PRIM-04.
- Der RMT-Kernel wird in PRIM-02 nicht ingestiert. Das Source-to-Sea-Gate ist
  PRIM-06.

## Verifikation

Direkte lokale Checks:

```bash
node --check tools/rmt-language/vnext-parser.js
node --check tests/rmt-language/rmt_vnext_parser_suite.js
node -e "const { runRmtVNextParserSuite } = require('./tests/rmt-language/rmt_vnext_parser_suite'); const result = runRmtVNextParserSuite(); process.exit(result.ok ? 0 : 1)"
node -e "const { runRmtVNextCompilerSuite } = require('./tests/rmt-language/rmt_vnext_compiler_suite'); const result = runRmtVNextCompilerSuite(); process.exit(result.ok ? 0 : 1)"
```

Der globale Runner `node scripts/run_xtend_tests.js rmt-vnext-parser --json`
ist aktuell durch bestehende Merge-Conflict-Marker in
`tests/references/reference_path_suite.js` blockiert, weil der Runner diese
Suite beim Start importiert.

## Handoff

- `RMT-VNEXT-PRIM-03`: [RMT vNext Primitive Semantic Graph](./rmt-vnext-primitive-semantic-graph.md)
  baut Indexe, Referenzen und Pre-Runtime-Diagnostics fuer die Primitive-AST-
  Nodes auf.
- `RMT-VNEXT-PRIM-04`: Primitive-AST und Semantic Graph in Core-/App-Platform-
  Records absenken.
- Language Server nachziehen: completions, hover, symbols und code actions fuer
  die neuen Node-Typen.
