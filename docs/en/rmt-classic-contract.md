# RMT Classic compiler contract

**RMT Classic** is the new name for the existing RMT vNext authoring language. RMTX uses declarative TSX grammar, `.rmtx` files and qualified `RMT.<Operator>` elements. The first closed [A06.2 frontend profile](../../development/rmtx-a06/frontend/README.md) uses the same validated compiler backend; additional operators, native UI and semantic tooling remain separate follow-up work.

## Public API

```js
const { parseRmtClassicSource } = require('@ccslabs/xtend/rmt-language/classic-parser');
const { compileRmtClassicAst } = require('@ccslabs/xtend/rmt-language/classic-compiler');
const parsed = parseRmtClassicSource({ text: 'state count type number initial 0' });
if (!parsed.ok) throw new Error(JSON.stringify(parsed.diagnostics));
const core = compileRmtClassicAst(parsed.ast, { contractVersion: '1.0.0' });
```

The compiler export also provides `compileRmtClassicSource`, `createRmtClassicCompiler`, `validateRmtClassicAst`, `isRmtClassicAst`, `getRmtClassicAstSchema`, and generated TypeScript types. The schema is also exported as `classic-ast.schema.json`.

The new standalone function `compileRmtClassicAstResult(ast, options)` returns the complete validated compiler result, including diagnostics and derived plans. The Classic module API is now **4.5.0**, and the compatible vNext module API is **1.6.0**. Existing factory methods and the Core-only/throwing contract of `compileRmtClassicAst` remain supported. Only the new complete AST entrypoint accepts the closed RMTX source profiles 1.0.0, 2.0.0, 3.0.0 and 4.0.0; compile RMTX authoring text through `rmt-language/rmtx-compiler`.

## Contract and compatibility

`xtend.rmt.classic.compiler-contract.v1`, version **1.0.0**, defines closed fields and child contexts for 122 AST node types. Structure, references, safe write targets, known initial types, and dependency cycles are checked before artifacts are produced. Application types remain nominal host contracts. Core and target plans are independently versioned outputs.

Existing `vnext-*` APIs, AST/Core wire IDs, and source tags remain compatible. Unknown requested contract versions are rejected. Origin metadata is optional; supplied pointers and helper nodes must agree. Compilation does not mutate the input.

## Verification

`npm run check:rmt-classic-contract` detects schema/type drift. The complete [field, reference, diagnostic, and versioning rules](../../development/rmtx-a01/compiler-contract.md) describe the backend boundary. The [0.9 release plan](./release-0-9.md) requires both RMTX and XTensions 2.0.

The [A06.3.1 selector profile](../../development/rmtx-a06/selector-profile/README.md) remains available as explicit syntax profile 2.0.0. [A06.3.2](../../development/rmtx-a06/keyed-profile/README.md) adds syntax profile **3.0.0**, separate v3 results, a versioned host-scope contract, Repeat/Presence and event guards. The new [A06.3 orchestration profile](../../development/rmtx-a06/orchestration-profile/README.md) explicitly adds syntax **4.0.0**, 110 tags, closed props projections, pinned inline providers and runtime-validated Action inputs. Module capability APIs are **4.0.0**; v1 remains the default and complete profiles1/2/3 are retained. Provider keys still use the existing typed binding materialization. Readsets do not change runtime recomputation; general native DOM loops and executable lifecycle conditions follow in A06.4. Source4 uses separate orchestration/binding/Maraca profiles and rejects SSR/adoption until its own acceptance.
