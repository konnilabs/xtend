# Package Export Lock

- Contract: `xtend.epic13.package-export-lock.v1`
- Report: `xtend.epic13.package-export-lock-report.v1`
- Surface: `xtend.epic13.package-export-surface.v1`
- Dry-run artifact: `xtend.epic13.package-dry-run-artifact.v1`
- Local gate: `node scripts/run_xtend_tests.js epic13-package-export-lock --json`

The Package Export Lock makes the RC1 package content checkable. The local gate validates `package.json#exports`, `files`, the expected package roots and the surface groups without running `npm pack`.

## Surface Groups

| Group | Purpose |
|-------|---------|
| Loader | `xtend-loader.js`, legacy stub, API, CSS and manifest |
| Components | manifest and component files |
| Fabric | Fabric runtime, RMT lane mapping and hydration policy |
| XTendRMT | ESM and browser runtime |
| Builder | Scaffold CLI, preview, typing and performance contracts |
| Docs | Docs app, Markdown, Parsedown/RMT shell and references |
| Security | manifest, Trusted DOM and supply-chain policies |
| Catalog | gate, handoff and epic contracts |

## Release Owner Artifact

```bash
npm run pack:dry-run:report
```

The script writes:

- `.xtend-test-results/xtend-pack-dry-run.json`
- `.xtend-test-results/xtend-package-export-surface-lock.json`
- `.xtend-test-results/xtend-package-export-lock-report.json`

`private-until-release-owner-acceptance` remains active. The lock only proves that package content and export surface are controlled; it does not open publishing.

## TypeExports Connection

As of `WP-TypeExports-01`, [TypeExports](./type-exports.md) uses the Package Export Lock as the source for the public export surface. The gate `node scripts/run_xtend_tests.js type-exports --json` ties the 121 expected exports to `xtend.epic13.package-export-lock.v1` through count and fingerprint and requires a type decision for new public exports. As of `WP-TypeExports-02`, `.`, `./loader` and `./legacy-loader` have the type targets `./xtend-loader.d.ts` and `./xtend-dev.d.ts`; `node scripts/run_xtend_tests.js type-exports-loader --json` checks this connection against the loader runtime. As of `WP-TypeExports-03`, `./api` has the type target `./api.d.ts`; `node scripts/run_xtend_tests.js type-exports-api --json` checks the core API namespace against `api.js`. As of `WP-TypeExports-04`, `./rmt`, `./rmt/browser`, `./rmt/dom-descriptor-renderer`, `./rmt/component-capability-registry`, `./rmt/state-selector-runtime`, `./rmt/action-effect-runtime`, `./rmt/event-routing-runtime`, `./rmt/surface-resource-graph-runtime`, `./rmt/native-shell-runtime`, `./rmt-language/app-platform-tooling` and the RMT language/tooling exports have type targets such as `./xtendrmt/rmt-core.d.ts`, `./xtendrmt/rmt-dom-descriptor-renderer.d.ts`, `./xtendrmt/rmt-state-selector-runtime.d.ts`, `./xtendrmt/rmt-action-effect-runtime.d.ts`, `./xtendrmt/rmt-event-routing-runtime.d.ts`, `./xtendrmt/rmt-surface-resource-graph-runtime.d.ts`, `./tools/rmt-language/app-platform-tooling.d.ts` and `./tools/rmt-language/rmt-tooling-public-types.d.ts`; `node scripts/run_xtend_tests.js type-exports-rmt --json` checks this connection against the RMT runtime and tooling surface. As of `WP-TypeExports-05`, Fabric/a11y/security exports have type targets such as `./fabric/xtend-fabric.d.ts` and `./fabric/xtend-policy-public-types.d.ts`; `node scripts/run_xtend_tests.js type-exports-policy --json` checks this connection against the policy surface. As of `WP-TypeExports-06`, builder exports have type targets such as `./xtend-builder/scaffold.d.ts`, `./xtend-builder/builder-public-types.d.ts` and `./xtend-builder/*.d.ts`; `node scripts/run_xtend_tests.js type-exports-builder --json` checks this connection against Scaffold, generators, Component Lab and typing contracts. As of `WP-TypeExports-07`, catalog exports have type targets such as `./catalog/epic13-package-export-lock.d.ts` and the shared `./catalog/catalog-public-types.d.ts`; `node scripts/run_xtend_tests.js type-exports-catalog --json` checks this connection against plan/report/validation catalogs. As of `WP-TypeExports-08`, design tokens and vendor facades have type targets such as `./design-tokens/xtend-design-tokens.d.ts`, `./design-tokens/xtheme-token-alias-layer.d.ts`, `./components/prism.d.ts` and `./components/turndown.d.ts`; `node scripts/run_xtend_tests.js type-exports-vendor --json` checks this connection against the utility boundaries. As of `WP-TypeExports-09`, `npm run test:type-exports:release` bundles the TypeExports gates as a release handoff and writes `.xtend-test-results/xtend-type-exports-report.json`.

## Handoff

After `WP-E13-04`, `WP-E13-05` completed the Known Residual Triage under [Known Residual Triage](./known-residual-triage.md) with `xtend.epic13.known-residual-triage.v1`. `WP-E13-06` completed the [Hydration Performance Closure](./hydration-performance-closure.md) with `xtend.epic13.hydration-performance-closure.v1`. `WP-E13-07` prepared the [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md), `WP-E13-08` normalized [Visual Owner Artifacts](./visual-owner-artifacts.md), `WP-E13-09` bundled [RMT Production Readiness](./rmt-production-readiness.md), `WP-E13-10` completed [Docs RMT Production Hardening](./docs-rmt-production-hardening.md), `WP-E13-11` completed [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md), `WP-E13-12` completed [RC1 Migration Notes](./rc1-migration-notes.md), `WP-E13-13` registered [RC1 Gate Matrix and CI Handoff](./rc1-gate-matrix-ci-handoff.md), `DPF-WP-02` added [Release Report and Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md) and `DPF-WP-03` added [Conditional Network Evidence CI](./conditional-network-evidence-ci.md). The current export lock expects 124 package exports including `./design-tokens/xtheme-token-alias-layer`, `./catalog/epic13-rc1-migration-notes`, `./catalog/epic13-rc1-gate-matrix-ci-handoff`, `./catalog/epic13-release-report-pack-dry-run-evidence`, `./catalog/epic13-conditional-network-evidence-ci`, `./rmt/dom-descriptor-renderer`, `./rmt/component-capability-registry`, `./rmt/state-selector-runtime`, `./rmt/action-effect-runtime`, `./rmt/event-routing-runtime`, `./rmt/surface-resource-graph-runtime`, `./rmt/native-shell-runtime`, `./rmt/node-ssr-adapter`, `./rmt-language/app-platform-tooling`, `./rmt-language/kernel-trust-authority`, `./rmt-language/kernel-security-regression`, `./catalog/epic14-rmt-tooling`, `./catalog/epic14-lsp-handoff` and the classic and vNext RMT tooling surface.
