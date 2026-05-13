# Package Export Lock

- Contract: `xtend.epic13.package-export-lock.v1`
- Report: `xtend.epic13.package-export-lock-report.v1`
- Surface: `xtend.epic13.package-export-surface.v1`
- Dry-Run Artifact: `xtend.epic13.package-dry-run-artifact.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-package-export-lock --json`

Der Package Export Lock macht den RC1-Paketinhalt pruefbar. Der lokale Gate validiert `package.json#exports`, `files`, die erwarteten Package Roots und die Surface Groups ohne `npm pack` auszufuehren.

## Surface Groups

| Gruppe | Zweck |
|--------|-------|
| Loader | `xtend-loader.js`, Legacy Stub, API, CSS und Manifest |
| Components | Manifest und Component-Dateien |
| Fabric | Fabric Runtime, RMT Lane Mapping und Hydration Policy |
| XTendRMT | ESM- und Browser-Runtime |
| Builder | Scaffold CLI, Preview, Typing und Performance Contracts |
| Docs | Docs-App, Markdown, Parsedown/RMT Shell und Referenzen |
| Security | Manifest, Trusted DOM und Supply-Chain Policies |
| Catalog | Gate-, Handoff- und Epic-Contracts |

## Release Owner Artifact

```bash
npm run pack:dry-run:report
```

Das Script schreibt:

- `.xtend-test-results/xtend-pack-dry-run.json`
- `.xtend-test-results/xtend-package-export-surface-lock.json`
- `.xtend-test-results/xtend-package-export-lock-report.json`

`private-until-release-owner-acceptance` bleibt aktiv. Der Lock beweist nur, dass Paketinhalt und Export Surface kontrolliert sind; er oeffnet kein Publishing.

## TypeExports Anschluss

Ab `WP-TypeExports-01` nutzt [TypeExports](./type-exports.md) den Package Export Lock als Quelle fuer die Public Export Surface. Der Gate `node scripts/run_xtend_tests.js type-exports --json` koppelt die 105 erwarteten Exports ueber Count und Fingerprint an `xtend.epic13.package-export-lock.v1` und erzwingt fuer neue Public Exports eine Type-Entscheidung. Ab `WP-TypeExports-02` besitzen `.`, `./loader` und `./legacy-loader` die Type-Ziele `./xtend-loader.d.ts` und `./xtend-dev.d.ts`; `node scripts/run_xtend_tests.js type-exports-loader --json` prueft diesen Anschluss gegen die Loader-Runtime. Ab `WP-TypeExports-03` besitzt `./api` das Type-Ziel `./api.d.ts`; `node scripts/run_xtend_tests.js type-exports-api --json` prueft den Core-API-Namespace gegen `api.js`. Ab `WP-TypeExports-04` besitzen `./rmt`, `./rmt/browser` und die RMT-Language-/Tooling-Exports Type-Ziele wie `./xtendrmt/rmt-core.d.ts` und `./tools/rmt-language/rmt-tooling-public-types.d.ts`; `node scripts/run_xtend_tests.js type-exports-rmt --json` prueft diesen Anschluss gegen die RMT Runtime- und Tooling-Surface. Ab `WP-TypeExports-05` besitzen Fabric/A11y/Security Exports Type-Ziele wie `./fabric/xtend-fabric.d.ts` und `./fabric/xtend-policy-public-types.d.ts`; `node scripts/run_xtend_tests.js type-exports-policy --json` prueft diesen Anschluss gegen die Policy-Surface. Ab `WP-TypeExports-06` besitzen Builder-Exports Type-Ziele wie `./xtend-builder/scaffold.d.ts`, `./xtend-builder/builder-public-types.d.ts` und `./xtend-builder/*.d.ts`; `node scripts/run_xtend_tests.js type-exports-builder --json` prueft diesen Anschluss gegen Scaffold, Generatoren, Component Lab und Typing Contracts. Ab `WP-TypeExports-07` besitzen Catalog-Exports Type-Ziele wie `./catalog/epic13-package-export-lock.d.ts` und das gemeinsame `./catalog/catalog-public-types.d.ts`; `node scripts/run_xtend_tests.js type-exports-catalog --json` prueft diesen Anschluss gegen Plan-/Report-/Validation-Catalogs. Ab `WP-TypeExports-08` besitzen Design Tokens und Vendor-Facades Type-Ziele wie `./design-tokens/xtend-design-tokens.d.ts`, `./design-tokens/xtheme-token-alias-layer.d.ts`, `./components/prism.d.ts` und `./components/turndown.d.ts`; `node scripts/run_xtend_tests.js type-exports-vendor --json` prueft diesen Anschluss gegen die Utility-Grenzen. Ab `WP-TypeExports-09` buendelt `npm run test:type-exports:release` die TypeExports-Gates als Release-Handoff und schreibt `.xtend-test-results/xtend-type-exports-report.json`.

## Handoff

Nach `WP-E13-04` hat `WP-E13-05` die Known Residual Triage unter [Known Residual Triage](./known-residual-triage.md) mit `xtend.epic13.known-residual-triage.v1` abgeschlossen. `WP-E13-06` hat die [Hydration Performance Closure](./hydration-performance-closure.md) mit `xtend.epic13.hydration-performance-closure.v1` abgeschlossen. `WP-E13-07` hat die [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md) vorbereitet, `WP-E13-08` hat [Visual Owner Artifacts](./visual-owner-artifacts.md) normalisiert, `WP-E13-09` hat [RMT Production Readiness](./rmt-production-readiness.md) gebuendelt, `WP-E13-10` hat [Docs RMT Production Hardening](./docs-rmt-production-hardening.md) abgeschlossen, `WP-E13-11` hat [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) abgeschlossen und `WP-E13-12` hat [RC1 Migration Notes](./rc1-migration-notes.md) abgeschlossen. Der aktuelle Export Lock erwartet 105 Package-Exports inklusive `./design-tokens/xtheme-token-alias-layer`, `./catalog/epic13-rc1-migration-notes`, `./catalog/epic14-rmt-tooling`, `./catalog/epic14-lsp-handoff` sowie der klassischen und vNext RMT-Tooling-Surface.
