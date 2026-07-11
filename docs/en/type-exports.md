# Type Exports

The package export surface for loader, API, RMT, Fabric and components.

## What it covers

`package.json` maps every public subpath to runtime and, where available, a `types` condition. Consumers import those subpaths; direct access to internal source or test paths is not stable.

## Public building blocks

- `./loader` and `./api` cover browser bootstrap and UI API.
- `./rmt`, `./rmt/browser`, and RMT language subpaths cover runtime and tooling.
- Fabric, Maraca, builder, and component subpaths point to co-located `.d.ts` files.

## RMT TypeScript Surface

XTend publishes the RMT runtime and RMT tooling with stable `types` conditions. Hosts can use the declarative RMT layer without importing internal sources or build artifacts.

```ts
import { createRmtRuntime } from '@ccslabs/xtend/rmt';
import { createRmtBrowserRuntime } from '@ccslabs/xtend/rmt/browser';
import { compileRmtVNextSource } from '@ccslabs/xtend/rmt-language/vnext-compiler';
```

The main declaration files are `./xtendrmt/rmt-core.d.ts` for kernel and browser runtime APIs, plus `./tools/rmt-language/rmt-tooling-public-types.d.ts` for editor, linter and language-server integrations. This surface includes `RmtToolingDiagnostic`, `RmtTextEdit`, `RmtWorkspaceEdit`, `RmtLanguageServiceReport` and `RmtJsonRpcMessage`.

## Gate Contract

```txt
plan: xtend.type-exports.plan.v1
drift report: xtend.type-exports.drift-report.v1
local gate: node scripts/run_xtend_tests.js type-exports --json
release gate: npm run test:type-exports:release
loader types: ./xtend-loader.d.ts
api types: ./api.d.ts
decision: types-not-required
```

Maraca is classified through the package exports `./maraca` and `./maraca/runtime`, backed by `./xtend-maraca/index.d.ts` and `./xtend-maraca/runtime.d.ts`.

## Recommended workflow

Import entries from `package.json#exports` only and let TypeScript resolve the same package version. Verify changes with `node scripts/run_xtend_tests.js type-exports --json`; add missing types or classify a path explicitly as runtime-only.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
- [XTend Loader Types](./xtend-loader-types.md)
- [XTend API Types](./xtend-api-types.md)
- [XTend Policy Types](./xtend-policy-types.md)
- [XTend Builder Types](./xtend-builder-types.md)
- [XTend Catalog Types](./xtend-catalog-types.md)
- [XTend Vendor Types](./xtend-vendor-types.md)
