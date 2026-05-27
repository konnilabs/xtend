# Type Exports

The package export surface for loader, API, RMT, Fabric and components.

## What it covers

Type Exports documents the core path through local modules, public TypeScript surfaces and verifiable host wiring.

## Public building blocks

- Root-Paket `@ccslabs/xtend`.
- Runtime packages for RMT and Fabric.
- Declaration files for public imports.

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

```txt
WP-TypeExports-02: ./xtend-loader.d.ts, ./xtend-dev.d.ts, ./xtend-loader-types.md
WP-TypeExports-03: ./api.d.ts, ./xtend-api-types.md
WP-TypeExports-05: ./fabric/xtend-policy-public-types.d.ts, ./xtend-policy-types.md
WP-TypeExports-06: ./xtend-builder/builder-public-types.d.ts, ./xtend-builder-types.md
WP-TypeExports-07: ./catalog/catalog-public-types.d.ts, ./xtend-catalog-types.md
WP-TypeExports-08: ./design-tokens/xtend-design-tokens.d.ts, ./design-tokens/xtheme-token-alias-layer.d.ts, ./components/prism.d.ts, ./xtend-vendor-types.md
```

## Recommended workflow

Read the overview, copy the smallest suitable example and add host-specific details only afterwards.

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

## Public contract

Type Exports is the public reference contract for `docs/en/type-exports.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: public files, package exports, manifest keys, attributes and host wiring.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/type-exports.md`
- `docs/menu.json`
- `package.json`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `design-tokens/xtend-design-tokens.js`

Names:
- `./xtendrmt/rmt-core.d.ts`
- `./tools/rmt-language/rmt-tooling-public-types.d.ts`
- `./maraca`
- `./maraca/runtime`
- `./xtend-maraca/index.d.ts`
- `./xtend-maraca/runtime.d.ts`
- `docs/en/type-exports.md`
- `docs/menu.json`
- `components/manifest.json`
- `design-tokens/xtend-design-tokens.js`

Commands:
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If a host loads nothing, check the manifest path, export name, attribute spelling and local file reachability.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
