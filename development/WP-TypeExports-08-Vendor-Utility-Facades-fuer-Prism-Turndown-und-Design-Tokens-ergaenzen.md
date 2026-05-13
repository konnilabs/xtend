# WP-TypeExports-08 - Vendor-/Utility-Facades fuer Prism, Turndown und Design Tokens ergaenzen

- Status: `completed`
- Contract: `xtend.type-exports.vendor-facades.v1`
- Report: `xtend.type-exports.vendor-facades-report.v1`
- Gate: `node scripts/run_xtend_tests.js type-exports-vendor --json`
- Package Script: `npm run test:type-exports-vendor`
- Report Artifact: `.xtend-test-results/xtend-type-exports-vendor-report.json`

## Ziel

Die verbleibenden Randmodule erhalten leichte Type-Facades. Das Komponentenverzeichnis soll keinen unbegruendeten `.js` ohne Type-Facade-Gap mehr enthalten, und `./design-tokens` soll fuer TypeScript-Consumer als Package-Export nutzbar sein.

## Gelieferte Artefakte

- `components/prism.d.ts`
- `components/turndown.d.ts`
- `design-tokens/xtend-design-tokens.d.ts`
- `catalog/type-exports-vendor.js`
- `tests/types/vendor_type_exports_suite.js`
- `docs/xtend-vendor-types.md`

## Scope-Grenze

Vendor-Facades bleiben schmal. XTend beschreibt nur die stabile Nutzungsgrenze fuer Prism, Turndown und Design Tokens und kopiert keine fremden Vendor-Interna oder Sprachlisten.

Theme JSON bleibt bewusst Datenartefakt: `design-tokens/themes/enterprise-light.json` wird dokumentiert, aber nicht als eigene Runtime-Declaration ausgeweitet.

## Definition of Done

- `components/prism.js` und `components/turndown.js` besitzen Facade-Declarations.
- `design-tokens/xtend-design-tokens.js` besitzt eine Public Declaration und `./design-tokens` eine `types`-Condition.
- Der lokale Gate prueft Component-Declaration-Gaps, Package-Export-Drift und schmale Vendor-Facades.

## Handoff

`WP-TypeExports-09` kann nun TypeExports als produktiven Release-Drift-Gate und Handoff-Artefakt buendeln.
