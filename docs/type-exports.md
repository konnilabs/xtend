# XTend TypeExports

- Contract: `xtend.type-exports.plan.v1`
- Release Contract: `xtend.type-exports.drift-report.v1`
- Workpackage: `WP-TypeExports-09`
- Gate: `node scripts/run_xtend_tests.js type-exports --json`
- Release Gate: `npm run test:type-exports:release`
- Report: `.xtend-test-results/xtend-type-exports-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Zweck

TypeExports macht die oeffentliche `package.json` Export-Surface fuer TypeScript-Consumer explizit. Der erste Run hat jeden Public Export klassifiziert; `WP-TypeExports-02` bis `WP-TypeExports-08` haben die Declaration Packs geliefert. Ab `WP-TypeExports-09` ist TypeExports ein produktiver Release-Gate mit Drift-Report.

Der Gate ist absichtlich strikt: Wenn ein neuer Public Export in `package.json` auftaucht, ohne dass die TypeExports-Klassifikation aktualisiert wurde, schlaegt `type-exports` lokal fehl. Der Release-Gate buendelt zusaetzlich alle TypeExports-Teilpakete und schreibt den Handoff-Report:

```bash
npm run test:type-exports:release
```

## Type Condition Matrix

| Export-Bereich | Beispiele | Ziel-Declaration | Workpackage |
| --- | --- | --- | --- |
| Loader | `.`, `./loader` | `./xtend-loader.d.ts` | `WP-TypeExports-02` completed |
| Legacy Loader | `./legacy-loader` | `./xtend-dev.d.ts` | `WP-TypeExports-02` completed |
| Core API | `./api` | `./api.d.ts` | `WP-TypeExports-03` completed |
| Components | `./components/*` | `./components/*.d.ts` | `ER-WP-34` |
| RMT Runtime | `./rmt`, `./rmt/browser`, `./rmt/dom-descriptor-renderer`, `./rmt/state-selector-runtime`, `./rmt/action-effect-runtime`, `./rmt/event-routing-runtime`, `./rmt/surface-resource-graph-runtime` | `./xtendrmt/rmt-core.d.ts`, `./xtendrmt/rmt-dom-descriptor-renderer.d.ts`, `./xtendrmt/rmt-state-selector-runtime.d.ts`, `./xtendrmt/rmt-action-effect-runtime.d.ts`, `./xtendrmt/rmt-event-routing-runtime.d.ts`, `./xtendrmt/rmt-surface-resource-graph-runtime.d.ts` | `WP-TypeExports-04` completed |
| RMT Language und Tooling | `./rmt-language/*`, `./rmt-language/app-platform-tooling`, `./rmt-linter/*`, `./rmt-language-server/*` | jeweiliges `tools/**/*.d.ts` plus `./tools/rmt-language/rmt-tooling-public-types.d.ts` | `WP-TypeExports-04` completed |
| Fabric, A11y, Security | `./fabric`, `./a11y/*`, `./security/*` | jeweiliges Runtime-Modul als `.d.ts` plus `./fabric/xtend-policy-public-types.d.ts` | `WP-TypeExports-05` completed |
| Builder | `./builder`, `./builder/*` | `./xtend-builder/**/*.d.ts` plus `./xtend-builder/builder-public-types.d.ts` | `WP-TypeExports-06` completed |
| Catalog | `./catalog/*` | `./catalog/*.d.ts` plus `./catalog/catalog-public-types.d.ts` | `WP-TypeExports-07` completed |
| Design Tokens und Vendor Facades | `./design-tokens`, `./design-tokens/xtheme-token-alias-layer`, `components/prism.js`, `components/turndown.js` | `./design-tokens/xtend-design-tokens.d.ts`, `./design-tokens/xtheme-token-alias-layer.d.ts`, `./components/prism.d.ts`, `./components/turndown.d.ts` | `WP-TypeExports-08` completed |
| Assets | `./style.css`, `./manifest`, JSON-Exports, `./package.json` | `types-not-required` | `WP-TypeExports-01` |

## Drift Report

Der Report `xtend.type-exports.drift-report.v1` prueft:

- Package Export Count und Fingerprint gegen den Package Export Lock
- unklassifizierte Public Exports
- Declaration Drift fuer alle typisierten Exports
- Package `types`-Condition Drift, wenn ein Export eine explizite `types`-Condition besitzt
- Wildcard-Declarations wie `./components/*.d.ts` und `./xtend-builder/*.d.ts`
- Release-/Candidate-Gates und Artifact-Checklist fuer das TypeExports-Handoff

`./components/*` bleibt eine bewusst dokumentierte Wildcard-Grenze mit adjacent Declarations. `./builder/*` besitzt eine explizite Package `types`-Condition auf `./xtend-builder/*.d.ts`.

## Nicht-Ziele

- Kein Runtime-Import von XTend-Typen im RMT-Kernel.
- Keine Portierung von JS-Modulen nach TypeScript im ersten Run.
- Keine neue Runtime-Abhaengigkeit fuer Consumer.
- Keine Typkopie fremder Vendor-Interna fuer Prism oder Turndown.

## Handoff

`WP-TypeExports-02` hat `./xtend-loader.d.ts`, `./xtend-dev.d.ts` und [XTend Loader Types](./xtend-loader-types.md) geliefert. `WP-TypeExports-03` hat `./api.d.ts` und [XTend API Types](./xtend-api-types.md) fuer `window.XTend.*` geliefert. `WP-TypeExports-04` hat `./xtendrmt/rmt-core.d.ts`, `./tools/rmt-language/rmt-tooling-public-types.d.ts`, `./tools/rmt-language/app-platform-tooling.d.ts`, die RMT-Language-Facades und [XTend RMT Types](./xtend-rmt-types.md) geliefert. `WP-TypeExports-05` hat `./fabric/xtend-policy-public-types.d.ts`, Fabric/A11y/Security-Facades und [XTend Policy Types](./xtend-policy-types.md) geliefert. `WP-TypeExports-06` hat `./xtend-builder/builder-public-types.d.ts`, Builder-/Scaffold-/Component-Lab-Facades und [XTend Builder Types](./xtend-builder-types.md) geliefert. `WP-TypeExports-07` hat `./catalog/catalog-public-types.d.ts`, Catalog-Facades und [XTend Catalog Types](./xtend-catalog-types.md) geliefert. `WP-TypeExports-08` hat `./design-tokens/xtend-design-tokens.d.ts`, `./design-tokens/xtheme-token-alias-layer.d.ts`, `./components/prism.d.ts`, `./components/turndown.d.ts` und [XTend Vendor and Utility Types](./xtend-vendor-types.md) geliefert. `WP-TypeExports-09` produktisiert den Drift-Report und das Package-Handoff fuer Release Owner.
