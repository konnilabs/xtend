# XTend Vendor and Utility Types

- Contract: `xtend.type-exports.vendor-facades.v1`
- Workpackage: `WP-TypeExports-08`
- Gate: `node scripts/run_xtend_tests.js type-exports-vendor --json`
- Report: `.xtend-test-results/xtend-type-exports-vendor-report.json`

## Purpose

`WP-TypeExports-08` closes the remaining type-facade gaps on edge modules. The facades are intentionally narrow: XTend does not copy the full Prism or Turndown type world, but describes only the stable usage boundary inside the project.

## Facades

- `./components/prism.d.ts` describes the global and CommonJS-capable Prism facade with `highlight`, `highlightElement`, `highlightAllUnder`, `hooks`, `languages` and `Token`.
- `./components/turndown.d.ts` describes the browser-global facade `window.TurndownService` for side-effect imports and local Markdown conversion.
- `./design-tokens/xtend-design-tokens.d.ts` describes the productive design-token contract `xtend.design-tokens.product-contract.v1`, theme packs, density packs and validators.
- `./design-tokens/xtheme-token-alias-layer.d.ts` describes the XTheme alias layer `xtend.theme.token-alias-layer.v1`, legacy bridges, component aliases and validators.

## Theme JSON

`./design-tokens/themes/enterprise-light` remains a JSON boundary. The example theme is exported as a data artifact and does not require its own runtime declaration. Consumers that import JSON should use their project configuration for JSON modules.

## Non-Goals

- No full typing of the entire Prism language list.
- No adoption of external vendor internals into XTend namespace types.
- No runtime change to `components/prism.js`, `components/turndown.js`, `design-tokens/xtend-design-tokens.js` or `design-tokens/xtheme-token-alias-layer.js`.

## Drift Gate

```bash
node scripts/run_xtend_tests.js type-exports-vendor --json
npm run test:type-exports-vendor
```

The gate verifies that `./design-tokens` and `./design-tokens/xtheme-token-alias-layer` have a `types` condition, that the component vendor files have their own `.d.ts` facades, that no component `.js` file remains without a declaration-gap decision, and that the facades do not copy runtime imports or vendor implementation details.
