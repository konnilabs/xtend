# XTend Vendor Types

XTend Vendor Types document narrow public facades for utility and design-token building blocks. They cover Prism, Turndown and Design Tokens without treating those implementations as broad runtime dependencies. This is useful for hosts that process Markdown, syntax highlighting or Theme JSON while importing only the stable XTend package surface.

## Vendor Surface

The central declarations are `./components/prism.d.ts`, `./components/turndown.d.ts`, `./design-tokens/xtend-design-tokens.d.ts` and `./design-tokens/xtheme-token-alias-layer.d.ts`. They describe small facades rather than whole third-party libraries. That keeps it clear which functions XTend publicly supports and which details still belong to the upstream library.

Design Tokens are more than a file of colors. The types describe token sets, theme metadata and alias layers that host applications can evaluate for their own design systems. A host can read a Theme JSON file, validate it and map it into its own system without importing private XTend internals.

## Stability Rule

Vendor facades stay narrow. When a third-party library offers new capabilities, XTend should expose only the parts that are needed as public contract. Broad re-exports would make the package surface harder to control and bind third-party developers to details XTend cannot guarantee. The same rule applies to Design Tokens: public token contracts yes, internal build helpers no.

This boundary also helps packaging. Pack dry runs and export locks can verify that declarations are present in the package without treating the entire vendor tree as public API.

## Local Verification

Run the vendor type check whenever Prism, Turndown, Design Tokens, the theme alias layer or package exports change.

```bash
node scripts/run_xtend_tests.js type-exports-vendor --json
```

```txt
schema: xtend.type-exports.vendor-facades.v1
local gate: node scripts/run_xtend_tests.js type-exports-vendor --json
report: .xtend-test-results/xtend-type-exports-vendor-report.json
```

## Maintenance Notes

Add vendor types only when a host should actually import that shape. Purely internal adapters can keep a local module type. Public design-token changes should update an example theme, the alias layer and documentation together. This keeps Prism, Turndown and Theme JSON convenient without turning XTend into a passthrough export for every dependency.
