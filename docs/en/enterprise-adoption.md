# XTend Enterprise Adoption Guide

- Status: Active since `ER-WP-39`, extended in `WP-E12-16`
- Docs Contract: `xtend.docs.enterprise-adoption.v1`
- Epic 12 Adoption Contract: `xtend.epic12.docs-adoption.v1`
- Workpackage: `ER-WP-39`, `WP-E12-15`, `WP-E12-16`
- Package Metadata: `xtend.enterpriseAdoption`, `xtend.epic12DocsAdoption`
- Scope: Loader, Dev Server, XTend-Fabric, XTendRMT, Security, A11y, Performance, CI Gates, RC0 Gate Matrix and Release Readiness

## Goal

This guide is the official starting path for teams that want to use XTend in enterprise web apps. It connects the previously separate product building blocks into an operative flow:

- XTend UI remains the Web Component and UI Builder product.
- XTendRMT remains scheduler, runtime bridge and templating kernel.
- XTend-Fabric is the local safety, diagnostics, telemetry and reporter layer.
- Local development remains CDN-free and uses the canonical ESM loader `xtend-loader.js`.

The guide does not start a publish process. `package.json` carries `private: false` for RC1 publish prep after release checklist and release owner have explicitly approved the publish boundary.

## Adoption Stages

| Stage | Result | Primary Artifacts |
|-------|--------|-------------------|
| 1. Local Baseline | XTend runs locally and CDN-free | `xtend-loader.js`, `components/manifest.json`, `npm run dev:local` |
| 2. UI Baseline | components are loaded from the manifest | `docs/components.md`, `docs/public-component-types.md` |
| 3. Fabric Baseline | errors, diagnostics and telemetry are locally visible | `fabric/xtend-fabric.js`, `docs/xtend-fabric.md` |
| 4. RMT Baseline | scheduling, routes and components run through native RMT domains | `docs/xtendrmt-app-dsl.md`, `docs/xtendrmt-runtime-bridge.md` |
| 5. Security Baseline | loader, import, DOM and supply-chain boundaries are understood | `docs/manifest-import-policy.md`, `docs/trusted-dom-sanitizing.md`, `docs/supply-chain-gates.md` |
| 6. Quality Baseline | performance, a11y and component coverage are gateable | `docs/performance.md`, `docs/screenreader-signals.md`, `docs/component-catalog-coverage.md` |
| 7. Release Baseline | PR, full-release and release-candidate gates are traceable | `development/XTend-CI-Gate-Matrix.md`, `development/XTend-Release-Checklist-und-SemVer-Policy.md` |
| 8. Epic 10 Baseline | TypeScript-first Component Platform and RMT-first apps are gateable | `docs/component-platform.md`, `docs/rmt-first-xtend-apps.md`, `docs/epic10-release-handoff.md` |
| 9. Epic 12 RC0 Baseline | long-tail closure, snapshot gate, design tokens, RMT DSL polish, RC0 matrix and owner handoff are documented for adoption | `docs/rc0-adoption-guide.md`, `docs/rc0-gate-matrix.md`, `docs/epic12-rc0-handoff.md` |
| 10. Epic 13 RC1 Readiness | RC0-to-RC1 gate reconciliation, release-owner acceptance, network evidence, package dry-run export lock, known residual triage, hydration performance closure, PROD-near CSP smokes, visual owner artifacts, RMT production readiness and Docs RMT production hardening are scoped | `docs/rc1-readiness.md`, `docs/hydration-performance-closure.md`, `docs/prod-browser-csp-smokes.md`, `docs/rmt-production-readiness.md`, `docs/docs-rmt-production-hardening.md`, `development/RC0-RC1-transfer-EPIC13.md` |

## 1. Local Baseline

Use the local dev/test server and the canonical loader:

```bash
npm run dev:local
```

The loader is:

```text
xtend-loader.js
```

The legacy stub `xtend-dev.js` remains only a compatibility surface. New apps reference `xtend-loader.js` directly and configure the manifest locally:

```html
<script
  type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json">
</script>
```

Required rules:

- No CDN in the default path.
- No external manifest or module URLs.
- Use `window.__XTendLoaderBootPromise` when app code has to wait for loaded components.
- Browser-near demos and fixtures run through the local server.

Further reading: [XTend Loader](./xtend-loader.md), [Manifest Import Policy](./manifest-import-policy.md).

For PROD-near CSP smokes, the contract `xtend.epic13.prod-browser-csp-smoke.v1` is additionally available starting with `WP-E13-07`:

```bash
npm run test:epic13-prod-browser-csp-smoke
npm run dev:local:csp
```

Further reading: [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md).

## 2. UI Baseline

XTend components are loaded as Custom Elements through the manifest. Enterprise teams should start with the prioritized, type-gated components:

- Routing: `x-router`, `x-link`
- Overlays: `x-dialog`, `x-modal`, `x-lightbox`
- Forms: `x-input`, `x-form`, `x-calendar`, `x-writer`
- Feedback: `x-alert`, `x-toast`, `x-spinner`
- Interaction: `x-button`, `x-tabs`, `x-menu`, `x-summary`

Public types are available as `.d.ts` files for the prioritized surfaces. Events, attributes and detail payloads are documented in [Public Component Types](./public-component-types.md).

Required rules:

- New components need source, docs, fixture, component suite, types, a11y profile and performance profile.
- Event names remain stable and are reflected in docs and types.
- State-driven components mirror canonical `xstate` keys.

Further reading: [Component Development](./components.md), [Component Catalog Coverage](./component-catalog-coverage.md), [Visual Browser Regression](./visual-browser-regression.md).

Since `ECH-WP-11`, corporate-design teams have their own guide: [Third-Party Design Authoring](./third-party-design-authoring.md). It belongs to the UI baseline and documents the contract `xtend.enterprise.third-party-authoring-guide.v1`, XTend.css override patterns, XTheme token bridge, CSS parts, icon pack registration, layout modes, a11y dos and donts, P0 token/part references and legacy-token migration.

Local gate:

```bash
node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json
```

Since `ECH-WP-12`, the Enterprise Component flexibility wave is cut as a release handoff: [Enterprise Component Flex Release Handoff](./enterprise-component-flex-release-handoff.md). The contract `xtend.enterprise.component-flex-release-handoff.v1` documents SemVer assessment, deprecated aliases, migration notes, release checklist, adoption risks and the publish boundary `private-until-release-owner-acceptance`.

Local gate:

```bash
node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json
```

## 3. Fabric Baseline

XTend-Fabric is the safety and telemetry layer for UI work:

```js
const fabric = window.XTendFabric.createXtendFabric();
```

Important APIs:

| API | Use |
|-----|-----|
| `createComponentLifecycleBoundary` | contain lifecycle errors from components |
| `runFiber` | execute UI work with lane, kind and diagnostics |
| `createTelemetrySnapshot` | create local runtime snapshots |
| `createBackpressureSignal` | make scheduler and host pressure visible |
| `createReporterAdapter` | prepare enterprise reporters safely |
| `createRuntimeDiagnosticsBridge` | connect Fabric, `xstate`, API and RMT diagnostics |

Reporters are opt-in. Without a registered reporter, no diagnostic leaves the runtime. Enterprise reporters must accept redacted payloads and must not serialize DOM nodes, tokens, cookies or credentials.

Further reading: [XTend-Fabric Runtime](./xtend-fabric.md), [Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md).

## 4. RMT Baseline

XTendRMT is framework-agnostic. RMT does not know XTend as a kernel dependency, but can schedule XTend work through neutral records and adapters.

Native domains:

| Domain | Purpose |
|--------|---------|
| `adapters` | host adapters for XTend, XRouter, Vanilla or custom hosts |
| `components` | component records, props, slots, events and schedule refs |
| `routes` | native route records with XRouter-compatible adapter output |
| `schedules` | visible, idle, diagnostics and user-blocking policies |
| `templates` | structured templating paths without framework embedding |

Enterprise rule: XTend UI and XTendRMT are operated together, but not embedded into each other. XTend-Fabric may consume RMT adapter and bridge signals; the RMT kernel remains host-neutral.

Further reading: [XTendRMT App DSL](./xtendrmt-app-dsl.md), [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md), [Native RMT Authoring](./xtendrmt-native-authoring.md).

## 5. Security Baseline

Enterprise adoption starts with clear trust boundaries:

| Area | Operating Rule |
|------|----------------|
| Loader | only local, same-origin or loopback manifest/module paths |
| Manifest | no URL dependencies, no invalid tags, no external defaults |
| Dynamic Imports | `.js` and `.mjs`, no `javascript:`, `data:`, `blob:` or CDN URLs |
| Trusted DOM | `html_fragment` and Parsedown HTML remain DOM-untrusted |
| Events | no credentials in event details or diagnostics |
| Supply Chain | private package, explicit license and vulnerability policy |

Local gates:

```bash
npm run test:manifest-policy
npm run test:supply-chain
```

Further reading: [Manifest Import Policy](./manifest-import-policy.md), [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md), [Supply-Chain Gates](./supply-chain-gates.md).

## 6. Performance Baseline

XTend follows performance by design. Components receive profiles, budgets, hydration policies and measurement points.

Required points:

- Use `visible`, `idle` and `lazy` hydration deliberately.
- Use `user-blocking` only for real user interaction and a11y-critical work.
- Separate DOM reads and DOM writes.
- Throttle or coalesce high-frequency events.
- Evaluate performance regression locally and triage warnings.

Local gates:

```bash
npm run test:fabric-performance
npm run test:performance
npm run test:hydration-policy
```

Further reading: [Performance for Component Authors](./performance.md), [Performance Measurements](./performance-measurements.md), [Performance Regression](./performance-regression.md), [Hydration Policies](./hydration-policies.md).

Since `WP-E13-06`, the RC1 watchpoint `xtend.component.hydrate` is closed through `xtend.epic13.hydration-performance-closure.v1`. The local baseline is `31ms / 32ms`, reports `warnCount === 0` and remains traceable through [Hydration Performance Closure](./hydration-performance-closure.md).

## 7. A11y Baseline

XTend treats accessibility as a design requirement.

Required points:

- Document focus, keyboard and screen-reader signals for interactive components.
- Model `aria-live`, status regions, error regions and announcements through `xtend.a11y.screenreader-signals.v1`.
- Respect `prefers-reduced-motion` and `forced-colors`.
- Do not use only color as status signal.
- A11y work may be mapped through Fabric lane `a11y` and RMT `user-blocking`.

Local gates:

```bash
npm run test:screenreader-signals
npm run test:motion-contrast
npm run test:a11y
```

Further reading: [A11y Keyboard Smokes](./a11y-keyboard-smokes.md), [Screenreader Signals](./screenreader-signals.md), [Motion and Contrast](./motion-contrast.md).

## 8. CI and Release Readiness

The CI matrix separates fast PR checks from release-near full gates:

| Gate | Command | Purpose |
|------|---------|---------|
| PR Fast | `npm run test:pr:report` | fast feedback for pull requests |
| Full Release | `npm run test:release:full:report` | complete local runner suite with JSON report |
| Nightly | `npm run test:release:full:report` | recurring release-near run |

Release candidates additionally need:

```bash
npm run test:manifest-policy
npm run test:supply-chain
npm run test:docs-rmt-pilot
npm run test:rmt-artifact-parity
npm run release:report
npm run pack:dry-run
```

Conditional network gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

When network gates do not run, the candidate remains a local dry run. For RC1 publish prep, release owner, license decision, changelog, migration notes and gate artifacts are accepted; `npm publish` remains a separate manual step.

Further reading: [Release Checklist and SemVer Policy](../development/XTend-Release-Checklist-und-SemVer-Policy.md), [CI Gate Matrix](../development/XTend-CI-Gate-Matrix.md).

## 9. Epic 10 Release Handoff

Epic 10 has been complete since `WP-E10-16`. The handoff `xtend.epic10.release-handoff.v1` documents:

- TypeScript-first Component Platform
- RMT-first XTend Apps
- Existing Component Metadata Overlays
- Component Lab and RMT Inspector
- browser, a11y, performance and visual gates
- migration notes and next-wave handoff

The canonical Component-Fabric boundary is `adapter-injection-via-xtend-component-resolveFabricContext`.

Local gate:

```bash
npm run test:epic10-release-handoff
```

Further reading: [Epic 10 Release Handoff](./epic10-release-handoff.md), [RMT-first XTend Apps](./rmt-first-xtend-apps.md).

## 10. Epic 11 Enterprise UX Handoff

Epic 11 has been complete in mode `completed-with-accepted-long-tail-handoff` since `WP-E11-18`. The handoff `xtend.epic11.enterprise-ux-handoff.v1` documents:

- Component Shell, styling, runtime a11y, performance and component network
- RMT Shell Authoring for Component UX
- Component Lab UX Inspector
- browser-near UX smokes and Component Shell Theme Matrix
- authoring guides for component and app authors
- historical accepted residuals for `xstate` and `x-utils`; `x-tabs`, `x-theme`, `x-button` and `x-menu` are closed in Epic 12, `xstate` has suite, fixture and types since `WP-E12-08`, `x-utils` has utility contract, import policy, fixture and types since `WP-E12-09`. Since `WP-E13-05`, `xstate` and `x-utils` are closed as boundary contracts.
- next-wave handoff for long-tail runtime, visual snapshot automation and release-owner acceptance

Local gate:

```bash
npm run test:epic11-enterprise-ux-handoff
```

Further reading: [Epic 11 Enterprise UX Handoff](./epic11-enterprise-ux-handoff.md), [Component UX Gates](./component-ux-gates.md).

## 11. Epic 12 RC0 Adoption

Epic 12 carries the long-tail and release-candidate strand to a locally reviewable `RC0`. The official adoption surface is in the [RC0 Adoption Guide](./rc0-adoption-guide.md) and carries the contract `xtend.epic12.docs-adoption.v1`.

The RC0 state includes:

- `x-tabs`, `x-theme`, `x-button` and `x-menu` are closed as visible long-tail components
- `xstate` and `x-utils` remain visible as accepted boundary probes
- DOM-first visual snapshots and design tokens form the local visual baseline
- RMT DSL Authoring Polish makes shells, routes, links, slots, commands, hydration and lanes easier to author
- RC0 Gate Matrix connects PR Fast, Full Release, Snapshot, RMT Authoring, Conditional Network, Package Dry Run and Known Residual Policy

Local gates:

```bash
npm run test:epic12-docs-adoption
npm run test:rc0-gate-matrix
```

RC0 remains blocked by `private-until-release-owner-approval`. `WP-E12-16` built the final owner handoff from it.

Further reading: [RC0 Adoption Guide](./rc0-adoption-guide.md), [RC0 Gate Matrix](./rc0-gate-matrix.md).

## 12. Epic 12 RC0 Handoff

Epic 12 has been complete since `WP-E12-16`. The handoff `xtend.epic12.rc0-handoff.v1` documents:

- KPI acceptance and long-tail status
- DOM-first Visual Snapshot Gate and Design Token Productization
- RMT DSL Authoring Polish
- RC0 Gate Matrix and Docs Adoption
- Known Residual Policy for `xstate`, `x-utils` and `xtend.component.hydrate`
- Conditional Network Gates as owner-review-required
- publish boundary `private-until-release-owner-approval`

Local gate:

```bash
npm run test:epic12-rc0-handoff
```

The status is `ready-for-release-owner-review-not-publish`. The next decision is `release-owner-acceptance`.

Further reading: [Epic 12 RC0 Handoff](./epic12-rc0-handoff.md).

## 13. Epic 13 RC1 Readiness

Epic 13 has been startable since `WP-E13-01`. The contract `xtend.epic13.rc1-production-readiness.v1` describes the transfer from RC0 to RC1:

- existing RC0 gates are carried forward as baseline
- release-owner acceptance is formalized since `WP-E13-02` through `xtend.epic13.release-owner-acceptance.v1`
- conditional network gates are prepared as evidence/deferral since `WP-E13-03` through `xtend.epic13.conditional-network-evidence.v1`
- package dry run and export surface are machine-verifiable since `WP-E13-04` through `xtend.epic13.package-export-lock.v1` and `pack:dry-run:report`
- known residuals are re-evaluated since `WP-E13-05` through `xtend.epic13.known-residual-triage.v1` and [Known Residual Triage](./known-residual-triage.md): `xstate` and `x-utils` are closed
- `xtend.component.hydrate` is owner-free closed since `WP-E13-06` through [Hydration Performance Closure](./hydration-performance-closure.md)
- PROD-near browser/CSP, visual, RMT and Trusted DOM paths are being prepared
- visual owner artifacts are normalized since `WP-E13-08` through `xtend.epic13.visual-owner-artifact.v1`, [Visual Owner Artifacts](./visual-owner-artifacts.md) and `optional-browser-driver-or-ci-artifact`
- RMT-first App Readiness is covered since `WP-E13-09` through `xtend.epic13.rmt-production-readiness.v1`, [RMT Production Readiness](./rmt-production-readiness.md) and the static gate bundle of shell-first app shell, routing, components, Fabric/lanes, lifecycle telemetry, diagnostics and artifact parity
- Docs App RMT Production Hardening is covered since `WP-E13-10` through `xtend.epic13.docs-rmt-production-hardening.v1`, [Docs RMT Production Hardening](./docs-rmt-production-hardening.md), extension slots, Parsedown host boundary, rich HTML/XPlayer schedules and diagnostics
- `automatic-publish-approval` remains `blocked` until a later owner handoff decides

Local gate:

```bash
npm run test:epic13-rc1-readiness
npm run test:epic13-release-owner-acceptance
npm run test:epic13-conditional-network-evidence
npm run test:epic13-hydration-performance-closure
npm run test:epic13-visual-owner-artifact
```

Local network evidence uses `network-restricted-local-default` by default until `npm audit --audit-level=moderate` and `npm sbom --sbom-format=cyclonedx --json` are run in a network/CI environment or accepted as deferred by the owner.

Further reading: [RC1 Readiness](./rc1-readiness.md), [Release Owner Acceptance](./release-owner-acceptance.md), [Conditional Network Evidence](./conditional-network-evidence.md), [Package Export Lock](./package-export-lock.md), [Known Residual Triage](./known-residual-triage.md), [Visual Owner Artifacts](./visual-owner-artifacts.md), [RMT Production Readiness](./rmt-production-readiness.md) and [Docs RMT Production Hardening](./docs-rmt-production-hardening.md).

## Enterprise Adoption Checklist

| Check | Status |
|-------|--------|
| `xtend-loader.js` used instead of `xtend-dev.js` | required |
| local dev server used for development and tests | required |
| no CDN defaults in manifest, demos or fixtures | required |
| prioritized components with types and events used | required |
| Fabric boundary and reporter strategy decided | required |
| RMT adapter for XTend/XRouter or custom host documented | required when using RMT |
| Manifest Import Policy and Trusted DOM Boundary understood | required |
| Performance, hydration and regression gates run | required for release candidates |
| A11y, screen-reader and motion/contrast gates run | required for new UI |
| Supply-chain and release-checklist points decided | required for release candidates |
| RC0 Adoption Guide and RC0 Gate Matrix reviewed | required for RC0 |
| Epic 12 RC0 Handoff reviewed | required for release-owner review |

## Known Maturity Boundaries

After `ER-WP-40`, `WP-E10-16` and `WP-E11-18`, XTend is prepared for enterprise adoption, but it is not yet a final `1.0.0` release:

- `private: false` is active for RC1 publish prep.
- Component Catalog Coverage is at 42/42 source and docs, 42/42 component suites, fixtures and types, 41/42 a11y and 40 explicit runtime/UI performance profiles after `RC1TB-WP-03`. `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-rmt-lifecycle-demo-build`, `x-textarea`, `x-form`, `x-calendar`, `x-writer`, `x-status`, `x-progress`, `x-tooltip`, `x-popover`, `x-drawer`, `x-surface-manager`, `x-surface-window`, `x-side-panel`, `x-modal`, `x-dialog`, `x-alert`, `x-toast`, `x-spinner`, `x-router`, `x-link`, `x-tabs`, `x-theme`, `x-button`, `x-icon`, `x-menu`, `x-footer`, `x-lightbox`, `x-masonry`, `x-code`, `x-header`, `x-hero`, `x-type`, `x-summary`, `x-section`, `x-cards` and `x-player` are `enterprise-ready`; `xstate` is closed as runtime boundary since `WP-E13-05`; `x-utils` is closed as utility boundary since `WP-E13-05`. `x-icon` provides the local, CDN-free iconography adapter with internal Core pack, local Lucide superset and RMT-compatible pack interface; `x-surface-manager`, `x-surface-window` and `x-side-panel` form the first native multi-window and SidePanel surface layer.
- Performance profiles are prioritized and present for all visible runtime/UI components; infrastructure/utility paths are evaluated through boundary contracts.
- Network-based supply-chain gates are conditional gates.
- `WP-E12-15` updates the public adoption surface: long-tail closure, DOM-first Snapshot Gate, Design Token Productization, RMT DSL Authoring Polish, Known Residual Policy and RC0 Gate Matrix are combined in `docs/rc0-adoption-guide.md`.
- The Docs App continues to use Parsedown as parser host; `ER-WP-40` describes and uses the RMT shell-first shell `docs.app.shell`, `docs.header.search`, scheduling, routes, templates, rich-content slots and diagnostics in `docs/xtendrmt-parsedown-docs.rmt`.

## Handoff

`ER-WP-39` is complete: this guide, `docs/menu.json`, `docs/README.md`, `README.md`, `CHANGELOG.md`, `package.json`, the roadmap and the reference gate describe the same enterprise-adoption contract.

`ER-WP-40` is also complete: `xtend.docs.parsedown-rmt-pilot.v1`, `docs.app.shell`, `docs.header.search`, `docs.media.lazy`, `xtend.docsRmtPilot` and `npm run test:docs-rmt-pilot` finalize the shell-first Docs App RMT Parsedown Scheduling Pilot. The next sensible step is a product-maturity checkpoint for release, catalog or XTendRMT upstream decisions.

`WP-E10-16` is complete: `xtend.epic10.release-handoff.v1`, `docs/epic10-release-handoff.md`, `docs/rmt-first-xtend-apps.md`, `catalog/epic10-release-handoff.js` and `npm run test:epic10-release-handoff` finalize Epic 10 without publish approval.

`WP-E11-18` is complete: `xtend.epic11.enterprise-ux-handoff.v1`, `docs/epic11-enterprise-ux-handoff.md`, `catalog/epic11-enterprise-ux-handoff.js` and `npm run test:epic11-enterprise-ux-handoff` finalize Epic 11 with explicit long-tail handoff.

`WP-E12-15` is complete: `xtend.epic12.docs-adoption.v1`, `docs/rc0-adoption-guide.md`, `development/XTend-Epic12-Docs-Migration-und-Adoption-Guide.md`, `catalog/epic12-docs-adoption.js` and `npm run test:epic12-docs-adoption` finalize docs, migration notes and enterprise adoption for the RC0 cut.

`WP-E12-16` is complete: `xtend.epic12.rc0-handoff.v1`, `docs/epic12-rc0-handoff.md`, `development/XTend-Epic12-Abschluss-und-RC0-Handoff.md`, `catalog/epic12-rc0-handoff.js` and `npm run test:epic12-rc0-handoff` finalize Epic 12 as `ready-for-release-owner-review-not-publish`.
