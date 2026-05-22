# XTend TypeExports

- Contract: `xtend.type-exports.plan.v1`
- Release contract: `xtend.type-exports.drift-report.v1`
- Workpackage: `WP-TypeExports-09`
- Gate: `node scripts/run_xtend_tests.js type-exports --json`
- Release gate: `npm run test:type-exports:release`
- Report: `.xtend-test-results/xtend-type-exports-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Purpose

TypeExports makes the public `package.json` export surface explicit for TypeScript consumers. The first run classified every public export; `WP-TypeExports-02` through `WP-TypeExports-08` delivered the declaration packs. As of `WP-TypeExports-09`, TypeExports is a productive release gate with drift report.

The gate is intentionally strict: if a new public export appears in `package.json` without updating the TypeExports classification, `type-exports` fails locally. The release gate additionally bundles all TypeExports subpackages and writes the handoff report:

```bash
npm run test:type-exports:release
```

## Type Condition Matrix

| Export area | Examples | Target declaration | Workpackage |
| --- | --- | --- | --- |
| Loader | `.`, `./loader` | `./xtend-loader.d.ts` | `WP-TypeExports-02` completed |
| Legacy Loader | `./legacy-loader` | `./xtend-dev.d.ts` | `WP-TypeExports-02` completed |
| Core API | `./api` | `./api.d.ts` | `WP-TypeExports-03` completed |
| Components | `./components/*` | `./components/*.d.ts` | `ER-WP-34` |
| RMT Runtime | `./rmt`, `./rmt/browser`, `./rmt/dom-descriptor-renderer`, `./rmt/state-selector-runtime`, `./rmt/action-effect-runtime`, `./rmt/event-routing-runtime`, `./rmt/surface-resource-graph-runtime` | `./xtendrmt/rmt-core.d.ts`, `./xtendrmt/rmt-dom-descriptor-renderer.d.ts`, `./xtendrmt/rmt-state-selector-runtime.d.ts`, `./xtendrmt/rmt-action-effect-runtime.d.ts`, `./xtendrmt/rmt-event-routing-runtime.d.ts`, `./xtendrmt/rmt-surface-resource-graph-runtime.d.ts` | `WP-TypeExports-04` completed |
| RMT Language and Tooling | `./rmt-language/*`, `./rmt-language/app-platform-tooling`, `./rmt-linter/*`, `./rmt-language-server/*` | matching `tools/**/*.d.ts` plus `./tools/rmt-language/rmt-tooling-public-types.d.ts` | `WP-TypeExports-04` completed |
| Fabric, A11y, Security | `./fabric`, `./a11y/*`, `./security/*` | matching runtime module as `.d.ts` plus `./fabric/xtend-policy-public-types.d.ts` | `WP-TypeExports-05` completed |
| Builder | `./builder`, `./builder/*` | `./xtend-builder/**/*.d.ts` plus `./xtend-builder/builder-public-types.d.ts` | `WP-TypeExports-06` completed |
| Catalog | `./catalog/*` | `./catalog/*.d.ts` plus `./catalog/catalog-public-types.d.ts` | `WP-TypeExports-07` completed |
| Design Tokens and Vendor Facades | `./design-tokens`, `./design-tokens/xtheme-token-alias-layer`, `components/prism.js`, `components/turndown.js` | `./design-tokens/xtend-design-tokens.d.ts`, `./design-tokens/xtheme-token-alias-layer.d.ts`, `./components/prism.d.ts`, `./components/turndown.d.ts` | `WP-TypeExports-08` completed |
| Assets | `./style.css`, `./manifest`, JSON exports, `./package.json` | `types-not-required` | `WP-TypeExports-01` |

## Drift Report

The report `xtend.type-exports.drift-report.v1` checks:

- package export count and fingerprint against the Package Export Lock
- unclassified public exports
- declaration drift for all typed exports
- package `types` condition drift when an export has an explicit `types` condition
- wildcard declarations such as `./components/*.d.ts` and `./xtend-builder/*.d.ts`
- release/candidate gates and artifact checklist for the TypeExports handoff

`./components/*` remains an intentionally documented wildcard boundary with adjacent declarations. `./builder/*` has an explicit package `types` condition pointing to `./xtend-builder/*.d.ts`.

## Non-Goals

- No runtime import of XTend types in the RMT kernel.
- No porting of JS modules to TypeScript in the first run.
- No new runtime dependency for consumers.
- No copied type world from external vendor internals for Prism or Turndown.

## Handoff

`WP-TypeExports-02` delivered `./xtend-loader.d.ts`, `./xtend-dev.d.ts` and [XTend Loader Types](./xtend-loader-types.md). `WP-TypeExports-03` delivered `./api.d.ts` and [XTend API Types](./xtend-api-types.md) for `window.XTend.*`. `WP-TypeExports-04` delivered `./xtendrmt/rmt-core.d.ts`, `./tools/rmt-language/rmt-tooling-public-types.d.ts`, `./tools/rmt-language/app-platform-tooling.d.ts`, the RMT language facades and [XTend RMT Types](./xtend-rmt-types.md). `WP-TypeExports-05` delivered `./fabric/xtend-policy-public-types.d.ts`, Fabric/a11y/security facades and [XTend Policy Types](./xtend-policy-types.md). `WP-TypeExports-06` delivered `./xtend-builder/builder-public-types.d.ts`, builder/scaffold/Component Lab facades and [XTend Builder Types](./xtend-builder-types.md). `WP-TypeExports-07` delivered `./catalog/catalog-public-types.d.ts`, catalog facades and [XTend Catalog Types](./xtend-catalog-types.md). `WP-TypeExports-08` delivered `./design-tokens/xtend-design-tokens.d.ts`, `./design-tokens/xtheme-token-alias-layer.d.ts`, `./components/prism.d.ts`, `./components/turndown.d.ts` and [XTend Vendor and Utility Types](./xtend-vendor-types.md). `WP-TypeExports-09` productizes the drift report and package handoff for release owners.
