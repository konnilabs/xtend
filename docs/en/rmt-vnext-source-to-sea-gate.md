# RMT vNext Source-to-Sea Gate

- Contract: `xtend.rmt.vnext.source-to-sea-gate.v1`
- Evidence: `xtend.rmt.vnext.source-to-sea-evidence.v1`
- Evidence Report: `xtend.rmt.vnext.source-to-sea-evidence-report.v1`
- Object Matrix: `xtend.rmt.vnext.source-to-sea-object-matrix.v1`
- CI Artifact Validation: `xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1`
- Fabric Bridge Evidence: `xtend.rmt.vnext.fabric-bridge-evidence.v1`
- Workpackage: `RMT-VNEXT-PRIM-06`
- Active Bridge Workpackage: `RMT-VNEXT-PRIM-05`
- Status: `in_progress`
- Fabric Bridge Handoff: [RMT vNext Fabric Bridge Evidence](./rmt-vnext-fabric-bridge-evidence.md)
- Source: Media Manager downstream transfer, `2026-05-19`

## Goal

`RMT-VNEXT-PRIM-06` starts the full-stack gate for vNext-authored primitives. The gate proves not only parser or JSON output, but reconstructs the same visible object lifecycle across all runtime boundaries:

```text
source -> kernel -> Fabric -> UI -> Browser
```

The first PRIM-06 slice remains deterministic in the default run and works without an external browser driver. It connects a vNext fixture with a self-checking browser-smoke fixture and produces machine-readable evidence from that. With the current expansion, a WebDriver, ChromeDriver or Safari Driver path can open the same browser fixture, read the same result key and compare the real browser result against compiler, kernel and Fabric evidence. Browser execution evidence can now also be written as a release artifact at `.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json`. In GitHub Actions, this path runs as required through `chromedriver`.

## Fixture

The vNext fixture is located at:

```text
tests/rmt-language/fixtures/vnext-source-to-sea.rmt
```

It declares exclusively in RMT vNext:

- `state demo.feedback.status`
- `state demo.feedback.toast`
- `state demo.feedback.detail`
- `state demo.feedback.audit`
- `selector demo.feedback.status`
- `selector demo.feedback.toast`
- `selector demo.feedback.detail`
- `selector demo.feedback.audit`
- `action demo.feedback.save`
- `action demo.feedback.dismiss`
- `action demo.feedback.detail.ack`
- `action demo.feedback.audit.review`
- `portal surface.root`
- `resource demo.feedback.timer`
- `resource demo.feedback.toastTimer`
- `resource demo.feedback.detailTimer`
- `resource demo.feedback.auditTimer`
- `surface demo.feedback.status`
- `surface demo.feedback.toast`
- `surface demo.feedback.detail`
- `surface demo.feedback.audit`
- one `visible` lane with `hydrate feedback-status`
- a second `idle` lane with `hydrate feedback-toast`
- a `transition` lane with `mount feedback-detail`
- a second `transition` lane with `mount feedback-audit`
- a click event on `[data-action='save']`
- a click event on `[data-action='dismiss']`
- a click event on `[data-action='ack-detail']`
- a click event on `[data-action='review-audit']`
- a cross-primitive reducer from `demo.feedback.save` to `state.demo.feedback.toast.text`

This puts state, selector, action, event, surface, lane/fiber and lifecycle owner in the same authoring language.

## Browser Probe

The browser fixture is located at:

```text
tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html
```

It contains visible DOM markers:

```html
data-rmt-primitive-id="demo.feedback.status"
data-rmt-primitive-id="demo.feedback.toast"
data-rmt-primitive-id="demo.feedback.detail"
data-rmt-primitive-id="demo.feedback.audit"
```

and a stable result key:

```js
window.__xtendRmtVNextSourceToSeaResult
```

The fixture checks locally that the object is visible, carries the expected schedule/fiber metadata, records the RMT action event on click and changes the visible text from `Ready` to `Saved`.

Since `RMT-VNEXT-PRIM-05`, the same DOM probe also carries visible Fabric bridge markers:

```html
data-xtend-fabric-lane="visible"
data-xtend-fabric-fiber="fiber:demo.feedback/demo.feedback.status/visible/0"
data-xtend-fabric-schedule="component.visible.hydrate"
data-xtend-host-adapter-telemetry="xtend.component.lifecycle-telemetry.v1"
```

The bridge also hardens a lane matrix for `user-blocking`, `transition`, `idle`, `background` and `diagnostics`. Every matrix lane creates a real Fabric fiber, a Fabric/RMT mapping decision and a telemetry snapshot entry.

The browser probe additionally contains a host-adapter telemetry record with `xtend.component.lifecycle-telemetry.v1`. The gate normalizes this record through `fabric.recordComponentTelemetry(...)` so PRIM-05 can prove the XTend UI host-adapter layer in the Fabric snapshot.

Since the multi-object expansion, the gate projects host-adapter telemetry per primitive. `demo.feedback.status` stays on `visible` and `component.visible.hydrate`, while `demo.feedback.toast` is validated through `idle` and `component.idle.hydrate`. `demo.feedback.detail` and `demo.feedback.audit` are separate route targets on the `transition` lane.

PRIM-05 also binds the production fiber instrumentations:

- `createComponentFiberInstrumentation(...)` creates `component.mount` and `component.hydrate`.
- `createRouteFiberInstrumentation(...)` creates `route.navigate` and `route.render`.
- The schedule refs `component.visible.mount`, `component.idle.hydrate`, `ui.user-blocking.input` and `route.transition.render` must appear in the Fabric telemetry snapshot.

## Evidence API

The gate is produced by `tools/rmt-language/vnext-source-to-sea.js`:

```js
const {
  createRmtVNextFabricBridgeEvidence,
  createRmtVNextSourceToSeaEvidenceReport,
  createRmtVNextSourceToSeaEvidence,
  runRmtVNextSourceToSeaBrowserExecution,
  writeRmtVNextSourceToSeaEvidenceReport
} = require('./tools/rmt-language/vnext-source-to-sea');

const evidence = createRmtVNextSourceToSeaEvidence({
  text,
  filePath
}, {
  browserFixtureText,
  browserFixturePath: 'tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html'
});

const browserExecution = await runRmtVNextSourceToSeaBrowserExecution(evidence, {
  rootDir: process.cwd(),
  browserFixturePath: 'tests/browser/fixtures/rmt-vnext-source-to-sea-smoke.html',
  browserDriver: process.env.RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER || 'chromedriver',
  requireBrowserExecution: true
});

const evidenceReport = await createRmtVNextSourceToSeaEvidenceReport({
  rootDir: process.cwd(),
  evidence,
  browserExecution
});

await writeRmtVNextSourceToSeaEvidenceReport({
  rootDir: process.cwd()
});
```

Evidence must correlate under the same primitive ID:

```json
{
  "schema": "xtend.rmt.vnext.source-to-sea-evidence.v1",
  "primitiveId": "demo.feedback.status",
  "sourcePointer": "/events/0",
  "kernel": {
    "scheduleRef": "schedule:demo.feedback/demo.feedback.status/visible"
  },
  "fabric": {
    "schema": "xtend.rmt.vnext.fabric-bridge-evidence.v1",
    "workpackage": "RMT-VNEXT-PRIM-05",
    "lane": "visible",
    "fiber": "fiber:demo.feedback/demo.feedback.status/visible/0",
    "scheduleRef": "component.visible.hydrate",
    "endpointName": "xtendrmt.component.hydrate",
    "hostAdapter": {
      "schema": "xtend.component.lifecycle-telemetry.v1",
      "source": "xtend.component-adapter",
      "operation": "hydrate"
    },
    "routeComponentFibers": {
      "schema": "xtend.rmt.vnext.route-component-fiber-evidence.v1",
      "component": ["component.visible.mount", "component.idle.hydrate"],
      "route": ["ui.user-blocking.input", "route.transition.render"]
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
  },
  "browserExecution": {
    "schema": "xtend.rmt.vnext.browser-execution-evidence.v1",
    "status": "skipped",
    "driver": null,
    "resultKey": "__xtendRmtVNextSourceToSeaResult"
  }
}
```

The artifact report wraps this evidence plus browser-execution policy:

```json
{
  "schema": "xtend.rmt.vnext.source-to-sea-evidence-report.v1",
  "workpackage": "RMT-VNEXT-PRIM-06",
  "status": "passed",
  "artifact": {
    "path": ".xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json",
    "browserExecutionRequired": false,
    "browserExecutionStatus": "skipped"
  },
  "ciArtifactValidation": {
    "schema": "xtend.rmt.vnext.source-to-sea-ci-artifact-validation.v1",
    "status": "skipped"
  }
}
```

Since the multi-object expansion, the same report also contains an object matrix:

```json
{
  "schema": "xtend.rmt.vnext.source-to-sea-object-matrix.v1",
  "objectCount": 4,
  "primitiveIds": [
    "demo.feedback.status",
    "demo.feedback.toast",
    "demo.feedback.detail",
    "demo.feedback.audit"
  ],
  "crossPrimitiveEvents": [
    {
      "sourcePrimitiveId": "demo.feedback.status",
      "targetPrimitiveId": "demo.feedback.toast",
      "actionId": "demo.feedback.save",
      "eventId": "demo.feedback.toast.promoted",
      "targetState": "state.demo.feedback.toast.text",
      "lane": "idle"
    }
  ],
  "routeSwitches": [
    {
      "sourcePrimitiveId": "demo.feedback.status",
      "targetPrimitiveId": "demo.feedback.detail",
      "actionId": "demo.feedback.save",
      "from": "/rmt-vnext-source-to-sea",
      "to": "/rmt-vnext-source-to-sea/toast",
      "scheduleRef": "ui.user-blocking.input",
      "renderScheduleRef": "route.transition.render",
      "lane": "transition",
      "targetScheduleRef": "schedule:demo.feedback/demo.feedback.detail/transition",
      "targetFiberRef": "fiber:demo.feedback/demo.feedback.detail/transition/0",
      "targetExpectedText": "Detail mounted"
    },
    {
      "sourcePrimitiveId": "demo.feedback.status",
      "targetPrimitiveId": "demo.feedback.audit",
      "actionId": "demo.feedback.save",
      "from": "/rmt-vnext-source-to-sea/toast",
      "to": "/rmt-vnext-source-to-sea/audit",
      "scheduleRef": "ui.user-blocking.input",
      "renderScheduleRef": "route.transition.render",
      "lane": "transition",
      "targetScheduleRef": "schedule:demo.feedback/demo.feedback.audit/transition",
      "targetFiberRef": "fiber:demo.feedback/demo.feedback.audit/transition/0",
      "targetExpectedText": "Audit mounted"
    }
  ],
  "routeLifecycleCycles": [
    {
      "targetPrimitiveId": "demo.feedback.detail",
      "from": "/rmt-vnext-source-to-sea/toast",
      "to": "/rmt-vnext-source-to-sea",
      "unmountScheduleRef": "ui.background.work",
      "remountScheduleRef": "route.transition.render",
      "resourceId": "demo.feedback.detailTimer",
      "expectedUnmountCount": 1,
      "expectedRemountCount": 1
    },
    {
      "targetPrimitiveId": "demo.feedback.audit",
      "from": "/rmt-vnext-source-to-sea/audit",
      "to": "/rmt-vnext-source-to-sea",
      "unmountScheduleRef": "ui.background.work",
      "remountScheduleRef": "route.transition.render",
      "resourceId": "demo.feedback.auditTimer",
      "expectedUnmountCount": 1,
      "expectedRemountCount": 1
    }
  ]
}
```

## Gate Rules

The gate fails if any of these correlation links is missing:

- Compiler result is not successful.
- PRIM-03 semantic graph reports errors.
- PRIM-04 App Platform or Kernel records are missing.
- Kernel boundary is not `no-rmt-kernel-import-of-host-runtime-types`.
- Schedule or lifecycle record is missing.
- No Fabric fiber can be derived from schedule and operation.
- The Fabric bridge cannot create an `xtend.fabric.fiber.v1`.
- Fabric/RMT lane resolution does not return `xtend.fabric.rmt-lane-mapping.v1`.
- The Fabric telemetry snapshot does not contain the expected lane or schedule ref.
- The PRIM-05 lane matrix does not contain all expected Fabric lanes.
- Host-adapter telemetry is missing in the Fabric snapshot.
- Route or component fibers are missing in the Fabric snapshot.
- The browser fixture contains no visible Fabric lane/fiber markers.
- The fiber source kind is not `selector`.
- Source-map pointer to the event is missing.
- Browser fixture declares no probe contract.
- DOM marker, viewport assertion or event result key is missing.
- The object matrix contains fewer than four visible primitives, no separate lanes or no cross-primitive event.
- The object matrix does not contain at least two valid route switches with navigation and render schedule.
- The route switch mounts no target object or the target is not visible in the real browser result.
- A route lifecycle cycle does not unmount or remount the target, the expected unmount/remount counters per target are missing, declared resource cleanup is not provable in vNext/Core, or the resource owner does not match the route target.
- One of the matrix objects does not correlate through source, kernel, Fabric, UI and browser.
- The optional browser-execution path with an active driver does not return a `passed` result key or drifts from evidence in primitive ID, schedule, fiber, Fabric schedule, host-adapter telemetry or event.
- ChromeDriver auto-cleanup cannot stop an automatically started driver after a successful browser result through `/shutdown` or process fallback.
- Kernel records contain XTend host imports.

## Local Gates

Targeted PRIM-06 gates:

```bash
node --check tools/rmt-language/vnext-source-to-sea.js
node --check tests/rmt-language/rmt_vnext_source_to_sea_suite.js
node --check scripts/capture_rmt_vnext_source_to_sea_evidence.js
node -e "const suite=require('./tests/rmt-language/rmt_vnext_source_to_sea_suite'); suite.runRmtVNextSourceToSeaSuite({rootDir:process.cwd()}).then((result)=>process.exit(result.ok ? 0 : 1));"
node scripts/capture_rmt_vnext_source_to_sea_evidence.js
node scripts/run_xtend_tests.js fabric-lane-mapping fabric-component-fibers fabric-runtime-bridge --json
```

Real browser run with external WebDriver:

```bash
RMT_VNEXT_SOURCE_TO_SEA_BROWSER_DRIVER=webdriver \
RMT_VNEXT_SOURCE_TO_SEA_WEBDRIVER_URL=http://127.0.0.1:9515 \
node scripts/capture_rmt_vnext_source_to_sea_evidence.js --require-browser
```

Real browser run with automatically started ChromeDriver:

```bash
npm run test:rmt-vnext-source-to-sea:chromedriver
```

The GitHub Actions job `rmt-vnext-primitive-gates` uses this ChromeDriver path as required gate and then uploads the same evidence artifact. The report additionally contains CI artifact validation. In local browser-skip mode it remains `skipped`; in the ChromeDriver-required path it must be `passed` and prove `objectCount: 4`, two cross-primitive events, two route switches, two route lifecycle cycles, `targetMounted`, `targetVisible`, `countsMatch` and the audit resources `demo.feedback.auditTimer` and `demo.feedback.auditSubscription`.

An already written CI artifact can be checked again against the same contract without a new browser run:

```bash
npm run test:rmt-vnext-source-to-sea:validate-artifact
node scripts/capture_rmt_vnext_source_to_sea_evidence.js --validate-artifact .xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json
```

The replay path uses `validateRmtVNextSourceToSeaCiArtifactFile(...)`, requires browser evidence and fails closed with `status: "failed"` for missing, unparseable or drifted artifacts.

ChromeDriver auto-cleanup first uses the local WebDriver endpoint `/shutdown` for automatically started ChromeDriver. Only if this path does not stop the process does the gate fall back to process signals. This matters for Snap/Chromium installations where a direct `kill()` can fail with `EACCES`.

## Next Handoff

`RMT-VNEXT-PRIM-06` now provides the first source-to-sea evidence. `RMT-VNEXT-PRIM-05` is complete as its own Fabric bridge package: real Fabric runtime fibers, host-adapter telemetry, route/component fibers, a telemetry snapshot and a lane matrix for non-visible scheduling classes are gateable through `rmt-vnext-fabric-bridge`. The current PRIM-06 expansion makes the browser-execution path required in GitHub Actions through ChromeDriver. The release artifact is wired as `.xtend-test-results/xtend-rmt-vnext-source-to-sea-evidence.json`. The browser result matrix now contains four objects, cross-primitive events and two sequential route switches. The current runtime slice mounts `demo.feedback.detail` and `demo.feedback.audit` only after route changes and requires `targetMounted: true` and `targetVisible: true` in the browser result for each. In addition, `routeLifecycleCycles` runs separate unmount/remount cycles for both targets: `demo.feedback.detailTimer` and `demo.feedback.auditTimer` must be present through `dispose on surface.destroy` as resource-cleanup evidence; browser evidence must provide `unmountCount: 1`, `remountCount: 1` and `countsMatch: true` per target. The audit cycle now checks multiple resource records: beside `demo.feedback.auditTimer`, `demo.feedback.auditSubscription` with `kind subscription`, `owner surface.demo.feedback.audit` and `dispose on surface.destroy` must also be artifacted. A negative fixture without dispose policy must fail in a controlled way with `rmt.vnext.source_to_sea.cleanup_dispose_policy_missing`. A second negative fixture has a dispose policy but binds `demo.feedback.detailTimer` to `surface.demo.feedback.toast`; it must fail with `rmt.vnext.source_to_sea.cleanup_owner_mismatch`. A third negative fixture removes `demo.feedback.auditTimer` completely from vNext while keeping `demo.feedback.audit` as a route target; it must fail with `rmt.vnext.source_to_sea.cleanup_resource_missing`. The next step is comparing local `chromedriver` evidence with real CI artifacts.

Cross-primitive evidence is now two-stage: beside `demo.feedback.save -> demo.feedback.toast`, `demo.feedback.detail.ack -> demo.feedback.audit` must also be proven after route mount. The second entry reduces `state.demo.feedback.audit.text`, emits `demo.feedback.audit.escalated` and must appear in the browser result as `stage: "route-target"` with `sourceLane: "transition"` and `targetLane: "transition"`.

The negative browser probe `tests/browser/fixtures/rmt-vnext-source-to-sea-cross-route-invalid.html` intentionally moves the `stage: "route-target"` entry to `targetPrimitiveId: "demo.feedback.toast"` while event and target state continue to point to `demo.feedback.audit`. The object matrix must therefore fail closed and mark at least these guards as `false`: `cross event route-target state belongs to target primitive`, `cross event route-target event belongs to target primitive` and `cross event route-target stage uses transition lanes`.

## Browser Result Drift

The WebDriver result path is additionally protected by `xtend.rmt.vnext.source-to-sea-browser-result-validation.v1`. `createRmtVNextSourceToSeaBrowserResultValidation(...)` wraps the same checks that the real ChromeDriver run evaluates after the headless browser. This makes route-switch and lifecycle drifts deterministically reconstructable without a new browser start:

- `browser execution route switches pass` must fail when a route switch is present in the result but reports `status: "failed"`, `targetMounted: false` or `targetVisible: false`.
- `browser execution route lifecycle cycles pass` must fail when a lifecycle cycle reports `countsMatch: false` or different unmount/remount counters.
- `browser execution cross-primitive events pass` must fail when a cross-primitive event in the browser result does not report `status: "passed"`.
- `browser execution object matrix passes` must fail when a visible object in the browser result does not report `status: "passed"`.

## Cross-Route Event Evidence

The positive browser result must contain two cross-primitive events:

```json
{
  "sourcePrimitiveId": "demo.feedback.status",
  "targetPrimitiveId": "demo.feedback.toast",
  "eventId": "demo.feedback.toast.promoted",
  "targetLane": "idle"
}
```

```json
{
  "sourcePrimitiveId": "demo.feedback.detail",
  "targetPrimitiveId": "demo.feedback.audit",
  "eventId": "demo.feedback.audit.escalated",
  "stage": "route-target",
  "sourceLane": "transition",
  "targetLane": "transition"
}
```

## Multi-Resource Cleanup Evidence

The positive audit lifecycle must show multiple cleanup resources:

```json
{
  "targetPrimitiveId": "demo.feedback.audit",
  "resourceIds": [
    "demo.feedback.auditTimer",
    "demo.feedback.auditSubscription"
  ],
  "resourceKinds": [
    "timer",
    "subscription"
  ],
  "resourceDisposed": true
}
```

The object matrix must check the same owner and dispose policy for `demo.feedback.auditSubscription` as for the timer. Cycles with only `resourceId` remain compatible; production cycles can declare `resources` with multiple resource IDs and expected kinds.

## Negative Cleanup Fixtures

The negative fixtures are located under:

```text
tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-invalid.rmt
tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-owner-invalid.rmt
tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-resource-missing.rmt
tests/rmt-language/fixtures/vnext-source-to-sea-cleanup-kind-invalid.rmt
```

The first fixture intentionally leaves `demo.feedback.detailTimer` without `dispose on surface.destroy`. The second fixture keeps the dispose policy but intentionally binds the resource owner to `surface.demo.feedback.toast`. The third fixture keeps `demo.feedback.audit` as a route target but removes `demo.feedback.auditTimer` completely from the vNext source. The fourth fixture keeps `demo.feedback.auditSubscription` as cleanup resource but intentionally declares it with `kind cache` instead of `kind subscription`.
The positive source-to-sea gate remains successful, but the negative matrices must fail and provide this evidence:

```json
{
  "code": "rmt.vnext.source_to_sea.cleanup_dispose_policy_missing",
  "targetPrimitiveId": "demo.feedback.detail",
  "resourceId": "demo.feedback.detailTimer",
  "dispose": null
}
```

```json
{
  "code": "rmt.vnext.source_to_sea.cleanup_owner_mismatch",
  "targetPrimitiveId": "demo.feedback.detail",
  "resourceId": "demo.feedback.detailTimer",
  "owner": {
    "id": "demo.feedback.toast"
  }
}
```

```json
{
  "code": "rmt.vnext.source_to_sea.cleanup_resource_missing",
  "targetPrimitiveId": "demo.feedback.audit",
  "resourceId": "demo.feedback.auditTimer",
  "resource": null
}
```

```json
{
  "code": "rmt.vnext.source_to_sea.cleanup_kind_mismatch",
  "targetPrimitiveId": "demo.feedback.audit",
  "resourceId": "demo.feedback.auditSubscription",
  "expectedKind": "subscription",
  "actualKind": "cache"
}
```
