# RMT Classic compiler contract

**RMT Classic** is the new name for the existing RMT vNext authoring language. RMTX will provide its own template frontend for the same validated compiler backend. Its concrete syntax remains open.

## Public API

```js
const { parseRmtClassicSource } = require('@ccslabs/xtend/rmt-language/classic-parser');
const { compileRmtClassicAst } = require('@ccslabs/xtend/rmt-language/classic-compiler');
const parsed = parseRmtClassicSource({ text: 'state count type number initial 0' });
if (!parsed.ok) throw new Error(JSON.stringify(parsed.diagnostics));
const core = compileRmtClassicAst(parsed.ast, { contractVersion: '1.0.0' });
```

The compiler export also provides `compileRmtClassicSource`, `createRmtClassicCompiler`, `validateRmtClassicAst`, `isRmtClassicAst`, `getRmtClassicAstSchema`, and generated TypeScript types. The schema is also exported as `classic-ast.schema.json`.

## Contract and compatibility

`xtend.rmt.classic.compiler-contract.v1`, version **1.0.0**, defines closed fields and child contexts for 122 AST node types. Structure, references, safe write targets, known initial types, and dependency cycles are checked before artifacts are produced. Application types remain nominal host contracts. Core and target plans are independently versioned outputs.

Existing `vnext-*` APIs, AST/Core wire IDs, and source tags remain compatible. Unknown requested contract versions are rejected. Origin metadata is optional; supplied pointers and helper nodes must agree. Compilation does not mutate the input.

## Verification

`npm run check:rmt-classic-contract` detects schema/type drift. The complete [field, reference, diagnostic, and versioning rules](../../development/rmtx-a01/compiler-contract.md) describe the backend boundary. The [0.9 release plan](./release-0-9.md) requires both RMTX and XTensions 2.0.
