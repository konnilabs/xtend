# XTend Native-First Performance Complexity Bundle Budget Gates Matrix

- Status: `accepted by NFM-WP-19`
- Datum: 3. Juni 2026
- Contract: `xtend.native-first.performance-complexity-bundle-budget-gates.v1`
- Budget Matrix: `xtend.native-first.performance-complexity-bundle-budget-gate-matrix.v1`
- Budget Item Schema: `xtend.native-first.performance-complexity-bundle-budget-gate.v1`
- Fixture Schema: `xtend.native-first.performance-complexity-bundle-budget-gate-fixture.v1`
- Fixture Pack: `xtend.native-first.performance-complexity-bundle-budget-gate-fixtures.v1`
- Report Schema: `xtend.native-first.performance-complexity-bundle-budget-gates-report.v1`
- Fixture Path: `tests/fixtures/native-first/native-first-budget-gate-fixtures.json`
- Local Gate: `node scripts/run_xtend_tests.js native-first-budget-gates --json`
- Package Script: `npm run test:native-first-budget-gates`

## Budget Gates

Pflichtfelder je Budget-Zeile: `budgetId`, `budgetClass`, `sourceWorkpackages`, `sourceRecipes`, `sourceProofs`, `status`, `measuredSurface`, `budgetMetric`, `threshold`, `requiredGates`, `evidenceArtifacts`, `enforcementMode`, `residual`, `owner`, `nextHandoff`.

| Budget-ID | Budget Class | Source Workpackages | Source Recipes | Source Proofs | Status | Measured Surface | Budget Metric | Threshold | Required Gates | Evidence Artifacts | Enforcement Mode | Residual | Owner | Next Handoff |
|-----------|--------------|---------------------|----------------|---------------|--------|------------------|---------------|-----------|----------------|--------------------|------------------|----------|-------|--------------|
| `NFM-BGT-01` | `bundle-dependency-delta` | `NFM-WP-04`, `NFM-WP-17`, `NFM-WP-18` | `NFM-RCR-01`, `NFM-RCR-09` | `NFM-RDP-01`, `NFM-RDP-06` | `budget-accepted-with-existing-gate` | Runtime dependencies and production bundle | runtime dependency delta, external UI framework dependency delta, bundle budget gate | `runtimeDependenciesAddedMax=0`; `externalUiFrameworkDependenciesAddedMax=0`; `productionBundleClaimRequiresGate=true` | `supply-chain`, `maraca-size-budget`, `native-first-evidence-pack` | `package-lock.json`, `.xtend-build/maraca/source-to-sea/xtend.maraca.report.json`, `.xtend-test-results/xtend-npm-audit-report.json` | `hard-local-gate` | `network sbom bleibt conditional` | `supply-chain-owner` | `NFM-WP-21`, `NFM-WP-22` |
| `NFM-BGT-02` | `mount-hydration-render` | `NFM-WP-17`, `NFM-WP-18` | `NFM-RCR-01`, `NFM-RCR-02`, `NFM-RCR-09` | `NFM-RDP-01`, `NFM-RDP-06` | `budget-accepted-with-existing-gate` | App shell, dashboard and docs progressive boot | mount, hydration, SSR prehydration and CLS reserve | `componentHydrateBudgetMs=16`; `docsPrehydrationBytesMax=256000`; `clsBudget=0.01` | `performance-regression`, `component-ux-performance`, `docs-php-ssr-performance-budget`, `docs-php-ssr-cls-budget` | `tests/performance/baselines/local-performance-baseline.json`, `docs/index.php`, `xtend-builder/performance/component-ux-performance-contract.js` | `hard-local-gate` | `real browser timings bleiben optional browser-lab evidence` | `performance-owner` | `NFM-WP-20`, `NFM-WP-22` |
| `NFM-BGT-03` | `interaction-scheduler-lane` | `NFM-WP-09`, `NFM-WP-16`, `NFM-WP-18` | `NFM-RCR-03`, `NFM-RCR-05`, `NFM-RCR-07` | `NFM-RDP-05`, `NFM-RDP-06` | `budget-accepted` | Form submit, navigation feedback, command/search and action refs | event action, route render, scheduler lane and cleanup budget | `eventActionBudgetMs=16`; `routeRenderBudgetMs=120`; `listenerCleanupRequired=true` | `component-ux-performance`, `performance-regression`, `rmt-event-routing-runtime`, `rmt-action-effect-runtime` | `xtend-builder/performance/component-ux-performance-contract.js`, `xtendrmt/rmt-event-routing-runtime.js`, `xtendrmt/rmt-action-effect-runtime.js` | `hard-local-gate` | `command-search maximality bleibt product residual` | `rmt-event-action-owner` | `NFM-WP-20`, `owned-command-search-package` |
| `NFM-BGT-04` | `adapter-complexity-framework-leverage` | `NFM-WP-09`, `NFM-WP-14`, `NFM-WP-18` | `NFM-RCR-04`, `NFM-RCR-06`, `NFM-RCR-09` | `NFM-RDP-02`, `NFM-RDP-03`, `NFM-RDP-04` | `budget-accepted` | RMT adapters, framework leverage layer and DOM descriptor renderer | adapter layer count, source map coverage, trust boundary coverage and kernel import boundary | `adapterLayerMax=1`; `sourceMapRequired=true`; `kernelHostImportMax=0`; `freeHtmlSinkMax=0` | `contract-runtime-parity`, `rmt-dom-descriptor-renderer`, `rmt-renderer-dom-descriptor-proofs`, `references` | `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md`, `docs/rmt-dom-descriptor-renderer.md`, `tests/fixtures/native-first/rmt-renderer-dom-descriptor-proof-fixtures.json` | `hard-local-gate` | `surface maximality bleibt surface-browser-lab residual` | `framework-leverage-owner` | `NFM-WP-20`, `surface-browser-lab` |
| `NFM-BGT-05` | `browser-smoke-visual-evidence` | `NFM-WP-17`, `NFM-WP-18` | `NFM-RCR-01`, `NFM-RCR-04`, `NFM-RCR-08`, `NFM-RCR-09` | `NFM-RDP-02`, `NFM-RDP-04`, `NFM-RDP-06` | `budget-accepted-with-browser-lab-residual` | Browser smokes, source-to-sea evidence, media and docs visual baselines | smoke result, viewport correlation, visual baseline and layout shift budget | `browserSmokeRequired=true`; `visualBaselineRequiredForRelease=true`; `layoutShiftBudgetPx=1`; `externalBrowserRequired=false for local gate` | `browser`, `rmt-vnext-source-to-sea`, `docs-php-ssr-cls-budget`, `rmt-renderer-dom-descriptor-proofs` | `tests/browser/fixtures`, `tests/browser/visual-baselines`, `scripts/capture_rmt_vnext_source_to_sea_evidence.js` | `conditional-browser-gate` | `real browser artifact storage bleibt owner-controlled` | `browser-lab-owner` | `NFM-WP-20`, `NFM-WP-22`, `surface-browser-lab` |
| `NFM-BGT-06` | `regression-release-handoff` | `NFM-WP-11`, `NFM-WP-13`, `NFM-WP-18`, `NFM-WP-19` | `NFM-RCR-01`, `NFM-RCR-09` | `NFM-RDP-06` | `budget-handoff-to-release-owner` | Release evidence pack and contract registry | registry discoverability, audit evidence, budget report and release owner residuals | `budgetGateEntryRequired=true`; `releaseResidualRequired=true`; `nonNativeFeatureWithoutBudget=blocked` | `native-first-budget-gates`, `contract-registry`, `native-first-evidence-pack`, `references` | `development/XTend-Native-First-Contract-Registry.md`, `development/XTend-Native-First-Audit-Evidence-Pack.md`, `package.json` | `release-owner-review` | `final release acceptance bleibt NFM-WP-22` | `release-owner` | `NFM-WP-22` |

## Status Summary

| Status | Anzahl |
|--------|--------|
| `budget-accepted` | 2 |
| `budget-accepted-with-existing-gate` | 2 |
| `budget-accepted-with-browser-lab-residual` | 1 |
| `budget-handoff-to-release-owner` | 1 |

## Coverage Summary

| Coverage | Budget IDs |
|----------|------------|
| Bundle and dependencies | `NFM-BGT-01` |
| Mount, hydration, SSR and CLS | `NFM-BGT-02` |
| Interaction and scheduler lanes | `NFM-BGT-03` |
| Adapter and framework leverage complexity | `NFM-BGT-04` |
| Browser smoke and visual evidence | `NFM-BGT-05` |
| Regression and release owner handoff | `NFM-BGT-06` |

## Blocked Claims

| Claim | Entscheidung |
|-------|--------------|
| `no-production-budget-claim-without-gate` | bleibt blockierend |
| `no-production-bundle-claim-without-release-gate` | bleibt blockierend |
| `non-native-feature-without-budget` | bleibt blockierend |
| `external-ui-framework-dependency-without-exit-plan` | bleibt blockierend |
| `real-browser-visual-claim-without-artifact` | bleibt Residual bis owner-kontrollierte Browser-Lab-Evidence existiert |
