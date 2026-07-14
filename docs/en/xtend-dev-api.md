# XTend DEV API

The XTend DEV API is the explicit, read-only diagnostics boundary between an XTend application and development tools. Expose it as `window.__XTEND_DEV_API__` when the application should be recognized by XTend Dev Surface or another local diagnostics consumer.

The API does not control the application. It publishes current snapshots while the RMT kernel, Fabric, the host runtime and the application remain the owners of execution and state.

## DEV API and `window.XTend`

`window.XTend` is the product-facing browser API initialized by `api.js`. It contains runtime services such as theme and feedback APIs. `window.__XTEND_DEV_API__` is a separate development contract for telemetry and diagnostics.

The leading and trailing double underscores are intentional. Do not add DEV-only methods to `window.XTend`, and do not use the DEV API as an application service locator.

## Contract at a glance

| Member | Requirement | Result |
| --- | --- | --- |
| `version` | Recommended | DEV API version string; an omitted value is reported as `null` |
| `getPerformanceSnapshot()` | Required | Current measurements, phases, budgets and statuses |
| `getFabricTelemetrySnapshot()` | Required | Current lanes, fibers, totals and backpressure |
| `getKernelSnapshot()` | Required | Current kernel health, panic and recovery state |
| `getHydrationSnapshot()` | Optional | Hydration or resume strategy, timings, surfaces and XScaler state |
| `subscribe(listener)` | Optional | Observation signal that returns an unsubscribe function |

The three required methods determine whether the runtime bridge is healthy. A missing optional method affects only the corresponding capability. In particular, omitting `getHydrationSnapshot()` must not degrade Performance, Kernel or Fabric.

## Runtime rules

Every snapshot method must:

1. Return synchronously. A `Promise` or another thenable is rejected.
2. Return a JSON-serializable value without cycles, DOM nodes, functions or class instances that lose essential state during serialization.
3. Read current state on every call. Do not capture a boot-time snapshot and return it forever.
4. Return data owned by the application without transferring ownership to the caller.
5. Avoid secrets, credentials, raw user content and unredacted resume tokens.

Install the object before the complete runtime boot when possible. Early calls may return valid `degraded` snapshots. Replace their data through the host-owned stores when the application becomes ready; do not replace browser globals or patch framework internals to collect it.

## XTend Classic opt-in

An HTML-first host that uses the canonical loader can opt into the read-only Classic adapter without adding another script tag:

```html
<script type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json"
  data-dev-api="true"></script>
```

The equivalent programmatic option is `window.XTendLoader.initiateXTend({ devApi: true })`. The loader imports its internal ESM service alongside the manifest. It publishes real loader and browser performance measurements. Fabric, RMT Kernel and SSR hydration report `supported: false` when those runtimes are not active; enabling diagnostics never boots them implicitly.

The default remains off. An existing host-owned `window.__XTEND_DEV_API__`, such as the Docs or Animation TestBench adapter, is preserved. The Classic service is intentionally not a direct package export: `xtend-loader.js` remains its lifecycle owner.

## Minimal implementation

The following app-local module establishes a complete v1 boundary. It is an integration example, not an exported XTend factory.

```js
const listeners = new Set();

const telemetry = {
  status: 'degraded',
  performance: {
    schema: 'xtend.devsurface.performance-snapshot.v1',
    supported: true,
    status: 'degraded',
    measurements: []
  },
  fabric: {
    schema: 'xtend.fabric.telemetry-snapshot.v1',
    status: 'degraded',
    lanes: {},
    totals: {
      fiberCount: 0,
      completedCount: 0,
      failedCount: 0,
      budgetMissCount: 0
    },
    backpressure: { level: 'none', action: 'observe' }
  },
  kernel: {
    schema: 'xtend.rmt.kernel-panic-state.v1',
    state: 'none',
    severity: 'info',
    recoveryAction: 'none',
    mitigationStrategy: 'observe',
    affectedScopes: [],
    affectedJobs: []
  },
  hydration: {
    schema: 'xtend.devsurface.hydration-snapshot.v1',
    supported: true,
    strategy: 'none',
    status: 'degraded',
    timing: {},
    surfaces: [],
    xscaler: {},
    diagnostics: []
  }
};

function cloneSnapshot(value) {
  return JSON.parse(JSON.stringify(value));
}

function publishDevTelemetry(patch) {
  Object.assign(telemetry, patch);
  const event = cloneSnapshot({
    schema: 'xtend.devsurface.subscription-event.v1',
    status: telemetry.status
  });
  listeners.forEach((listener) => {
    try { listener(event); } catch (_) {}
  });
}

window.__XTEND_DEV_API__ = Object.freeze({
  version: '1.0.0',
  getPerformanceSnapshot() {
    return cloneSnapshot(telemetry.performance);
  },
  getFabricTelemetrySnapshot() {
    return cloneSnapshot(telemetry.fabric);
  },
  getKernelSnapshot() {
    return cloneSnapshot(telemetry.kernel);
  },
  getHydrationSnapshot() {
    return cloneSnapshot(telemetry.hydration);
  },
  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
});

export { publishDevTelemetry };
```

When the runtime is ready, update the app-owned adapter with real measurements and snapshots:

```js
const recovery = appRuntime.getPanicRecoverySnapshot();

publishDevTelemetry({
  status: 'ready',
  performance: {
    schema: 'xtend.devsurface.performance-snapshot.v1',
    supported: true,
    status: 'ready',
    measurements: appMeasurements.slice()
  },
  fabric: fabric.createTelemetrySnapshot({ source: 'my-app' }),
  kernel: recovery.kernel || recovery.records?.at(-1) || telemetry.kernel,
  hydration: hydrationStore.snapshot()
});
```

`appMeasurements` and `hydrationStore` represent application-owned adapters in this example. They are not new XTend globals. The Docs shell derives the same boundary from its AppRuntime, while the Animation TestBench derives it from its boot, resume and XScaler state.

## Performance snapshot

The bridge accepts `measurements`, `performanceMeasurements` or `entries`; `measurements` is the canonical field for new integrations. Each measurement should use `xtend.performance.measurement.v1`.

```json
{
  "schema": "xtend.devsurface.performance-snapshot.v1",
  "supported": true,
  "status": "ready",
  "measurements": [
    {
      "schema": "xtend.performance.measurement.v1",
      "id": "app.route.transition",
      "name": "Route transition",
      "phase": "route",
      "profile": "app-shell",
      "lane": "transition",
      "durationMs": 42,
      "budgetMs": 140,
      "status": "pass",
      "sampleKind": "runtime"
    }
  ]
}
```

Use `pass`, `warn` or `fail` when the application already evaluated the budget. If status is absent, Dev Surface derives it from `durationMs` and `budgetMs`. Durations must be elapsed work, not absolute timestamps such as `performance.now()`.

## Fabric telemetry snapshot

Fabric accepts lanes as an object keyed by lane ID or as an array with `id` or `lane`. Totals make the overview deterministic; fiber records add drill-down detail.

```json
{
  "schema": "xtend.fabric.telemetry-snapshot.v1",
  "lanes": {
    "user-blocking": {
      "fiberCount": 3,
      "activeFiberCount": 1,
      "completedCount": 2,
      "failedCount": 0,
      "budgetMissCount": 0,
      "deadlineMs": 80,
      "averageDurationMs": 14,
      "backpressureLevel": "none",
      "fibers": []
    }
  },
  "totals": {
    "fiberCount": 3,
    "completedCount": 2,
    "failedCount": 0,
    "budgetMissCount": 0
  },
  "backpressure": {
    "level": "none",
    "action": "observe",
    "laneIds": []
  }
}
```

Report the lane used by the runtime instead of mapping every job to a generic lane. That preserves useful evidence for user-blocking work, transitions, visible hydration and idle work.

## Kernel snapshot

The kernel snapshot represents current health rather than an error log. A healthy runtime still returns a record with `state: "none"`.

```json
{
  "schema": "xtend.rmt.kernel-panic-state.v1",
  "state": "none",
  "severity": "info",
  "recoveryAction": "none",
  "mitigationStrategy": "observe",
  "affectedScopes": [],
  "affectedJobs": [],
  "blockedCommitCount": 0,
  "criticalViolationCount": 0
}
```

Supported health states are `none`, `suspected`, `active`, `recovering`, `recovered` and `failed`. Keep recovery and mitigation values explicit so operators can distinguish observation from an active block or retry.

## Optional hydration snapshot

Hydration may describe initial hydration, resume or a deliberate no-hydration path. Use elapsed durations relative to the operation that they describe.

```json
{
  "schema": "xtend.devsurface.hydration-snapshot.v1",
  "supported": true,
  "strategy": "server_prerender_resume",
  "status": "resumed",
  "resumeToken": "redacted",
  "resumeTokenRedacted": true,
  "rootId": "app-root",
  "adapterKind": "node-ssr",
  "responseKind": "rmt_template_chunk",
  "timing": {
    "ssrRenderMs": 18,
    "resumeReadMs": 2,
    "hydrateMs": 14,
    "firstInteractiveMs": 34,
    "clsValue": 0
  },
  "surfaces": [],
  "xscaler": {
    "mode": "protocol-lazy",
    "preflightCount": 0,
    "acceptedCount": 0,
    "rejectedCount": 0,
    "networkDuringRender": false,
    "lazyLoadedCount": 0,
    "atcSessions": []
  },
  "diagnostics": []
}
```

Never reconstruct a resume token for diagnostics. Publish the already-redacted value and mark it with `resumeTokenRedacted: true`, or omit it entirely.

## Subscription behavior

`subscribe(listener)` is optional. It advertises that the host can notify observers after relevant state changes, but snapshot methods remain the source of truth. Return an idempotent unsubscribe function and isolate listener failures so diagnostics tooling cannot break the application.

The extension may still request a fresh snapshot after receiving a signal. Do not assume that a subscription event transfers the complete runtime state or ownership of it.

## Verify from the browser console

Run this in the inspected application tab, not in the DevTools extension page:

```js
const api = window.__XTEND_DEV_API__;
if (!api) throw new Error('XTend DEV API is not installed.');

const required = [
  'getPerformanceSnapshot',
  'getFabricTelemetrySnapshot',
  'getKernelSnapshot'
];

for (const method of required) {
  if (typeof api[method] !== 'function') {
    throw new Error(`Missing required method: ${method}`);
  }
  const snapshot = api[method]();
  if (snapshot && typeof snapshot.then === 'function') {
    throw new Error(`${method} returned a Promise.`);
  }
  JSON.stringify(snapshot);
}

const unsubscribe = api.subscribe?.((event) => console.debug(event));
unsubscribe?.();
```

After this check, open XTend Dev Surface and select `Refresh`. The telemetry tabs should show app values instead of `No XTend app detected` or placeholder data.

## Diagnostics and troubleshooting

| Diagnostic | Meaning | Fix |
| --- | --- | --- |
| `xtend.devsurface.dev_api.missing` | The inspected page exposes no DEV API | Install it in the application page and reload the inspected tab |
| `xtend.devsurface.dev_api.method_missing` | A required method is absent | Add the named method; optional hydration and subscription methods do not trigger this error |
| `xtend.devsurface.runtime_bridge.async_snapshot_unsupported` | A snapshot method returned a thenable | Read prepared state synchronously and perform collection before the DEV API call |
| `xtend.devsurface.runtime_bridge.serialization_failed` | JSON cloning failed | Remove cycles, DOM nodes, functions and non-data class instances |
| `xtend.devsurface.runtime_bridge.read_failed` | A method threw while being evaluated | Catch errors in the app adapter and return a valid degraded snapshot with diagnostics |

If values remain stale after a route transition, inspect whether the method creates a fresh clone from current stores. Replacing `window.__XTEND_DEV_API__` repeatedly is not a refresh mechanism and can invalidate subscribers.

## Security checklist

- Publish aggregate diagnostics and identifiers, not credentials or user payloads.
- Redact resume tokens before they enter the snapshot.
- Keep methods read-only and free of app mutations.
- Do not patch `fetch`, `history`, `performance`, `customElements` or framework APIs.
- Do not load a remote diagnostics runtime or CDN script.
- Treat subscribers as optional observers and remove them during teardown.

## Related reading

- [XTend Dev Surface](./xtend-dev-surface.md)
- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [API](./api.md)
- [RMT AnimationEngine](./rmt-animation-engine.md)
