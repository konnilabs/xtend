# XTend Test Suite

This directory contains the staged test-suite structure introduced in Epic 02.

## Local Entry Points

Run all currently implemented suites:

```bash
node scripts/run_xtend_tests.js
```

Run all suites through the NPM shortcut:

```bash
npm test
```

Run only the current core contract suite:

```bash
node scripts/run_xtend_tests.js core
```

Run the architecture quality gates:

```bash
node scripts/run_xtend_tests.js architecture
```

Run the pilot component-level suites:

```bash
node scripts/run_xtend_tests.js components
```

Run the Accessibility/Hydration gates:

```bash
node scripts/run_xtend_tests.js a11y-hydration
```

Run the Screenreader signal gates:

```bash
node scripts/run_xtend_tests.js screenreader-signals
npm run test:screenreader-signals
```

Run the Reduced Motion and High Contrast gates:

```bash
node scripts/run_xtend_tests.js motion-contrast
npm run test:motion-contrast
```

Run the Component Catalog Coverage Matrix gate:

```bash
node scripts/run_xtend_tests.js catalog-coverage
npm run test:catalog-coverage
node scripts/run_xtend_tests.js catalog-coverage --json
```

Run the visual and browser regression priority gate:

```bash
node scripts/run_xtend_tests.js regression-priority
npm run test:regression-priority
node scripts/run_xtend_tests.js regression-priority --json
```

Run the XTend-Fabric runtime gates:

```bash
node scripts/run_xtend_tests.js fabric
npm run test:fabric
```

Run the XTend-Fabric to XTendRMT lane mapping gates:

```bash
node scripts/run_xtend_tests.js fabric-lane-mapping
npm run test:fabric-lanes
```

Run the XTend-Fabric performance measurement gates:

```bash
node scripts/run_xtend_tests.js fabric-performance-measurements
npm run test:fabric-performance
```

Run the deterministic Performance regression gates:

```bash
node scripts/run_xtend_tests.js performance-regression
npm run test:performance
node scripts/run_xtend_tests.js performance-regression --json
```

Run the Lazy/Idle/Visible hydration policy gates:

```bash
node scripts/run_xtend_tests.js hydration-policy
npm run test:hydration-policy
node scripts/run_xtend_tests.js hydration-policy --json
```

Run the documentation and demo reference gates:

```bash
node scripts/run_xtend_tests.js references
```

Run the offline Supply-Chain policy gates:

```bash
node scripts/run_xtend_tests.js supply-chain
npm run test:supply-chain
node scripts/verify_supply_chain_policy.js --json
```

Run the Manifest/Dynamic Import policy gates:

```bash
node scripts/run_xtend_tests.js manifest-import-policy
npm run test:manifest-policy
node scripts/verify_manifest_import_policy.js --json
```

Run the XTendRMT compatibility gates:

```bash
node scripts/run_xtend_tests.js rmt-compatibility
```

Run the RMT vNext Primitive release gate:

```bash
npm run test:rmt-vnext-primitives:report
```

Run the browser smoke harness:

```bash
node scripts/run_xtend_tests.js browser
```

Run the SurfaceManager Quality Gates:

```bash
node scripts/run_xtend_tests.js surface-manager-quality --json
npm run test:surface-manager-quality
```

`WP-SM-07` adds Browser, A11y, Performance and Visual gates for a mixed Surface Stack with Windows, SidePanel, Modal, Dialog and Drawer.

Run the SurfaceManager native RMT surfaces gate:

```bash
node scripts/run_xtend_tests.js surface-native-rmt --json
npm run test:surface-native-rmt
```

`WP-SM-08` adds the native `surfaces` top-level RMT domain, the `xtend.surface` adapter handoff and RMT tooling checks for schema, normalizer, Semantic Graph, completions and linter.

Run the SurfaceManager release handoff gate:

```bash
node scripts/run_xtend_tests.js surface-release-handoff --json
npm run test:surface-release-handoff
```

`WP-SM-09` finalizes SurfaceManager authoring docs, Component Lab fixture, migration guide and release handoff while keeping the productive `xtend.surface` adapter runtime deferred.

Run the SurfaceManager runtime release handoff gate:

```bash
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
npm run test:surface-runtime-release-handoff
```

`WP-SM-19` finalizes the productive Surface Runtime claim, release gate matrix, migration notes, compatibility notes, SemVer hints and explicit open scopes across `WP-SM-10` to `WP-SM-18`.

Run the Epic 11 component UX browser smoke gate:

```bash
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
npm run test:component-ux-browser-smokes
```

After `WP-E12-03`, this gate includes the `x-tabs` navigation journey for Arrow/Home/End keyboard behavior, ARIA panel wiring and roving focus.

Run the Epic 11 Component Shell Theme Matrix gate:

```bash
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
npm run test:component-shell-theme-matrix
```

After `WP-E12-03`, the matrix keeps `x-tabs` in the Navigation/Routing family as a P0 visual-ready journey.

Run the Epic 12 Visual Snapshot Automation contract gate:

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation --json
npm run test:visual-snapshot-automation
node scripts/run_xtend_tests.js visual-snapshots --json
npm run test:visual-snapshots
```

`WP-E12-10` defines the local-only snapshot contract, scope matrix and DOM-first diff policy. `WP-E12-11` adds the local fixture, JSON DOM baseline and `visual-snapshots` runner. Binary pixel baselines remain optional and outside the node contract gate.

Run the Epic 12 Enterprise Design System Token gate:

```bash
node scripts/run_xtend_tests.js design-tokens --json
npm run test:design-tokens
```

`WP-E12-12` productizes `--xtend-*` tokens across `x-theme`, the Component Shell Theme Matrix and the Visual Snapshot baseline. Fixture-local `--matrix-*` and `--snapshot-*` tokens are no longer part of the visual gate surface.

Run the Epic 12 RC0 Gate Matrix gate:

```bash
node scripts/run_xtend_tests.js rc0-gate-matrix --json
npm run test:rc0-gate-matrix
```

`WP-E12-14` defines the local RC0 gate chain across PR Fast, Full Release, Snapshot, RMT Authoring, Conditional Network Gates, Package Dry Run and Known Residual Policy. It keeps `private-until-release-owner-approval` active.

Run the Epic 12 Docs Migration and Enterprise Adoption gate:

```bash
node scripts/run_xtend_tests.js epic12-docs-adoption --json
npm run test:epic12-docs-adoption
```

`WP-E12-15` updates the official docs, migration notes and Enterprise Adoption surface for RC0. It checks the Docs-App menu, `docs/rc0-adoption-guide.md`, `docs/enterprise-adoption.md`, package metadata, scaffold metadata, backlog, RC model and reference registry.

Run the Epic 12 RC0 Handoff gate:

```bash
node scripts/run_xtend_tests.js epic12-rc0-handoff --json
npm run test:epic12-rc0-handoff
```

`WP-E12-16` closes Epic 12 as `ready-for-release-owner-review-not-publish`. It checks the RC0 owner handoff, release boundary, known residual policy, docs, package metadata, scaffold metadata, backlog, RC model and reference registry.

Run the Epic 13 RC1 Readiness gate:

```bash
node scripts/run_xtend_tests.js epic13-rc1-readiness --json
npm run test:epic13-rc1-readiness
```

`WP-E13-01` starts the RC0-to-RC1 transfer. It checks the RC1 readiness model, gate mapping, feature-drift boundary, package metadata, scaffold metadata, docs, runner and reference registry.

Run the Epic 13 Release Owner Acceptance gate:

```bash
node scripts/run_xtend_tests.js epic13-release-owner-acceptance --json
npm run test:epic13-release-owner-acceptance
```

`WP-E13-02` defines the owner checklist with `accepted`, `deferred` and `blocked` decisions. It keeps automatic publish approval blocked; after `WP-E13-04`, the next handoff is `WP-E13-05`.

Run the Epic 13 Conditional Network Evidence gate:

```bash
node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json
npm run test:epic13-conditional-network-evidence
```

`WP-E13-03` defines the Evidence/Deferral contract for `npm audit --audit-level=moderate` and `npm sbom --sbom-format=cyclonedx --json`. The local gate stays offline and marks network execution as publish-blocking until real artifacts exist or an owner accepts the deferral.

Run the Epic 13 Package Export Lock gate:

```bash
node scripts/run_xtend_tests.js epic13-package-export-lock --json
npm run test:epic13-package-export-lock
npm run pack:dry-run:report
```

`WP-E13-04` locks `package.json#exports`, package `files`, package surface groups and the RC1 pack dry-run artifact paths. The local gate is static; `pack:dry-run:report` writes the Release Owner artifacts.

Run the TypeExports public declaration gate:

```bash
node scripts/run_xtend_tests.js type-exports --json
npm run test:type-exports
```

`WP-TypeExports-01` classifies every public package export, prepares package `types` condition targets and fails locally when the export lock changes without a TypeExports decision.

Run the TypeExports Loader declaration gate:

```bash
node scripts/run_xtend_tests.js type-exports-loader --json
npm run test:type-exports-loader
```

`WP-TypeExports-02` types `window.XTendLoader`, `window.XTendStyleRegistry`, `window.XTendSkeletonLoader`, loader events and the boot promise. The gate checks the declarations against the runtime object surface without changing the loader boot path.

Run the TypeExports API declaration gate:

```bash
node scripts/run_xtend_tests.js type-exports-api --json
npm run test:type-exports-api
```

`WP-TypeExports-03` types `initXTendAPI`, `window.XTend.*`, the legacy global aliases and `xtend-api-ready`. The gate checks `api.d.ts` against `api.js` while keeping the Core API runtime unchanged.

Run the TypeExports RMT declaration gate:

```bash
node scripts/run_xtend_tests.js type-exports-rmt --json
npm run test:type-exports-rmt
```

`WP-TypeExports-04` types `./rmt`, `./rmt/browser`, RMT-Language Tooling, LSP, Linter and Editor package exports. The gate checks package `types` conditions, declaration facades, shared RMT diagnostics/edit/report types and the no-XTend-UI-import boundary.

Run the TypeExports Policy declaration gate:

```bash
node scripts/run_xtend_tests.js type-exports-policy --json
npm run test:type-exports-policy
```

`WP-TypeExports-05` types Fabric, A11y and Security policy package exports. The gate checks package `types` conditions, declaration facades, shared policy diagnostics/report types and the no component/RMT-kernel runtime dependency boundary.

Run the TypeExports Builder declaration gate:

```bash
node scripts/run_xtend_tests.js type-exports-builder --json
npm run test:type-exports-builder
```

`WP-TypeExports-06` types Builder, Scaffold, Component Lab, Blueprint, Preview, Workflow and Typing Contract package exports. The gate checks package `types` conditions, declaration facades, shared builder plan/result/workflow types and the no runtime dependency boundary.

Run the TypeExports Catalog declaration gate:

```bash
node scripts/run_xtend_tests.js type-exports-catalog --json
npm run test:type-exports-catalog
```

`WP-TypeExports-07` types Catalog plan, report, gate and validation package exports. The gate checks package `types` conditions, declaration facades, SurfaceManager/Epic/Release catalog classification and the no runtime dependency boundary.

Run the TypeExports Vendor and Utility facade gate:

```bash
node scripts/run_xtend_tests.js type-exports-vendor --json
npm run test:type-exports-vendor
```

`WP-TypeExports-08` types the remaining utility edges: Prism, Turndown and the Design Token contract. The gate checks narrow vendor facades, the `./design-tokens` package `types` condition, Theme JSON as a documented data boundary and the absence of component `.js` declaration gaps.

Run the TypeExports release handoff gate:

```bash
npm run test:type-exports:release
```

`WP-TypeExports-09` productizes TypeExports as a Release Owner artifact. The aggregate gate runs `type-exports`, `type-exports-loader`, `type-exports-api`, `type-exports-rmt`, `type-exports-policy`, `type-exports-builder`, `type-exports-catalog` and `type-exports-vendor`, then writes `.xtend-test-results/xtend-type-exports-report.json`.

Run the Epic 13 Known Residual Triage gate:

```bash
node scripts/run_xtend_tests.js epic13-known-residual-triage --json
npm run test:epic13-known-residual-triage
```

`WP-E13-05` closes `xstate` and `x-utils` as RC1 Boundary Contracts and hands `xtend.component.hydrate` to `WP-E13-06`.

Run the Epic 13 Hydration Performance Closure gate:

```bash
node scripts/run_xtend_tests.js epic13-hydration-performance-closure --json
npm run test:epic13-hydration-performance-closure
```

`WP-E13-06` closes `xtend.component.hydrate` owner-free at `31ms / 32ms`, expects `warnCount === 0` in the local RC1 baseline and now hands off through the completed visual owner artifact normalization and RMT production readiness toward `WP-E13-10`.

Run the Epic 13 PROD Browser CSP Smoke gate:

```bash
node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke --json
npm run test:epic13-prod-browser-csp-smoke
npm run dev:local:csp
```

`WP-E13-07` prepares a same-origin, nonce-based PROD-like Browser/CSP fixture under `tests/browser/fixtures/epic13-prod-csp-smoke.html` and verifies the local server CSP header without requiring external network or an external browser driver.

Run the Epic 13 Visual Owner Artifact gate:

```bash
node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json
npm run test:epic13-visual-owner-artifact
```

`WP-E13-08` normalizes `xtend.epic13.visual-owner-artifact.v1`, `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json` and the optional screenshot path `.xtend-test-results/visual-snapshots/rc1/{family}/{viewport}/{theme}/{density}/{motion}.png` without requiring external browser drivers in the local gate.

Run the Epic 13 RMT Production Readiness gate:

```bash
node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json
npm run test:epic13-rmt-production-readiness
```

`WP-E13-09` bundles `xtend.epic13.rmt-production-readiness.v1`, RMT-first App Shell, Routing, Components, Fabric/Lanes, Lifecycle Telemetry, Diagnostics and Artifact Parity without requiring external network or browser drivers in the local gate.

Run the Epic 13 Trusted DOM Boundary gate:

```bash
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
npm run test:epic13-trusted-dom-boundary
```

`WP-E13-11` proves `xtend.epic13.trusted-dom-boundary.v1` with a browser-near Parsedown/RMT HTML fixture, sanitizer `xtend.security.trusted-dom-sanitizer.v1`, CSP connection and host-owned DOM sink without coupling XTend types into the RMT kernel.

Run the Epic 13 RC1 Migration Notes gate:

```bash
node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json
npm run test:epic13-rc1-migration-notes
```

`WP-E13-12` proves `xtend.epic13.rc1-migration-notes-semver.v1` with consumer-facing migration sections, the proposed `0.1.0-rc.1` SemVer decision, changelog requirements and the handoff to the final RC1 gate matrix.

Run the Epic 13 RC1 Gate Matrix and CI Handoff gate:

```bash
node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff --json
npm run test:epic13-rc1-gate-matrix-ci-handoff
```

`WP-E13-13` proves `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` with source gates, CI lanes, report artifacts, reference paths and the handoff to `WP-E13-14`.

Run the Epic 13 Release Report and Pack Dry Run Evidence gate:

```bash
node scripts/run_xtend_tests.js epic13-release-report-pack-dry-run-evidence --json
npm run test:epic13-release-report-pack-dry-run-evidence
```

`DPF-WP-02` proves `xtend.epic13.release-report-pack-dry-run-evidence.v1` with `release:report`, `pack:dry-run`, reproducible owner artifacts and the handoff to `DPF-WP-03`.

Run the Epic 13 Conditional Network Evidence CI gate:

```bash
node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci --json
npm run test:epic13-conditional-network-evidence-ci
```

`DPF-WP-03` proves `xtend.epic13.conditional-network-evidence-ci.v1` with the `conditional-network-evidence` CI job, `npm run conditional-network:evidence`, Audit/SBOM artifacts and owner-deferral output.

Run the Epic 11 Component UX Authoring Docs gate:

```bash
node scripts/run_xtend_tests.js component-ux-authoring-docs --json
npm run test:component-ux-authoring-docs
```

Run the Epic 11 Legacy Long-Tail Migration gate:

```bash
node scripts/run_xtend_tests.js component-long-tail-migration --json
npm run test:component-long-tail-migration
```

Write a machine-readable JSON report:

```bash
node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-test-report.json
npm run test:report
npm run test:pr:report
npm run test:release:full:report
```

Print JSON to stdout:

```bash
node scripts/run_xtend_tests.js --json
```

Inspect the scaffold verification plan:

```bash
node xtend-builder/scaffold.js verify --json
npm run scaffold:verify
```

Run the scaffold dry-run example:

```bash
npm run scaffold:dry-run
```

Inspect the scaffold typing contract:

```bash
node xtend-builder/scaffold.js typing --tag x-example --profile display --feature state --json
npm run scaffold:typing
```

Inspect the scaffold preview reference plan:

```bash
node xtend-builder/scaffold.js preview --tag x-example --profile display --feature state --json
npm run scaffold:preview
```

Inspect the scaffold extension-point contract:

```bash
node xtend-builder/scaffold.js extensions --tag x-example --profile display --feature state --json
npm run scaffold:extensions
```

The original Epic 01 verification command remains valid:

```bash
node scripts/verify_xtend_core_contracts.js
```

## Structure

- `core/`: Node-based static, runtime and architecture contract tests for XTend core modules.
- `components/`: component-level tests and gates for attributes, properties, slots, events, state sync, hydration and accessibility.
- `a11y/`: Screenreader signal contract gates under `xtend.a11y.screenreader-signals.v1`.
- `catalog/`: manifest-wide Component Catalog Coverage Matrix under `xtend.catalog.component-coverage-matrix.v1`.
- `docs/`: documentation gates for Component UX Authoring and other docs-backed handoffs.
- `fabric/`: XTend-Fabric runtime, diagnostics, reporter, boundary, fiber and RMT lane mapping gates.
- `performance/`: deterministic local Performance regression gates and baselines under `xtend.performance.regression-gate.v1`.
- `performance/hydration_policy_suite.js`: Lazy/Idle/Visible hydration policy gates under `xtend.fabric.hydration-policy.v1`.
- `security/`: offline security policy gates for Supply-Chain, License, Vulnerability and Release readiness.
- `security/manifest_import_policy_suite.js`: Manifest URL, Manifest Record and Dynamic Import policy gates under `xtend.security.manifest-import-gate.v1`.
- `references/`: documentation, demo and XTendRMT reference-path gates.
- `rmt/`: XTendRMT compatibility gates for scaffold bindings, native RMT domains, RMT metadata, template pilot flow, upstream handoff, runtime registries, XRouter adapter contracts, XTend component adapter contracts, State/Scheduler/Diagnostics bridge contracts, native bridge runtime regression and verify-plan wiring.
- `browser/`: browser smoke tests for Custom Elements, loader hydration, visible UI flows, Epic 11 UX compatibility journeys and Component Shell Theme Matrix contracts.
- `browser/fixtures/a11y-focus-keyboard-smoke.html`: browser-near A11y smoke for routing, overlays, form/input and tab keyboard behavior under `xtend.a11y.browser-keyboard-smoke.v1`.
- `browser/fixtures/epic11-ux-compatibility-smoke.html`: browser-near Epic 11 UX smoke for Form Controls, Feedback/Status, Navigation/Routing, Overlays and Layout/Display/Media under `xtend.epic11.component-ux-browser-smokes.v1`.
- `browser/fixtures/epic11-theme-matrix-smoke.html`: browser-near Epic 11 Component Shell Theme Matrix under `xtend.epic11.component-shell-theme-matrix.v1`.
- `a11y/screenreader_signal_suite.js`: Screenreader signal contract gate for `aria-live`, status regions, error regions and announcements.
- `fixtures/`: reusable fixture documents, pages and data for tests.
- `utils/`: shared test helpers and assertions.

## Reporting

The runner exits with `0` when all selected suites pass and `1` when at least one suite fails. JSON reports use schema `xtend.test.report.v1` and may include non-blocking `warnings` plus embedded suite reports such as `xtend.performance.regression-report.v1`; the local report directory `.xtend-test-results/` is ignored.

The active CI default gate is `.github/workflows/xtend-default-gates.yml` under `xtend.ci.default-gates.v1`. Since `ER-WP-37`, the workflow also follows `xtend.ci.gate-matrix.v1`: pull requests run `npm run test:pr:report` and upload `xtend-pr-gate-report-node-26`; push, manual and nightly runs use `npm run test:release:full:report` and upload `xtend-release-gate-report-node-26`. RMT vNext Primitive changes additionally run `npm run test:rmt-vnext-primitives:report` in the `rmt-vnext-primitive-gates` job and upload `xtend-rmt-vnext-primitives-gate-report-node-26`.

Epic 13 adds RC1 owner-readiness suites on top of the RC0 matrix, including `node scripts/run_xtend_tests.js epic13-known-residual-triage --json` for `xtend.epic13.known-residual-triage.v1`, `node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json` for `xtend.epic13.rmt-production-readiness.v1`, `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json` for `xtend.epic13.docs-rmt-production-hardening.v1`, `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json` for `xtend.epic13.trusted-dom-boundary.v1`, `node scripts/run_xtend_tests.js epic13-rc1-migration-notes --json` for `xtend.epic13.rc1-migration-notes-semver.v1` and `node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff --json` for `xtend.epic13.rc1-gate-matrix-ci-handoff.v1`.

`XTend-Scaffold` exposes its local verification workflow through schema `xtend.scaffold.verify-plan.v1`. The plan does not replace the test runner; it lists the smallest useful verification commands, the JSON report command and the full `npm test` handoff gate. Scaffolded type artifacts are planned through `xtend.scaffold.component-typing.v1` and remain `types-only-no-runtime-imports`. Scaffolded preview references are planned through `xtend.scaffold.component-preview.v1` and remain repo-local dry-run outputs until explicitly registered. Scaffolded extension points are planned through `xtend.scaffold.component-extension-points.v1` and remain no-op metadata until Epic 04 or Epic 05 implements a runtime. The A11y-Hydration gate also tracks `xtend.a11y.browser-keyboard-smoke.v1` for browser-near focus and keyboard behavior. The Screenreader signal gate tracks `xtend.a11y.screenreader-signals.v1` for `aria-live`, status regions, error regions, announcements and scaffold manifest output. The Component Catalog Coverage gate tracks `xtend.catalog.component-coverage-matrix.v1` for manifest-wide Source, Docs, Component-Suite, Fixture, Types, A11y and Performance maturity. The Manifest/Dynamic Import gate tracks `xtend.security.manifest-import-gate.v1` for local URL policy, allowlist and refusal diagnostics. The RMT compatibility gate uses `xtend.scaffold.rmt-compatibility-binding.v1` to verify that typing, manifest-plan, preview-plan, extension-points, component-files and workflow stay aligned. The same gate now also checks `xtend.rmt.template-pilot-flow.v1` as a reference-only pilot for RMT-based XTend templating, `xtend.rmt.upstream-handoff.v1` as the Epic 05 start contract, `xtend.rmt.components-domain.v1` as the native Component-Domain-Contract from Epic 05 / WP-05, `xtend.rmt.routes-domain.v1` as the native Route-Domain-Contract from Epic 05 / WP-06, `xtend.rmt.schedules-domain.v1` as the native Schedule-Policy-Domain-Contract from Epic 05 / WP-07, `xtend.rmt.dsl-normalization.v1` as the DSL-Normalization-Contract from Epic 05 / WP-08, `xtend.rmt.runtime-registry.v1` as the Route-/Component-Registry-Contract from Epic 05 / WP-09, `xtend.rmt.xrouter-adapter.v1` as the productive XRouter Adapter Contract from Epic 05 / WP-10, `xtend.rmt.xtend-component-adapter.v1` as the productive XTend Component Adapter Contract from Epic 05 / WP-11, `xtend.rmt.state-scheduler-diagnostics-bridge.v1` as the productive State/Scheduler/Diagnostics Bridge Contract from Epic 05 / WP-12, `xtend.rmt.artifact-parity.v1` as the Artifact-Parity-Contract from Epic 05 / WP-13, the native bestcase-demo migration from Epic 05 / WP-14, `xtend.rmt.wp15.native-bridge-fixture.v1` as the native bridge regression from Epic 05 / WP-15, `xtend.rmt.wp16.browser-smoke-fixture.v1` as the browser-smoke regression from Epic 05 / WP-16, `xtend.rmt.native-authoring-guide.v1` as the native authoring guide from Epic 05 / WP-17, `xtend.rmt.native-migration-guide.v1` as the native migration guide from Epic 05 / WP-17 and `xtend.rmt.epic05-closure.v1` as the Epic 05 closure review from WP-18.

## Current State

`WP-E02-02` created the test-suite shell and local runner. `WP-E02-03` moved the core verification path into `tests/core/core_contract_suite.js`; the legacy `scripts/verify_xtend_core_contracts.js` command now delegates to that structured suite. `WP-E02-05` adds the first browser smoke fixture for a real XTend Custom Element and accepts the fixture/source-contract validation as the deterministic default browser harness. `WP-E02-06` extends that browser harness with a core-flow fixture for loader, API, router, theme and overlay/feedback runtimes. `WP-E02-07` defines the Component-Level-Teststandard used by future component suites. `WP-E02-08` adds pilot component-level suites for `x-alert`, `x-toast` and `x-modal`. `WP-E02-09` adds a dedicated Accessibility/Hydration gate for prioritized UI runtime components and browser fixtures. `WP-E02-10` adds SSOT, Digital Twin and anti-technical-debt architecture gates. `WP-E02-11` adds documentation, demo and XTendRMT reference-path gates. `WP-E02-12` adds JSON reporting, NPM shortcuts and CI-preparation documentation. `WP-E03-08` connects XTend-Scaffold workflows to these local gates through `node xtend-builder/scaffold.js verify --json`. `WP-E03-09` adds the scaffold typing contract and prepared XTendRMT attachment metadata. `WP-E03-10` adds scaffold preview reference plans and reference-gate contracts. `WP-E03-11` adds scaffold extension-point contracts for templating, rendering and root lifecycle. `WP-E03-12` closes Epic 03 with KPI acceptance and keeps `npm test` as the final local handoff gate. Epic 04 starts with reference-gated RMT-Kompatibilitaetsvorbereitung for the XTend UI + XTendRMT product model. `WP-E04-08` adds the dedicated `rmt-compatibility` suite for RMT-compatible XTend artifacts. `WP-E04-09` adds a reference-only RMT/XTend template pilot under `xtend.rmt.template-pilot-flow.v1`. `WP-E04-10` adds opt-in migration and framework-agnostic guardrails for XTend, React, Vue, Vanilla JS and Custom Hosts. `WP-E04-11` adds the upstream handoff contract `xtend.rmt.upstream-handoff.v1` for Epic 05. `WP-E04-12` closes Epic 04 with KPI acceptance and keeps `npm test` as the final local handoff gate. Epic 05 starts with a reference-gated backlog for XTendRMT Bridge, native RMT Routing, XTend Component Adapter and XRouter Adapter. `WP-E05-01` accepts the Epic 04 handoff, fixes upstream RMT Source as Source-of-Truth and keeps `xtendrmt/` as artifact, demo and regression layer. `WP-E05-02` adds `xtend.rmt.host-adapter-lifecycle.v1` as the host-neutral Adapter Lifecycle Contract for registry and capability work. `WP-E05-03` adds `xtend.rmt.adapter-registry.v1` for Adapter Registry, Capability Requests, Negotiation Results and diagnostics-first failure handling. `WP-E05-04` adds `xtend.rmt.adapters-domain.v1` as the optional native `adapters` domain for XTend and non-XTend adapter records. `WP-E05-05` adds `xtend.rmt.components-domain.v1` for native Component Records, `WP-E05-06` adds `xtend.rmt.routes-domain.v1` for native Route Records, `WP-E05-07` adds `xtend.rmt.schedules-domain.v1` for referenzierbare Schedule Policies, `WP-E05-08` adds `xtend.rmt.dsl-normalization.v1` for Template-only-, App-DSL- and Legacy-Metadata-Normalisierung, `WP-E05-09` adds `xtend.rmt.runtime-registry.v1` for Route-/Component-Registry-Snapshots, `WP-E05-10` adds `xtend.rmt.xrouter-adapter.v1` for productive XRouter route mapping, registration and navigation sync, `WP-E05-11` adds `xtend.rmt.xtend-component-adapter.v1` for productive XTend component mapping, mount and hydration, `WP-E05-12` adds `xtend.rmt.state-scheduler-diagnostics-bridge.v1` for productive adapter result mirroring, scheduler endpoints and diagnostics, `WP-E05-13` adds `xtend.rmt.artifact-parity.v1` plus `scripts/verify_xtendrmt_artifact_parity.js` for schema, manifest, type and bundle drift checks, `WP-E05-14` migrates the Bestcase-Demo auf native RMT Domains and productive adapter paths, `WP-E05-15` erweitert Contract-, Schema- und Runtime-Gates um eine native Bridge-Fixture sowie ESM/browser-nahe Runtime-Probes, `WP-E05-16` ergaenzt den Browser-Harness um eine XTendRMT/XRouter/XTend/Vanilla-Host-Smoke-Fixture, `WP-E05-17` dokumentiert native RMT Authoring- und Migrationspfade fuer Routes, Components, Adapter und Schedules, und `WP-E05-18` schliesst Epic 05 mit KPI-Abnahme und finalem `npm test` Gate ab. `ER-WP-08` fuegt danach den `fabric` Gate fuer `xtend.fabric.api.v1`, Diagnostics, Reporter, Redaction, Fibers und RMT-Diagnostic-Consumption hinzu. `ER-WP-13` ergaenzt `fabric-lane-mapping` fuer `xtend.fabric.rmt-lane-mapping.v1`, generierte RMT Schedule Records, `a11y -> user-blocking` und die host-neutrale RMT-Kernel-Grenze. `ER-WP-19` ergaenzt den `performance-regression` Gate fuer `xtend.performance.regression-gate.v1`, lokale deterministische Baselines und Budget-Failure-Reports. `ER-WP-20` ergaenzt den `hydration-policy` Gate fuer `xtend.fabric.hydration-policy.v1`, visible/idle/lazy Hydration und RMT Schedule Delegation. `ER-WP-24` ergaenzt den Browser-Harness und A11y-Hydration-Gate um `xtend.a11y.browser-keyboard-smoke.v1` fuer Fokusfalle, Escape, Tab, Enter, Space, Pfeiltasten, Routing, Form/Input und Tabs. `ER-WP-25` ergaenzt den `screenreader-signals` Gate fuer `xtend.a11y.screenreader-signals.v1`, Live-Regionen, Statusregionen, Errorregionen und Announcements. `ER-WP-28` ergaenzt den `manifest-import-policy` Gate fuer `xtend.security.manifest-import-gate.v1`, lokale Manifest-/Modul-URLs, Allowlist und Refusal Diagnostics. `ER-WP-30` ergaenzt den offline `supply-chain` Gate fuer `xtend.security.supply-chain-gate-plan.v1`, Dependency Inventory, License Policy, Vulnerability Policy und Release-Handoff. `ER-WP-31` ergaenzt den `catalog-coverage` Gate fuer `xtend.catalog.component-coverage-matrix.v1`, Manifest-weite Component-Reifestatus und Handoff an Catalog-Folgepakete.
