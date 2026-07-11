# XTend Dev Surface

XTend Dev Surface adds an XTend telemetry panel to Chromium DevTools. It lets you inspect performance budgets, hydration and XScaler, kernel health, Fabric lanes and local quality gates without patching the application runtime.

The extension does not identify XTend apps by DOM names or framework heuristics. A page is instrumented only when it explicitly exposes `window.__XTEND_DEV_API__`. If you open the panel on another page, Dev Surface blocks its telemetry views with `No XTend app detected`. Placeholder data can therefore never be mistaken for a real measurement.

## Prerequisites

For the local setup you need:

- Node.js 18 or newer;
- a Chromium-based browser such as Chrome, Chromium or Edge;
- a local checkout of the XTend repository;
- access to the browser extension Developer Mode.

The extension is fully local to the repository. It does not download a runtime, a UI framework or scripts from a CDN.

## Build and load the extension

Build the loadable extension directory and verify its contract first:

```bash
node tools/xtend-dev-surface/build.js
node scripts/run_xtend_tests.js xtend-dev-surface --json
```

The build writes the Manifest V3 extension to `tools/xtend-dev-surface/dist/`. Load that directory as an unpacked extension:

1. Open `chrome://extensions` or the corresponding extension page in your browser.
2. Enable Developer Mode.
3. Select `Load unpacked` and open `tools/xtend-dev-surface/dist/`.
4. Open an instrumented XTend app in a normal browser tab.
5. Open DevTools and select the `XTend` panel.

After changing `tools/xtend-dev-surface/src/`, run the build again and reload the extension from the browser extension page. Reloading the inspected app only refreshes its DEV API; it does not refresh extension files.

## Verify it with Animation TestBench

RMT Animation TestBench is the local reference app for all five views. It supplies real performance, hydration, kernel and Fabric snapshots through the DEV API.

```bash
npm --prefix products/rmt-animation-testbench run build
npm --prefix products/rmt-animation-testbench run dev
```

Open `http://127.0.0.1:9196/`, open DevTools and switch to `XTend`. The header should show DEV API version `0.1.0-rmt-animation-testbench` instead of `No XTend app detected`.

The TestBench uses `server_prerender_resume`, a server-side resume payload, XScaler preflights and real AnimationEngine measurements. This gives you observable normal, lazy-surface, budget and diagnostic paths.

## Instrument an app

The DEV API is an explicit read-only boundary. Its four core methods return synchronous, JSON-serializable snapshots. `getHydrationSnapshot()` and `subscribe()` are optional.

```js
window.__XTEND_DEV_API__ = {
  version: '1.0.0',
  getPerformanceSnapshot() {
    return {
      measurements: [
        {
          schema: 'xtend.performance.measurement.v1',
          name: 'app.boot',
          phase: 'boot',
          durationMs: 120,
          budgetMs: 300,
          status: 'pass'
        }
      ]
    };
  },
  getHydrationSnapshot() {
    return {
      strategy: 'server_prerender_resume',
      status: 'resumed',
      resumeToken: '[redacted]',
      timing: {
        ssrRenderMs: 18,
        resumeReadMs: 2,
        hydrateMs: 24,
        firstInteractiveMs: 44,
        clsValue: 0.002
      },
      surfaces: [],
      xscaler: {
        mode: 'protocol-lazy',
        preflightCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        networkDuringRender: false,
        lazyLoadedCount: 0,
        atcSessions: []
      }
    };
  },
  getFabricTelemetrySnapshot() {
    return {
      fiberCount: 0,
      lanes: {},
      backpressure: { level: 'none', laneIds: [] }
    };
  },
  getKernelSnapshot() {
    return {
      state: 'none',
      severity: 'none',
      affectedScopes: [],
      affectedJobs: [],
      mitigationStrategies: []
    };
  },
  subscribe(listener) {
    return () => {};
  }
};
```

Do not return promises, DOM nodes, functions, cyclic objects or browser events from these methods. Runtime Bridge reads the values through `chrome.devtools.inspectedWindow.eval`, so asynchronous or non-serializable results become diagnostics. Create a fresh snapshot or a safe copy for every call so the extension never owns canonical app state.

A resume token is displayed exactly as the app supplies it. If the value is sensitive, the app must redact it before returning the snapshot. The extension does not reconstruct or decrypt tokens.

## Understand the views

| Tab | Data source | Main questions |
| --- | --- | --- |
| `Performance` | `getPerformanceSnapshot()` | Which measurement exceeds its budget, and which phase regressed? |
| `Hydration` | `getHydrationSnapshot()` | Which strategy ran, how long did resume and hydration take, and what did XScaler do? |
| `Kernel` | `getKernelSnapshot()` | Is the kernel healthy, which scopes are affected, and which mitigation is active? |
| `Fabric` | `getFabricTelemetrySnapshot()` | Which lanes are busy, where do fibers fail, and where is backpressure building? |
| `Gates` | local companion | Which allowlisted check is running, and which JSON artifact did it produce? |

`Performance` maps `pass`, `warn`, `fail` and `blocked` from `xtend.performance.measurement.v1` to `optimal`, `needs-improvement`, `flawed` and `blocked`. Compare `durationMs` and `budgetMs` on the same measurement. The summary is an overview, not a replacement for the failed measurement row.

`Hydration` separates `ssrRenderMs`, `resumeReadMs`, `hydrateMs` and `firstInteractiveMs`. These values are not additive phases when they use different clocks. `firstInteractiveMs` is the elapsed time until interaction, not extra time on top of SSR and hydration. The XScaler section shows accepted and rejected preflights, lazy surfaces, ATC sessions and unexpected network activity during render.

`Kernel` distinguishes states including `none`, `suspected`, `active`, `recovering`, `recovered` and `failed`. For a panic, inspect the trigger, affected scopes and jobs first. `recoveryAction` is the concrete action, while `mitigationStrategy` is the wider policy.

`Fabric` aggregates fiber count, active and pending work, failures, budget misses, utilization and backpressure per lane. High utilization alone is not a failure. It becomes actionable together with pending fibers, budget misses, failures or a backpressure action.

## Run local gates

The optional companion runs predefined gate IDs only. The panel has no free-form shell input. Start the companion with a local token:

```bash
XTEND_DEV_SURFACE_TOKEN=dev node tools/xtend-dev-surface/companion.js
```

Open `Gates`, enter the same token and select `Check`. The companion listens on `http://127.0.0.1:27864` by default. Protected endpoints require `x-xtend-dev-surface-token`; commands run with `shell: false`, and artifact links may point only to allowlisted relative report paths.

A gate moves through `queued`, `running` and then `passed`, `failed` or `blocked`. Open the normalized JSON artifact first when a run fails. The shortened stdout/stderr tail is supporting context, not the report itself.

## Inspect Docs as the reference app

XTend Docs exposes the DEV API itself. This check needs neither a mock nor Animation TestBench:

```bash
php -S 127.0.0.1:9187 -t . docs/dev-router.php
```

Open `http://127.0.0.1:9187/docs/en/readme`, then Chromium DevTools and the `XTend` panel. During early boot, synchronous methods may return a valid `degraded` snapshot. Once the shell is ready, expect `server_prerender_hydrate`, kernel state `none`, AppRuntime fibers under `Fabric`, and measurements for SSR, FCP, content commit and route transitions.

Navigation and search use the same AppRuntime that produces these snapshots. Search for `hydratoin`, open a result and verify that route state, lane counts and the Search measurement update together. This also reveals stale snapshots that a static DEV API mock would hide.

## Security and ownership boundaries

- The extension reads only `window.__XTEND_DEV_API__`.
- It does not patch `fetch`, `history`, `performance`, `customElements` or framework APIs.
- The prewarm worker normalizes snapshots and chart data, but owns no DOM, host services or canonical state.
- Extension pages use local scripts under Manifest V3; remote code and CDN runtimes are not allowed.
- The companion binds locally and starts only its gate allowlist.
- DEV API snapshots must not contain secrets or unredacted user data.

## Troubleshooting

`No XTend app detected` means that the inspected tab does not expose `window.__XTEND_DEV_API__`. Switch to the correct app tab, reload the app and select `Refresh` in the panel. `Gates` remains available because local gates do not depend on page telemetry.

A `degraded` status means that the API exists, but a required method is missing, threw an error or returned a value that is not synchronously serializable. Open the panel diagnostic and call the same method from the inspected tab console.

If a snapshot remains stale after navigation, make sure every API method returns current state on every call. `subscribe()` advertises observability, but the first version does not transfer state ownership to the extension.

If `Gates` cannot connect, check the companion process, port and token. An unknown gate is deliberately blocked. Add a reviewed gate definition to the companion allowlist instead of forwarding arbitrary commands.

## Next steps

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [Supply Chain Checks](./supply-chain-gates.md)
