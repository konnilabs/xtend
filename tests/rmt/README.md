# XTendRMT Compatibility Tests

Scope:

- scaffold RMT compatibility binding `xtend.scaffold.rmt-compatibility-binding.v1`
- typing, preview, extension, manifest-plan and component-files alignment
- XTendRMT schema and bestcase-demo scaffold compatibility metadata
- template pilot flow `xtend.rmt.template-pilot-flow.v1`, route `/templating` and template `demo.templating.pilot`
- upstream handoff metadata `xtend.rmt.upstream-handoff.v1` and Epic 05 start gates
- native domains `xtend.rmt.adapters-domain.v1`, `xtend.rmt.components-domain.v1`, `xtend.rmt.routes-domain.v1` and `xtend.rmt.schedules-domain.v1`
- DSL normalization contract `xtend.rmt.dsl-normalization.v1` and reference diagnostics
- runtime registry contract `xtend.rmt.runtime-registry.v1` for route/component indexes and missing-ref diagnostics
- productive XRouter adapter contract `xtend.rmt.xrouter-adapter.v1` for route mapping, registration and navigation sync
- productive XTend component adapter contract `xtend.rmt.xtend-component-adapter.v1` for component mapping, mount and hydration
- Epic 10 XTend component Fabric/Lane ingestion `xtend.component.fabric-lane-ingestion.v2` for `resolveFabricContext`, deterministic lane precedence and adapter result metadata
- Epic 10 XTend component lifecycle telemetry `xtend.component.lifecycle-telemetry.v1` for `result.metadata.telemetry`, `recordComponentTelemetry`, Fabric snapshot aggregation and component backpressure signals
- productive State/Scheduler/Diagnostics bridge contract `xtend.rmt.state-scheduler-diagnostics-bridge.v1` for adapter result mirroring, scheduler endpoints and diagnostics
- artifact parity contract `xtend.rmt.artifact-parity.v1` for schema, manifest, type and bundle drift checks
- vNext bestcase-demo migration `xtend.rmt.native-demo-migration.v1` with `.rmt` authoring, byte-stable Core output and runtime projection onto `adapters`, `components`, `routes` and `schedules`
- WP-15 native bridge fixture `xtend.rmt.wp15.native-bridge-fixture.v1` for route/component/schedule adapter regression
- ESM and browser-near runtime probes for productive adapter factories
- WP-16 browser smoke fixture `xtend.rmt.wp16.browser-smoke-fixture.v1` for XRouter, XTend component hydration, scheduler endpoint signals and vanilla host regression
- Docs-App Parsedown scheduling pilot `xtend.docs.parsedown-rmt-pilot.v1` for additive RMT routes, templates, schedules and host boundaries
- Epic 10 RMT-first XTend app authoring `xtend.rmt.first-class-app-authoring.v1` for complete shell-first app documents with `xtend.component`, `xtend.xrouter`, templates, schedules, Fabric lane metadata and kernel boundaries
- Epic 10 RMT-first Demo-App `xtend.epic10.rmt-first-demo-app.v1` for a host page without manual shell, a full `.rmt` app document, browser smoke coverage and local XTend component execution
- Epic 10 existing component metadata `xtend.epic10.existing-component-metadata.v1` for RMT/Fabric overlays on `x-router`, `x-link`, `x-input`, `x-form`, `x-modal`, `x-dialog`, `x-tabs`, `x-toast` and `x-alert`
- Epic 10 platform gates `xtend.epic10.platform-gates.v1` for browser, A11y, performance, visual regression and CI handoff composition
- Epic 10 release handoff `xtend.epic10.release-handoff.v1` for the final documentation surface, migration notes, RMT-first XTend App guide and publish boundary
- Epic 12 RMT DSL Authoring Polish `xtend.rmt.dsl-authoring-polish.v1` for shell, slot, style, token, a11y, event, command, hydration, Fabric lane, route, link and outlet aliases
- SurfaceManager native RMT `surfaces` domain `xtend.rmt.surfaces-domain.v1` and `xtend.surface.adapter.v1` handoff for WindowManager, SidePanel and overlay surfaces
- RMT kernel security handoff docs `xtend.rmt.kernel-migration-authoring-incident-handoff.v1` for migration, trusted-output authoring and panic/recovery incident evaluation
- local runner, package script and scaffold verify-plan wiring
- runtime boundaries: XRouter, XTend, xstate, diagnostics hubs and scheduler work only through adapters or host bridges, no template parser and no RMT kernel coupling

Current entry point:

```bash
node scripts/run_xtend_tests.js rmt-compatibility
node scripts/run_xtend_tests.js rmt-compatibility --json
npm run test:rmt-compatibility
npm run test:rmt-artifact-parity
npm run test:docs-rmt-pilot
npm run test:rmt-first-class-app
npm run test:rmt-first-demo-app
npm run test:existing-component-metadata
npm run test:epic10-platform-gates
npm run test:epic10-release-handoff
node scripts/run_xtend_tests.js surface-native-rmt --json
npm run test:surface-native-rmt
node scripts/run_xtend_tests.js surface-release-handoff --json
npm run test:surface-release-handoff
node scripts/run_xtend_tests.js rmt-dsl-authoring-polish --json
npm run test:rmt-dsl-authoring-polish
npm run test:rmt-kernel-handoff-docs
npm run test:rmt-component-fabric-ingestion
```

The suite is deterministic. It now validates the productive XRouter adapter contract through a fake XRouter target, the productive XTend component adapter contract through a fake DOM target and the State/Scheduler/Diagnostics bridge through fake `xstate`, scheduler and diagnostics targets while keeping real browser routing/rendering behavior in browser smoke packages. It also runs the RMT format normalizer and runtime registry builder from the local build artifacts against small fixtures, the migrated bestcase demo, a native bridge fixture and the WP-16 browser smoke fixture contract, then executes `scripts/verify_xtendrmt_artifact_parity.js` so Schema, Manifest, Typen, ESM-Bundles and Browser-Bundle cannot drift silently. It verifies that the dry-run contracts produced by `XTend-Scaffold`, the upstream handoff metadata, the native RMT domain contracts, the DSL normalization contract, the runtime registry contract, the XRouter adapter contract, the XTend component adapter contract, the bridge contract, the artifact parity contract, the native demo migration, the WP-15 runtime regression and the WP-16 browser-smoke regression remain aligned enough for Epic 05 to continue the productive bridge without reworking the Epic 04 compatibility model.

The Epic 10 authoring gate is intentionally separate from the broad compatibility gate. It proves that a complete XTend app can be represented as an RMT document before productive Fabric ingestion and Demo-App work starts.

The Epic 10 RMT-first Demo-App gate verifies that `xtendrmt-rmt-first-demo.html` only provides a generic RMT root, while `xtendrmt/rmt-first-demo-app.rmt` owns shell, routes, templates, schedules, Fabric lane metadata and XTend component records. The gate also checks the browser smoke fixture `tests/browser/fixtures/rmt-first-demo-app-smoke.html`.

The Epic 10 existing component metadata gate verifies that prioritized legacy JS components receive RMT/Fabric-compatible Contract v2 overlays without a runtime rewrite or big-bang TypeScript migration.

The Epic 10 platform gate verifies that the Component Contract v2, Existing Metadata, RMT-first Demo-App, Browser Smoke, A11y, Performance and Visual Regression gates are composed into a local Fast PR and Release handoff chain.

The Epic 10 release handoff gate verifies that the canonical guides, `docs/rmt-first-xtend-apps.md`, `docs/epic10-release-handoff.md`, package metadata, scaffold metadata and reference registry mark Epic 10 as completed while keeping publishing blocked until release-owner acceptance.

The Epic 12 RMT DSL Authoring Polish gate verifies `xtend.rmt.dsl-authoring-polish.v1`, the fixture `tests/fixtures/rmt-dsl-authoring-polish.rmt`, package/scaffold metadata and docs. It keeps `route`, `link` and `outlet` as XRouter adapter sugar and preserves `no-rmt-kernel-import-of-xtend-types`.

The SurfaceManager native RMT surfaces gate verifies `xtend.rmt.surfaces-domain.v1`, `xtend.surface.adapter.v1`, the fixture `tests/fixtures/rmt-surface-native-domain.rmt`, schema/type synchronization, RMT normalization, Semantic Graph, completions and linter behavior. It keeps `xtend.surface` as a handoff contract and preserves Component Record compatibility through `metadata.surface`.

The SurfaceManager release handoff gate verifies `xtend.surface.release-handoff.v1`, the fixture `tests/fixtures/rmt-surface-manager-component-lab.rmt`, Authoring Guide, Component Lab docs, Migration Guide, Package/Scaffold metadata and the final `surface-release-handoff` runner entry. It keeps the productive `xtend.surface` adapter runtime deferred.

The SurfaceManager runtime release handoff gate verifies `xtend.surface.runtime-release-handoff.v1`, `xtend.surface.runtime-migration-notes.v1`, `xtend.surface.runtime-release-gate-matrix.v1` and `xtend.surface.runtime-compatibility-notes.v1`. It closes `WP-SM-19` with the productive runtime claim, the full Surface Runtime release gate matrix and explicit open scopes:

```bash
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
npm run test:surface-runtime-release-handoff
```

The Epic 10 component ingestion gate verifies the productive `xtend.component` adapter against both ESM and Browser runtime artifacts. It checks that RMT schedule records win over component metadata, runtime overrides and static contract defaults, that conflicts emit diagnostics and that mount/hydration results carry Fabric lane and Fiber metadata.

The Epic 10 lifecycle telemetry gate verifies that the same adapter emits `xtend.component.lifecycle-telemetry.v1` records for mount, hydration, event and manual render/update/error paths. It also checks that `fabric.createTelemetrySnapshot({ componentTelemetry })` exposes `snapshot.componentTelemetry` and forwards failed or pressured component work into backpressure.
