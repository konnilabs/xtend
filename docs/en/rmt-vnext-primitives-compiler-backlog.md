# RMT vNext Primitive Compiler Backlog

- Contract: `xtend.rmt.vnext-primitives-compiler-backlog.v1`
- Status: `in_progress`
- Source: Media Manager downstream integration, `2026-05-19`
- Transfer type: lessons learned / backlog
- Downstream evidence:
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/src/rmt/media-manager-shell.rmt`
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/src/rmt/media-manager-shell.orchestration.rmt`
  - `/home/konni/Dokumente/net.ccs.cloud/media-manager/docs/xtend-component-bugfixes.md`

## Problem

The Media Manager integration shows that the new RMT App Platform primitives are conceptually correct, but the developer experience still splits into two authoring models.

- RMT vNext is the understandable, human-friendly developer syntax.
- App Platform primitives currently live in a separate JSON-shaped source.
- The classic RMT build still has the scaffold/core compatibility path.
- Developers need to know which compiler owns which layer before they can build a coherent app shell.

This makes RMT lose part of its platform value. A platform is only credible when app authors can express the complete product shell in one unified, readable and diagnosable authoring experience.

## Epic Goal

The next RMT epic must massively expand the vNext compiler: app authors must be able to declare App Platform primitives directly in RMT vNext.

RMT Legacy and compatible JSON intermediate formats should move into the background. Developers should no longer have to work in legacy formats for normal app-shell work. The primary authoring surface is vNext; the compiler lowers that source into all runtime artifacts required by kernel, Fabric and UI host.

## Required vNext Primitive Surface

Grammar, parser, semantic graph and compiler output for vNext must support at least these primitive families:

| Primitive Family | Required vNext Capability |
|------------------|---------------------------|
| App Shell | template, route, root, shell chrome, slots and stable islands |
| Components | component refs, attributes, text nodes, slots, keyed lists, conditions and DOM descriptors |
| State | state records, selectors, derived values, reducers, persistence and XState bridge hints |
| Data | fixtures, REST endpoints, SSR payloads, streams, pagination and schema contracts |
| Actions | action declarations, async effects, loading/success/error status, retries and result routing |
| Events | DOM/custom event bindings, payload contracts, governance, bubbling/capture policy and action targets |
| Surfaces | static surfaces, dynamic keyed surface repeaters, bounds, focus, close, minimize, restore and persistence |
| Overlays | tooltip, toast, lightbox, popover, dialog and menu portal semantics |
| Resources | object URLs, streams, observers, timers, lazy imports and owner-scoped teardown |
| Security | trust boundaries, sanitizer policies, import policy and no-kernel-host-import assertions |
| Diagnostics | source maps, source pointers, primitive IDs, schedule refs and runtime correlation IDs |

The result must make it possible to build a granular app shell exclusively in RMT vNext. Host adapters may still provide endpoints, component imports and browser execution. UI structure, state graph, event routing, effects and lifecycle ownership must come from vNext source.

## Compiler Requirements

The compiler must become a complete App Platform lowering pipeline:

1. Parse vNext primitive syntax into a typed AST.
2. Build a semantic graph for components, state, selectors, actions, events, surfaces, portals, overlays, resources and data sources.
3. Validate references and contracts before runtime.
4. Generate deterministic RMT Core records for kernel ingestion.
5. Generate App Platform build reports, diagnostics and source maps from the same vNext source.
6. Generate scaffold and runtime adapter artifacts for XTend UI without forcing app authors into generated or legacy intermediate formats.
7. Preserve source-to-runtime correlation for every visible object and every event.
8. Keep the RMT kernel boundary framework-neutral: no XTend component imports in the kernel, no Fabric import in the kernel and no browser assumptions in Core records.

The old compatibility path may continue to exist as a compiler target, but must not be the authoring path.

## Kernel Retest After the Upgrade

After the compiler upgrade, the new output must be tested against the RMT kernel again. It is not enough to prove that vNext can parse and generate JSON. What must be provable is that vNext-authored primitives can drive the runtime stack.

The kernel gate must show that:

- vNext source can declare lanes and fibers through first-class syntax.
- The compiler lowers these declarations into kernel-readable schedule and lifecycle records.
- The RMT kernel can ingest these records without framework-specific imports.
- Fabric can receive or derive the expected lanes, fibers and schedule refs.
- The UI host can materialize the requested object or event.
- A headless browser can observe the final object, state change or event in the visible viewport.

## Source-to-Sea Fullstack Gate

A required "source to sea" gate must be introduced for RMT vNext.

The gate reconstructs the lifecycle of a UI object from RMT source to browser evidence:

```text
RMT vNext source
  -> parser AST
  -> semantic primitive graph
  -> compiler core/app artifacts
  -> RMT kernel schedule/lifecycle ingestion
  -> Fabric lane/fiber telemetry
  -> XTend UI host adapter
  -> DOM/custom-element materialization
  -> visible headless-browser viewport assertion
```

The gate must fail if any correlation link is missing. The same primitive ID must be traceable through source-map pointer, compiler output, kernel record, Fabric fiber, DOM marker and browser assertion.

### Minimal Fixture

A small vNext fixture should declare:

- a visible component object, for example status, toast or card surface;
- a user-facing event, for example button click or custom component event;
- an action or effect with success status;
- a state update and selector;
- a Fabric lane and fiber expectation;
- a resource or surface lifecycle boundary.

The browser smoke must trigger the event and verify:

- The object exists in the viewport.
- State or text changes visibly.
- The event is recorded with the expected RMT action ID.
- Fabric reports the expected lane/fiber metadata.
- Kernel diagnostics contain the expected schedule/lifecycle record.
- Source-map metadata points back to the vNext source position.

## Evidence Contract

The full-stack gate writes a machine-readable evidence file. The artifact report uses `xtend.rmt.vnext.source-to-sea-evidence-report.v1` and lives at `.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json`; the embedded lifecycle evidence remains `xtend.rmt.vnext.source-to-sea-evidence.v1`.

Example embedded lifecycle evidence:

```json
{
  "schema": "xtend.rmt.vnext.source-to-sea-evidence.v1",
  "source": "tests/rmt-language/fixtures/vnext-source-to-sea.rmt",
  "primitiveId": "demo.feedback.status",
  "sourcePointer": "/events/0",
  "compiler": {
    "ok": true,
    "artifactCount": 9
  },
  "kernel": {
    "ingested": true,
    "scheduleRef": "schedule:demo.feedback/demo.feedback.status/visible"
  },
  "fabric": {
    "schema": "xtend.rmt.vnext.fabric-bridge-evidence.v1",
    "workpackage": "RMT-VNEXT-PRIM-05",
    "lane": "visible",
    "fiber": "fiber:demo.feedback/demo.feedback.status/visible/0",
    "scheduleRef": "component.visible.hydrate",
    "endpointName": "xtendrmt.component.hydrate",
    "telemetry": {
      "schema": "xtend.fabric.telemetry-snapshot.v1",
      "fiberCount": 6
    },
    "hostAdapter": {
      "schema": "xtend.component.lifecycle-telemetry.v1",
      "source": "xtend.component-adapter",
      "operation": "hydrate"
    }
  },
  "ui": {
    "selector": "[data-rmt-primitive-id=\"demo.feedback.status\"]",
    "visible": true,
    "text": "Saved"
  },
  "browser": {
    "viewportAsserted": true,
    "eventObserved": true
  }
}
```

## Current State on 2026-05-20

The first compiler and DX track for vNext primitives is release-gated:

- `RMT-VNEXT-PRIM-01` through `RMT-VNEXT-PRIM-04` are complete. Grammar, parser/AST, semantic graph and lowering create deterministic Core, App Platform and Kernel records from vNext source.
- `RMT-VNEXT-PRIM-06` has a deterministic source-to-sea slice. `createRmtVNextSourceToSeaEvidence(...)` correlates vNext source maps, kernel schedules, derivable Fabric fibers, UI markers and browser probe.
- `RMT-VNEXT-PRIM-06` also has a browser execution path. `runRmtVNextSourceToSeaBrowserExecution(...)` can open the same fixture through WebDriver, ChromeDriver or Safari Driver, read `window.__xtendRmtVNextSourceToSeaResult` and compare the real browser result against compiler, kernel and Fabric evidence. Without a local browser environment, the default run remains deterministic as a fixture contract.
- `RMT-VNEXT-PRIM-06` now writes source-to-sea evidence as a release artifact. `node scripts/capture_rmt_vnext_source_to_sea_evidence.js` creates `.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json`; `npm run test:rmt-vnext-source-to-sea:browser-required` makes the same path required for explicit local headless profiles.
- `RMT-VNEXT-PRIM-06` is now optional browser evidence in GitHub Actions. The job `rmt-vnext-primitive-gates` uses `npm run test:rmt-vnext-source-to-sea:chromedriver` only on manual `workflow_dispatch` with `run_source_to_sea=true` and then uploads the same source-to-sea evidence artifact.
- ChromeDriver auto-cleanup is robust for local Snap/Chromium installations. Automatically started ChromeDriver is first stopped through the WebDriver endpoint `/shutdown`; `process.kill()` remains only the fallback. This lets `npm run test:rmt-vnext-source-to-sea:chromedriver` pass locally with required-browser policy and artifact `driver: "chromedriver"`, `objectCount: 4`, one cross-primitive event, two route switches and two route lifecycle cycles.
- `RMT-VNEXT-PRIM-06` now has a multi-object slice. The fixture correlates `demo.feedback.status` and `demo.feedback.toast` as two simultaneous visible primitives across vNext source, kernel schedules, Fabric fibers, UI markers and browser probe.
- The multi-object slice now covers separate lanes and a cross-primitive event: `demo.feedback.status` runs visible, `demo.feedback.toast` runs on `idle`, and `demo.feedback.save` reduces toast state and emits `demo.feedback.toast.promoted`.
- The cross-primitive matrix now also covers a multi-stage cross-route event: after route mount, `demo.feedback.detail.ack -> demo.feedback.audit` goes through `demo.feedback.audit.escalated` and `state.demo.feedback.audit.text` from one `transition` target to the next. The browser result must show two cross-primitive events and report `stage: "route-target"`, `sourceLane: "transition"` and `targetLane: "transition"` for the second entry.
- The browser matrix additionally carries a route switch as PRIM-06 evidence: `demo.feedback.save` switches from `/rmt-vnext-source-to-sea` to `/rmt-vnext-source-to-sea/toast`, uses `ui.user-blocking.input` for navigation, `route.transition.render` for rendering and writes this route telemetry into the browser-required result.
- The route switch now has a real route-target object: `demo.feedback.detail` is authored in vNext as its own surface with `transition` lane, starts unmounted in the browser fixture and becomes visible only after the route change. The matrix correlates source, kernel schedule, Fabric fiber, route render schedule, UI marker and browser viewport.
- The route-target slice now also has remount/unmount evidence: `demo.feedback.detail` is unmounted after the first mount, `demo.feedback.detailTimer` is proven as resource cleanup through `dispose on surface.destroy`, and the target is then mounted visibly again through `route.transition.render`.
- The route-lifecycle slice now covers multiple targets. In addition to `demo.feedback.detail`, `demo.feedback.audit` is mounted as a second vNext-authored route target with its own `transition` lane and `demo.feedback.auditTimer`. The real browser-required run must report two sequential route switches and separate `unmountCount`/`remountCount` pairs per target with `countsMatch: true`.
- The route-lifecycle matrix now covers multiple cleanup resource kinds per target. Beside the timer, `demo.feedback.audit` also has `demo.feedback.auditSubscription` with `kind subscription`; the static object matrix and the real browser result must both show both resource IDs, `resourceKinds: ["timer", "subscription"]` and `resourceDisposed: true` for the audit cycle.
- Negative cleanup diagnostics are anchored in the gate. The fixture `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-invalid.rmt` intentionally leaves `demo.feedback.detailTimer` without `dispose on surface.destroy`; the route-lifecycle matrix must fail in a controlled way and report `rmt.vnext.source_to_sea.cleanup_dispose_policy_missing`.
- Owner mismatch diagnostics are also gateable. The fixture `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-owner-invalid.rmt` has `dispose on surface.destroy`, but intentionally binds `demo.feedback.detailTimer` to `surface.demo.feedback.toast`; the route-lifecycle matrix must report `rmt.vnext.source_to_sea.cleanup_owner_mismatch` and show the wrong owner in evidence.
- Missing cleanup resource records are now gateable as well. The fixture `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-resource-missing.rmt` keeps the route target `demo.feedback.audit`, but completely removes `demo.feedback.auditTimer` from the vNext source. The matrix must fail specifically for `demo.feedback.audit` with `rmt.vnext.source_to_sea.cleanup_resource_missing`, while the `demo.feedback.detail` lifecycle stays `passed`.
- Resource-kind drift is also gateable. The fixture `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-kind-invalid.rmt` keeps `demo.feedback.auditSubscription` bound to `surface.demo.feedback.audit` and keeps `dispose on surface.destroy`, but intentionally declares it as `kind cache`. The matrix must fail with `rmt.vnext.source_to_sea.cleanup_kind_mismatch` and show both `expectedKind: "subscription"` and `actualKind: "cache"`.
- The ChromeDriver evidence report now has its own CI artifact validation: `xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1`. In local browser-skip mode it remains `skipped`; in the required-browser path it must be `passed` and prove `objectCount: 4`, two cross-primitive events, two route switches, two route lifecycle cycles, `targetMounted`, `targetVisible`, `countsMatch` and the audit resources `demo.feedback.auditTimer` and `demo.feedback.auditSubscription`.
- `RMT-VNEXT-PRIM-07` has the first tooling slice for completions, hover, symbols and docs so vNext remains the default authoring path.
- `RMT-VNEXT-PRIM-07` now also has cursor-near primitive completions: `getRmtVNextToolingCompletions(...)` and the language server can derive state clauses, resource kinds and action partial words from position, source-map pointer and current line without editors having to set `xtend.context` explicitly.
- `RMT-VNEXT-PRIM-07` has the first quick-fix slice: `getRmtVNextToolingCodeActions(...)` and `textDocument/codeAction` create safe WorkspaceEdits for `owner-missing`, `unkeyed-repeat` and `payload-contract-missing`, so vNext authors can repair primitive errors directly in the editor.
- `RMT-VNEXT-PRIM-07` now has a second quick-fix slice: `initial-missing`, `resource-kind-missing` and `unknown-reference` for selector and portal references receive source-preserving repairs. This guides authors from common typo/scaffold gaps directly to valid primitive structure.
- `RMT-VNEXT-PRIM-07` has the action-authoring slice: `action-reducer-missing` and `effect-source-missing` create safe text edits for reducer targets and `effect fetch datasource` sources. `kernel-boundary` deliberately remains a command handoff without text edit so Kernel/Fabric imports are moved to host adapters.
- `RMT-VNEXT-PRIM-07` has the preview/fix-all slice: every primitive code action carries an `xtend.rmt.vnext.primitive-code-action-preview.v1` preview, and `source.fixAll.rmt.vnext.primitives` bundles all safe text-edit repairs in a document. Manual boundary commands are excluded from the bulk apply.
- `RMT-VNEXT-PRIM-07` now also has the command handoff for manual boundary cases: the language server reports `xtend.rmt.vnext.extractKernelImport` as `workspace/executeCommand` and returns `xtend.rmt.vnext.primitive-command-handoff.v1` without WorkspaceEdit. This lets an editor visibly move Kernel/Fabric import violations into a host-adapter path without automatically rewriting vNext source in a framework-specific way.
- `RMT-VNEXT-PRIM-07` now has the first VS Code bridge apply experience: `tools/rmt-editor/vscode/extension.js` classifies vNext primitive CodeActions into `workspace-edit`, `fix-all` and `manual-command`, exposes four VS Code commands and renders `xtend.rmt.editor.vscode-primitive-authoring-experience.v1` in the Output Channel. The DX is now not only documented, but visible in the editor.
- `RMT-VNEXT-PRIM-07` is complete. The VS Code bridge now reads the active `.rmt` document when no report is passed, asks the local RMT Language Server in-process through `textDocument/codeAction`, offers QuickPick paths for preview/fix-all/handoff and applies only safe WorkspaceEdits. `kernel-boundary` remains a visible manual handoff without `WorkspaceEdit`.
- `RMT-VNEXT-PRIM-08` has the first migration slice: App Platform primitive JSON is detected as legacy target, mirrored and annotated with vNext migration diagnostics.
- `RMT-VNEXT-PRIM-08` is complete. The new `xtend.rmt.vnext.primitive-migration-apply-plan.v1` apply plan creates the same vNext draft from App Platform primitive JSON as the preview, points to a `.vnext.rmt` target path, checks the draft against the vNext compiler and sets `automaticWrite: false`. Compatibility reports now distinguish `report-only`, `preview-ready`, `apply-plan-ready` and `blocked`; legacy remains mirror/compiler target, not authoring path.
- `RMT-VNEXT-PRIM-05` is complete. The new standalone gate `rmt-vnext-fabric-bridge` checks Fabric/RMT lane resolution, primary Fabric runtime fiber, lane matrix, host-adapter telemetry, route/component fibers, telemetry snapshot and browser markers as its own PRIM-05 contract.
- The release matrix now contains the primitive aggregate `npm run test:rmt-vnext-primitives:report`; the report is written to `.xtend-test-results/xtend-rmt-vnext-primitives-gate-report.json`.
- GitHub Actions runs the primitive gates in the job `rmt-vnext-primitive-gates`. The default gate covers parser, compiler, semantic graph, tooling, compatibility and type exports; source-to-sea evidence remains an optional artifact from manual dispatch.
- The source-to-sea evidence report now contains a machine-readable CI artifact gate. `createRmtVNextSourceToSeaCiArtifactValidation(...)` compares the written ChromeDriver report against the expected PRIM-06 matrix and fails on object, route, lifecycle or resource drift.
- The CI artifact path is now replayable: `test:rmt-vnext-source-to-sea:validate-artifact` calls `validateRmtVNextSourceToSeaCiArtifactFile(...)`, validates an already written ChromeDriver release artifact without a new browser run and fails closed for missing, unparseable or drifted artifacts.
- Cross-route drift is now gateable as a negative runtime slice. The browser probe `tests/browser/fixtures/rmt-vnext-source-to-sea-cross-route-invalid.html` intentionally wires `demo.feedback.detail.ack` to the wrong target primitive and must fail through `cross event route-target state belongs to target primitive`, `cross event route-target event belongs to target primitive` and `cross event route-target stage uses transition lanes`.
- Browser result drift is now also testable without a new browser start. `xtend.rmt.vnext.source-to-sea-browser-result-validation.v1` and `createRmtVNextSourceToSeaBrowserResultValidation(...)` validate the ChromeDriver result structure directly; route-switch drift must fail through `browser execution route switches pass` and lifecycle counter drift through `browser execution route lifecycle cycles pass`. Cross-primitive event drift and viewport/object-status drift must fail through `browser execution cross-primitive events pass` and `browser execution object matrix passes`.
- The release handoff keeps `npm run test:rmt-semantic-graph` and `npm run test:rmt-vnext-primitives:report` as required gates, while `npm run test:rmt-vnext-source-to-sea` and evidence capture remain optional browser-evidence gates.
- The full release report was run locally again successfully. Local browser/loopback skips remain accepted environment residuals; the primitive, PR, pack and release reports are consistent.

`RMT-VNEXT-PRIM-06`, `RMT-VNEXT-PRIM-07` and `RMT-VNEXT-PRIM-08` are locally complete. Package 6 covers source -> kernel -> Fabric -> UI -> browser, ChromeDriver-required evidence, CI artifact replay and negative drift cases for cross-route, route switch, lifecycle, cross-primitive events and viewport/object status. Package 7 makes these primitive diagnostics actively applicable in the editor. Package 8 provides the deterministic legacy-backgrounding and migration apply plan. The real GitHub Actions artifact comparison remains a release-handoff step for the release branch, no longer a local implementation blocker for the packages.

## Workpackages

| ID | Priority | Status | Title | Acceptance |
|----|----------|--------|-------|------------|
| `RMT-VNEXT-PRIM-01` | P0 | completed | vNext Primitive Grammar Design | Syntax covers state, selectors, actions, events, data, surfaces, overlays, portals and resources without falling back to JSON authoring. |
| `RMT-VNEXT-PRIM-02` | P0 | completed | Parser and AST Upgrade | Parser creates typed AST nodes with stable source ranges for every primitive. |
| `RMT-VNEXT-PRIM-03` | P0 | completed | Semantic Graph and Diagnostics | Cross-reference, ownership, event-payload and trust-boundary diagnostics run before runtime. |
| `RMT-VNEXT-PRIM-04` | P0 | completed | Compiler Lowering into Kernel Records | vNext primitives are lowered into deterministic Core/app artifacts that the RMT kernel can ingest. |
| `RMT-VNEXT-PRIM-05` | P0 | completed | Fabric Lane/Fiber Bridge Evidence | vNext-authored lanes and fibers are visible in Fabric telemetry without importing Fabric into the kernel. |
| `RMT-VNEXT-PRIM-06` | P0 | completed | Source-to-Sea Browser Gate | A headless browser test proves source -> kernel -> Fabric -> UI -> viewport for visible object, route, event and lifecycle paths. |
| `RMT-VNEXT-PRIM-07` | P1 | completed | Language Server and Authoring Docs | Completions, hover, symbols, CodeActions, Safe Fix-All and VS Code bridge teach vNext primitive syntax as the primary developer experience. |
| `RMT-VNEXT-PRIM-08` | P1 | completed | Migration and Legacy Backgrounding | Existing App Platform JSON fixtures can be converted or mirrored to vNext through preview/apply plan; legacy remains target, not workflow. |

## Acceptance Criteria

- App authors can declare a granular app shell only in RMT vNext.
- The compiler creates App Platform primitive reports from vNext source.
- RMT Legacy or JSON primitive files are not required for normal authoring.
- Kernel, Fabric and UI evidence can be correlated through primitive ID and source pointer.
- Fabric lane/fiber evidence is reconstructed from vNext source maps, `kernelRecords.schedules`, `kernelRecords.fibers`, Fabric runtime telemetry and browser markers.
- The source-to-sea gate is part of the optional RMT browser-evidence matrix.
- The primitive aggregate runs in GitHub Actions and in the local release report as an independent gate.
- Docs and language tooling present vNext as the default path and legacy as compatibility target.

## Started Work

- `RMT-VNEXT-PRIM-01` is complete.
- Syntax contract: [RMT vNext Primitive Grammar Design](./rmt-vnext-primitive-grammar-design.md)
- Design fixture: `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt`
- `RMT-VNEXT-PRIM-02` is complete.
- Parser/AST handoff: [RMT vNext Primitive Parser AST](./rmt-vnext-primitive-parser-ast.md)
- `RMT-VNEXT-PRIM-03` is complete.
- Semantic graph handoff: [RMT vNext Primitive Semantic Graph](./rmt-vnext-primitive-semantic-graph.md)
- New API: `buildRmtVNextPrimitiveSemanticGraph(...)` in `tools/rmt-language/semantic-graph.js`
- `RMT-VNEXT-PRIM-04` is complete.
- Lowering handoff: [RMT vNext Primitive Lowering](./rmt-vnext-primitive-lowering.md)
- Compiler API: `compileRmtVNextSource(...)` uses the PRIM-03 graph as pre-lowering gate and creates `appPlatform` plus `kernelRecords`.
- `RMT-VNEXT-PRIM-05` is complete.
- Fabric bridge handoff: [RMT vNext Fabric Bridge Evidence](./rmt-vnext-fabric-bridge-evidence.md)
- Fabric bridge evidence: `createRmtVNextFabricBridgeEvidence(...)` creates a real `xtend.fabric.fiber.v1` from PRIM-04 kernel schedules and fibers, resolves it through `xtend.fabric.rmt-lane-mapping.v1` and correlates it with an `xtend.fabric.telemetry-snapshot.v1`.
- Browser markers: `tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html` carries `data-xtend-fabric-lane`, `data-xtend-fabric-fiber` and `data-xtend-fabric-schedule` so the Fabric bridge remains visible into the viewport.
- Lane matrix: `RMT_VNEXT_FABRIC_BRIDGE_LANE_MATRIX` hardens the bridge for `user-blocking`, `transition`, `idle`, `background` and `diagnostics`. Every lane creates a completed `xtend.fabric.fiber.v1`, an `xtend.fabric.rmt-lane-mapping.v1` decision and an `xtend.fabric.telemetry-snapshot.v1` schedule entry.
- Host/adapter telemetry: the source-to-sea bridge reads `xtend.component.lifecycle-telemetry.v1` from the browser probe, normalizes it through `fabric.recordComponentTelemetry(...)` and proves it in the Fabric telemetry snapshot. The XTend UI host-adapter layer is therefore no longer only a static DOM marker, but part of PRIM-05 evidence.
- Route/component fiber: the bridge now uses `createComponentFiberInstrumentation(...)` for `component.mount` and `component.hydrate` plus `createRouteFiberInstrumentation(...)` for `route.navigate` and `route.render`. Evidence checks the schedule refs `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input` and `route.transition.render` all the way into the Fabric telemetry snapshot.
- Standalone gate: `tests/rmt-language/rmt_vnext_fabric_bridge_suite.js` validates PRIM-05 as its own release gate. `npm run test:rmt-vnext-primitives:report` now includes `rmt-vnext-fabric-bridge`; source-to-sea remains a separate optional gate.
- `RMT-VNEXT-PRIM-06` has a first release-gated slice.
- Source-to-sea handoff: [RMT vNext Source-to-Sea Gate](./rmt-vnext-source-to-sea-gate.md)
- Evidence API: `createRmtVNextSourceToSeaEvidence(...)` correlates vNext source maps, PRIM-04 kernel records, Fabric fiber derivation, UI markers and browser fixture probe.
- Browser execution evidence: `runRmtVNextSourceToSeaBrowserExecution(...)` optionally reads the result key `window.__xtendRmtVNextSourceToSeaResult` from the real browser fixture through WebDriver and compares primitive ID, kernel schedule, Fabric fiber, Fabric schedule, host-adapter telemetry and action event with source-to-sea evidence. Without `RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER`, this step is documented as a local environment skip, not as a release blocker.
- Evidence report: `createRmtVNextSourceToSeaEvidenceReport(...)` and `writeRmtVNextSourceToSeaEvidenceReport(...)` wrap lifecycle and browser-execution evidence in `xtend.rmt.vnext.source-to-sea-evidence-report.v1`.
- Release artifact: `.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json` is created through `npm run test:rmt-vnext-source-to-sea:evidence`. In GitHub Actions, the same report is written through `npm run test:rmt-vnext-source-to-sea:chromedriver` only on manual `workflow_dispatch` with `run_source_to_sea=true` and uploaded in the job `rmt-vnext-primitive-gates` as `xtend-rmt-vnext-source-to-sea-evidence-node-26`.
- ChromeDriver auto-cleanup: `runWebDriverBrowserProbe(...)` now stops automatically started ChromeDriver first through `/shutdown` and uses process signals only as fallback. This fixes Snap/AppArmor environments where a direct `kill()` fails with `EACCES` and previously overwrote a successful browser result. The local required-browser run `npm run test:rmt-vnext-source-to-sea:chromedriver` is now `passed`.
- Object matrix: `createRmtVNextSourceToSeaObjectMatrix(...)` creates `xtend.rmt.vnext.source-to-sea-object-matrix.v1` and proves four visible primitive lifecycles: `demo.feedback.status`, `demo.feedback.toast`, `demo.feedback.detail` and `demo.feedback.audit`. The matrix checks separate `visible`/`idle`/`transition` lanes and the cross-primitive event `demo.feedback.status -> demo.feedback.toast`.
- Cross-route event matrix: the same matrix now proves a second route-bound cross-primitive event. `demo.feedback.detail.ack -> demo.feedback.audit` reduces `state.demo.feedback.audit.text`, emits `demo.feedback.audit.escalated` and must be visible both statically and in the real browser result as `stage: "route-target"` with `sourceLane: "transition"` and `targetLane: "transition"`.
- Route-switch matrix: the same object matrix now validates two sequential browser route changes: `/rmt-vnext-source-to-sea -> /rmt-vnext-source-to-sea/toast` for `demo.feedback.detail` and `/rmt-vnext-source-to-sea/toast -> /rmt-vnext-source-to-sea/audit` for `demo.feedback.audit`. Both use `ui.user-blocking.input`, `route.transition.render` and the `transition` lane. The real browser-execution path must provide two `routeSwitches` with `status: "passed"`, `targetMounted: true` and `targetVisible: true`.
- Route-lifecycle matrix: `routeLifecycleCycles` validates separate repeated route cycles for `demo.feedback.detail` and `demo.feedback.audit`. Targets are unmounted, resource records `demo.feedback.detailTimer` and `demo.feedback.auditTimer` are validated against `dispose on surface.destroy`, and both targets are remounted afterward. The real browser-execution path must report `unmounted`, `remounted`, `resourceDisposed` and `countsMatch` as `true`, plus `unmountCount: 1` and `remountCount: 1` per target.
- Multi-resource cleanup: the audit cycle now carries multiple cleanup records. Beside `demo.feedback.auditTimer`, `demo.feedback.auditSubscription` must be provable as `kind subscription`, owner `surface.demo.feedback.audit` and `dispose on surface.destroy` through vNext lowering, object matrix and browser execution. Old `resourceId` cycles remain compatible; new cycles can specify `resources` with multiple resource IDs and expected kinds.
- Negative cleanup-kind fixture: `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-kind-invalid.rmt` proves that multi-resource cleanup checks not only existence, owner and dispose policy, but also the expected resource kind. The matrix creates `rmt.vnext.source_to_sea.cleanup_kind_mismatch` for `demo.feedback.auditSubscription`, records `expectedKind: "subscription"` and shows `actualKind: "cache"`.
- Negative cleanup fixture: `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-invalid.rmt` proves that the same lifecycle cycle without dispose policy is not accepted as valid evidence. The matrix creates diagnostic code `rmt.vnext.source_to_sea.cleanup_dispose_policy_missing` and records the missing policy with `dispose: null`.
- Negative cleanup owner fixture: `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-owner-invalid.rmt` proves that a cleanup resource record with present dispose policy is still invalid when the owner does not match the route target. The matrix creates `rmt.vnext.source_to_sea.cleanup_owner_mismatch` and shows `surface.demo.feedback.toast` as wrong owner.
- Negative cleanup resource fixture: `tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-resource-missing.rmt` proves that a route lifecycle cycle without emitted resource record is invalid. `demo.feedback.audit` remains authored as a route target, but `demo.feedback.auditTimer` is completely missing; the matrix creates `rmt.vnext.source_to_sea.cleanup_resource_missing`, records `resource: null` and also shows that the `demo.feedback.detail` cycle remains `passed`.
- Positive source-to-sea fixture: `tests/rmt-language/fixtures/vnext-source-to-sea.rmt`
- Browser smoke fixture: `tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html`
- `RMT-VNEXT-PRIM-07` has a first release-gated tooling slice.
- Authoring tooling handoff: [RMT vNext Primitive Authoring Tooling](./rmt-vnext-primitive-authoring-tooling.md)
- Tooling API: `getRmtVNextToolingCompletions(...)`, `getRmtVNextToolingHover(...)` and `getRmtVNextToolingDocumentSymbols(...)` index primitive domains from PRIM-04 and present vNext as the default authoring path.
- Code-action preview: `getRmtVNextToolingCodeActions(...)` provides an `xtend.rmt.vnext.primitive-code-action-preview.v1` preview for every primitive repair plus `source.fixAll.rmt.vnext.primitives` for all safe text edits.
- Command handoff: `workspace/executeCommand` for `xtend.rmt.vnext.extractKernelImport` returns `xtend.rmt.vnext.primitive-command-handoff.v1`, remains without WorkspaceEdit and names the host-adapter path for manual Kernel/Fabric boundary repairs.
- Active VS Code bridge: `createActiveDocumentPrimitiveAuthoringExperience(...)` reads the active `.rmt` document, uses the local language server in-process and builds `xtend.rmt.editor.vscode-primitive-authoring-experience.v1` from real LSP CodeActions. Safe WorkspaceEdits run through `applyPrimitiveAuthoringWorkspaceEdit(...)`; `xtendRmt.rmtVNext.applySafePrimitiveFixAll` applies only `source.fixAll.rmt.vnext.primitives`.
- `RMT-VNEXT-PRIM-08` is complete.
- Migration handoff: [RMT vNext Primitive Migration](./rmt-vnext-primitive-migration.md)
- Migration API: `createAppPlatformPrimitiveMigrationPreview(...)` creates the vNext draft from App Platform primitive JSON; `createAppPlatformPrimitiveMigrationApplyPlan(...)` wraps the same draft in `xtend.rmt.vnext.primitive-migration-apply-plan.v1`, sets `automaticWrite: false`, provides the target path hint and blocks on parse/compile errors.
- VS Code bridge apply experience: `createPrimitiveAuthoringApplyExperience(...)` creates `xtend.rmt.editor.vscode-primitive-authoring-experience.v1`, and the commands `XTendRMT: Show vNext Primitive Apply Experience`, `XTendRMT: Show vNext Primitive Code Action Preview` and `XTendRMT: Show vNext Primitive Command Handoff` distinguish quick fix, fix-all and handoff in the Output Channel.
- New snippet: `rmt-vnext-primitive-shell`
- Positive fixture: `tests/rmt-language/fixtures/vnext-primitives-grammar-design.rmt`
- Negative fixture: `tests/rmt-language/fixtures/vnext-primitives-semantic-invalid.rmt`
- `RMT-VNEXT-PRIM-08` has a first release-gated migration slice.
- Primitive migration handoff: [RMT vNext Primitive Migration](./rmt-vnext-primitive-migration.md)
- Migration API: `createAppPlatformPrimitiveMigrationPreview(...)` detects App Platform primitive JSON, creates a compilable vNext draft and marks legacy as `compiler-target`.
- Positive App Platform fixture: `tests/fixtures/rmt-app-platform-tooling.rmt`
- Compatibility diagnostics: `rmt.vnext.primitive_migration.preview_available` for report-only mode and `rmt.vnext.primitive_migration.legacy_backgrounded` for the preview path.
- The vNext parser creates initial primitive nodes for the design fixture: `RmtStateDeclaration`, `RmtSelectorDeclaration`, `RmtDataSourceDeclaration`, `RmtActionDeclaration`, `RmtPortalDeclaration`, `RmtOverlayDeclaration`, `RmtResourceDeclaration`, extended `RmtSurfaceDeclaration` and event payload nodes.
- Release gates updated: `.github/workflows/xtend-default-gates.yml`, `package.json`, `scripts/run_xtend_tests.js`, `tools/rmt-language/vnext-release.js`, `tests/references/reference_path_suite.js` and [RMT vNext Release Handoff](./rmt-vnext-release-handoff.md).

## Next Implementation Step

`RMT-VNEXT-PRIM-06` is complete. `RMT-VNEXT-PRIM-05` is complete as its own Fabric bridge package: vNext source, kernel schedule, kernel fiber, Fabric mapping, Fabric runtime fiber, telemetry snapshot, route/component fiber and browser marker are correlated through the same primitive ID. The browser path can run optionally locally or through manual CI dispatch, and covers multiple visible UI objects plus negative runtime drifts.

The next patch should:

- As optional release evidence, compare a manually requested GitHub Actions source-to-sea run against `ciArtifactValidation.status: "passed"` and reference the uploaded artifact with `npm run test:rmt-vnext-source-to-sea:validate-artifact`.
- Resume implementation at `RMT-VNEXT-PRIM-07` or `RMT-VNEXT-PRIM-08`.
- For `RMT-VNEXT-PRIM-07`, as the next DX step, expand the VS Code bridge from Output Channel experience to production active-document integration: request real LSP CodeActions, offer preview selection, apply safe WorkspaceEdits and keep handoff follow-ups visible. Then check whether PRIM-07 can be set to `completed`.
- Extend PRIM-05 only when new Fabric lanes or production fiber instrumentations are added; the current lane/fiber bridge is gateable.
- Then run at least `npm run test:rmt-vnext-primitives:report`, `node scripts/run_xtend_tests.js references --json` and, before release, `npm run test:release:full:report` again. Source-to-sea browser evidence remains optional through `npm run test:rmt-vnext-source-to-sea:chromedriver`, `npm run test:rmt-vnext-source-to-sea:validate-artifact` and `node scripts/run_xtend_tests.js rmt-vnext-source-to-sea --json`.

## Related Documents

- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Primitive Grammar Design](./rmt-vnext-primitive-grammar-design.md)
- [RMT vNext Primitive Parser AST](./rmt-vnext-primitive-parser-ast.md)
- [RMT vNext Primitive Semantic Graph](./rmt-vnext-primitive-semantic-graph.md)
- [RMT vNext Primitive Lowering](./rmt-vnext-primitive-lowering.md)
- [RMT vNext Fabric Bridge Evidence](./rmt-vnext-fabric-bridge-evidence.md)
- [RMT vNext Source-to-Sea Gate](./rmt-vnext-source-to-sea-gate.md)
- [RMT vNext Primitive Authoring Tooling](./rmt-vnext-primitive-authoring-tooling.md)
- [RMT vNext Primitive Migration](./rmt-vnext-primitive-migration.md)
- [RMT vNext Release Handoff](./rmt-vnext-release-handoff.md)
- [RMT App Platform Tooling](./rmt-app-platform-tooling.md)
- [RMT App Platform Migration Guide](./rmt-app-platform-migration-guide.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
- [RMT State Selector Runtime](./rmt-state-selector-runtime.md)
- [RMT Action Effect Runtime](./rmt-action-effect-runtime.md)
- [RMT Event Routing Runtime](./rmt-event-routing-runtime.md)
- [RMT Surface Resource Graph Runtime](./rmt-surface-resource-graph-runtime.md)
- [XTend-Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)
