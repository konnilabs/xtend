# RMT Kernel Feature Adoption Evaluation

Updated: 2026-06-19

This evaluation builds on the [RMT Kernel Topography Map](./rmt-kernel-topography-map.md). The topography map shows which kernel surfaces exist. This document evaluates the currently underused modules: Is the module useful for XTend, and if so, where should it hook into the framework?

## Executive Summary

The underused kernel features are mostly not obsolete. Some of them come from an offline-only `file://` application, but they fit XTend well when they are integrated as optional, observable and contract-bound capabilities.

The largest levers are:

- **Warm Reentry and Prewarm Worker**: Highly useful for production apps when recurring routes, surfaces or shell content can be prepared as worker chunks.
- **Template Artifacts**: Highly useful as Source-to-Sea evidence, fingerprinting and bundle-report layer.
- **Performance Runtime Advanced APIs**: Highly useful for CI summaries, baselines, trendlines and backpressure profiles.
- **Detached Runtime**: Highly useful for deterministic lifecycle, telemetry and resource-release gates.
- **DOM Compat**: Useful as a shared ownership and island-contract layer for Surface Manager and the RMT Surface Adapter.
- **Worker/Server Prerender Transports**: Useful in stages. Worker prerender is natural for browser-only and offline-capable apps; server prerender should connect to the existing Node/PHP SSR adapters.

The recommendation is not to switch everything on globally. The safer line is: build/report evidence first, then opt-in runtime flags, then targeted production paths.

## Evaluation Matrix

| Kernel module / API | Useful for XTend? | Assessment | Recommended hooks |
| --- | --- | --- | --- |
| `createRmtProductSurface()` | Yes | High structural value because Product Surface inventories runtime, core, template, transport and compat factories | `xtend-maraca/index.js`, `xtendrmt/rmt-kernel-orchestration-controller.js`, bundle report `kernel.entryPoints` |
| `createRmtTemplateArtifacts()` | Yes | High Source-to-Sea value through fingerprints, runtime profile hints and registerable artifact bundles | Maraca build plan, Maraca bundle report, RMT compiler/report pipeline |
| `createRmtPrewarmWorkerRuntime()` | Yes | High production value for Warm Reentry, route/surface reopen and off-main-thread preparation | Maraca hydration plan, browser runtime boot options, Fabric hydration policy, Surface Manager lazy hydration |
| `createRmtTemplateWorkerAdapter()` / `createRmtWorkerPrerenderRuntime()` | Yes, opt-in | Fits `worker_prerender_hydrate` when workers compute chunks without DOM responsibility | Hydration plan, Fabric lane mapping, RMT runtime bridge, browser smoke gates |
| `createRmtTemplateServerAdapter()` / `createRmtServerPrerenderRuntime()` | Yes, host-dependent | Useful as a shared client/server envelope for existing Node/PHP SSR adapters | `xtendrmt/rmt-node-ssr-adapter.js`, `xtendrmt/rmt-php-ssr-adapter.php`, Docs PHP SSR, Maraca SSR capability report |
| `createRmtDetachedRuntime()` | Yes | Strong fit for CI and regressions without browser flakes; production use is limited to special hostless preparation | `scripts/run_xtend_tests.js`, RMT lifecycle/telemetry suites, Surface Manager resource gates |
| `createRmtDomCompat()` | Yes | Should centralize ownership modes, island mount/unmount and host contracts | Surface Manager Controller, RMT Surface Adapter, Surface Resource Graph, XSurfaceManager docs/gates |
| Performance Runtime report/history APIs | Yes | Already present but not fully used; adds CI summaries, baselines and trends | Fabric telemetry, Maraca bundle/size reports, release gates |
| `createRmtTemplateExecutionPath()` trust/panic/recovery | Yes | Security and recovery data should not remain limited to kernel security tests | Fabric diagnostics, Maraca lifecycle/kernel report, browser telemetry bridge |
| `createRmtKernelPolicyParity()` | Yes | Good release and strict-mode gate surface, not just a dedicated kernel test helper | Maraca strict gates, package release reports, policy/runtime parity report |
| Template registry/loader/compiler direct APIs | Partly | Important substrate, but usually better consumed through Template API or runtime | Use directly for Maraca artifact generation and focused compiler gates |
| RenderMan legacy aliases | No for new work | Keep compatibility, but do not use them as new integration surfaces | Parity and deprecation gates only |

## Warm Reentry And Prewarm Worker

**Usefulness:** Yes, high.

The Prewarm Worker is not merely historical offline code. Its current capabilities fit XTend:

- `syncTemplates()` synchronizes template snapshots into the worker.
- `dispatchPrerenderEnvelope()` creates prepared prerender responses.
- `getTopologySnapshot()` exposes health, pending jobs, submitted jobs, synced templates, missing APIs and responsibility boundaries.
- The worker explicitly declares that it does not own DOM mutation, event binding or state ownership.
- The Performance Runtime has backpressure profiles with `prewarmFootprintRatio`, `prewarmMaxItems`, `prewarmMaxDomNodes`, `preferIdle` and `delayMultiplier`.

| Layer | Hook |
| --- | --- |
| Maraca build plan | Add optional `warmReentry` / `prewarm` section derived from `prewarm` operations, hydration modes and route/surface recurrence |
| Maraca runtime boot | Use `createRmtRuntime({ enablePrewarmWorker })` behind an explicit feature flag; start with `false` or `auto-if-supported` |
| Fabric | Add fiber kinds `template.prewarm`, `template.prerender`, `surface.prewarm`, `route.prewarm` with default lane `background` or `idle` |
| Hydration policy | Add a `warm` or `prewarm` branch that reduces under high backpressure instead of forcing work |
| Surface Manager | `open`, `focus`, route hover and soon-visible signals can trigger prewarm; `destroySurface` must invalidate prewarm and chunk handles |
| Telemetry | Fabric snapshot should include `prewarmTopology`, `workerHealth`, `templatesSynced`, `pendingJobs`, `missingApis` and `lastError` |

Recommended semantics:

- Prewarm is opportunistic, not correctness-critical.
- Prewarm must not block visible work.
- At `critical` backpressure, prewarm pauses or sharply reduces work.
- Worker chunks are prepared render/hydration artifacts; DOM commit stays on the main thread and Trusted DOM Runtime.
- Warm Reentry means reopening or returning to a route/surface can reuse prepared chunks, retained measurements and smaller hydration followups.

## Template Artifacts

**Usefulness:** Yes, very high.

`createRmtTemplateArtifacts()` creates document artifacts and artifact bundles with fingerprints, runtime profile hints, template IDs and registerable prepared documents. This fits XTend's Source-to-Sea model very well.

Hooks:

- `xtend-maraca/index.js`: create a `templateArtifacts` section after compile/build planning.
- Bundle report: `templateArtifactCount`, `bundleFingerprint`, `runtimeProfileHints`, `sourceFingerprint`, `documentIds`.
- Runtime: call `runtime.registerArtifactBundle()` only for bundled, trusted artifacts.
- Tests: gate that `.rmt` files with templates produce a stable artifact fingerprint in the report.

Priority: P0/P1 because this feature does not need to change runtime behavior and immediately improves observability.

## Worker Prerender Runtime

**Usefulness:** Yes, opt-in.

The worker prerender runtime wraps `requestPrerender()`, `hydrateResponse()` and `execute()` through worker transport. It is the natural execution path for `worker_prerender_hydrate`.

Hooks:

- Fabric lane mapping: `template.prerender` and `template.prewarm` map to `background`; `hydrate.response` maps to `visible` or `idle` depending on visibility.
- Maraca hydration plan: `worker_prerender_hydrate` or `prewarm ... from worker` emits a `workerPrerender` capability record.
- Browser runtime: use worker runtime only behind a feature flag and when Worker APIs exist.
- Surface Manager: lazy hydration can consume a prepared worker response while it is still valid.

Risks:

- Workers must not execute host services.
- Worker results must pass through Trusted DOM and Execution Path on the main thread.
- Supersession matters: newer route/surface intents must displace older worker responses.

## Server Prerender Runtime

**Usefulness:** Yes, but not as a replacement for SSR adapters.

The server transport APIs are valuable as a shared envelope between client runtime and Node/PHP SSR adapters. XTend already has `rmt-node-ssr-adapter.js`, `rmt-php-ssr-adapter.php` and Docs App SSR paths using `server_prerender_hydrate`.

Hooks:

- SSR adapters: validate responses against `RmtTemplatePrerenderResponseEnvelope` and `hydrateResponse()` compatibility.
- Docs PHP SSR: report existing `server_prerender_hydrate` evidence with the kernel transport adapter.
- Maraca report: `serverPrerender.supported`, `adapterKind`, `hydrateResponseCompatible`.

Priority: P2 because worker, artifacts and telemetry provide direct framework value sooner.

## Detached Runtime

**Usefulness:** Yes, especially for tests.

`createRmtDetachedRuntime()` wraps browser runtime semantics in a detached host. That is ideal for reproducible gates where browser APIs, timing and DOM flakes are noisy.

Hooks:

- Lifecycle gates: `destroySurface`, resource release, `disposeRoot`, telemetry tombstones.
- Template gates: render, prerender and hydrate without a real browser smoke run.
- CI: fast regressions for Maraca kernel/hydration plans.

Production value: medium. In production it is mainly useful for preview, hostless preparation or embedded hosts without a real DOM.

## DOM Compat

**Usefulness:** Yes, as a contract layer.

`createRmtDomCompat()` knows host contracts, ownership modes, island mount/unmount, element resolution and `finalizeIslandUnmount()`. Surface Manager currently owns much of that DOM and ownership logic locally. A hard migration would be risky, but a compatibility layer is useful.

Hooks:

- Surface Manager Controller: test ownership decisions against the DomCompat contract.
- RMT Surface Adapter: `materializeSurfaces()` and `destroySurface()` can use DomCompat for owned/external element rules.
- Docs/gates: validate `managed_subtree`, `replace_children`, `hydrate_existing`, `observe_only` against destroy semantics.

Priority: P1/P2, after Detached Runtime gates.

## Performance Runtime Advanced APIs

**Usefulness:** Yes, very high.

The Performance Runtime can do more than basic snapshots:

- Evaluate budgets: `evaluateBudget()`, `evaluateBudgets()`
- Expose backpressure profiles: `getBackpressureProfile()`
- Compare reports: `compareRunReports()`, `compareRunReportToBaseline()`
- Create baselines and trends: `createRunBaseline()`, `createTrendSeries()`, `createNightlyTrendlines()`
- Create CI and file artifacts: `createCiSummary()`, `createFileArtifact()`, `writeCiSummary()`
- Manage persisted history: `persistHarnessOutput()`, `exportPersistedHistory()`

Hooks:

- Fabric telemetry snapshot: include kernel performance snapshot and backpressure profile as first-class fields.
- Maraca bundle report: `performance.ciSummary`, `performance.budgetSnapshot`, `performance.baselineComparison`.
- Release gates: budget misses for `visible_commit`, `command_turnaround`, `retained_warm_reuse` and `hydration_followup`.
- Warm Reentry: use `retained_warm_reuse` as the budget class for surface/route reentry.

## Template Execution Path, Trust, Panic And Recovery

**Usefulness:** Yes, security-relevant.

Execution Path and Runtime Renderer can expose trust verdicts, panic events, recovery outcomes, safe snapshots and quarantine scopes. These records should not be visible only in kernel security tests.

Hooks:

- Fabric diagnostics: panic/recovery as `diagnostics` lane, severity `warn` or `error`.
- Maraca bundle report: `kernel.security`, `panicRecovery`, `trustedDom`.
- Surface lifecycle: a surface destroy or unmount after panic can reference safe snapshot and quarantine scope.
- App Runtime: stream, error and cancel lifecycle can correlate recovery diagnostics.

## Product Surface Bootstrap

**Usefulness:** Yes, structurally.

Maraca and the kernel orchestrator currently instantiate several factories directly. That works, but Product Surface is a more robust boot facade:

- `listEntryPoints()`
- `listOptionalCompat()`
- `createRuntime()`, `createCore()`, `createPerformanceRuntime()`
- `createTemplateArtifacts()`, `createWorkerRuntime()`, `createServerRuntime()`, `createDetachedDomRuntime()`

Hooks:

- Kernel orchestrator: optionally create `productSurface = createRmtProductSurface()` and obtain factories through Product Surface.
- Maraca bundle report: `kernel.productSurface.entryPoints`, `optionalCompat`, `runtimeFactories`.
- Tests: Product Surface boot must create the same runtime chain as direct factory usage.

## Recommended Tracks

| Track | Goal | Modules | First gates |
| --- | --- | --- | --- |
| A: Evidence First | Use artifacts and reports without risking runtime behavior | Product Surface, Template Artifacts, Performance CI Summary | Bundle report contains entry points, artifact fingerprints and performance summaries |
| B: Deterministic Runtime Gates | Test kernel runtime capabilities reproducibly | Detached Runtime, DomCompat, Execution Path | Detached lifecycle destroy/release, DomCompat ownership parity, panic/recovery snapshot |
| C: Warm Reentry Opt-In | Use worker prewarm for route/surface recurrence | Prewarm Worker, Worker Adapter, Performance Backpressure | Worker topology telemetry, `retained_warm_reuse` budget, prewarm degrades under critical pressure |
| D: Prerender Transport Interop | Connect worker/server transport compatibility | Worker/Server Prerender Runtime, Node/PHP SSR | `worker_prerender_hydrate` smoke, `server_prerender_hydrate` hydrate response compatibility |
| E: Strict Release Hardening | Connect policy, panic and telemetry to production gates | Policy Parity, Panic/Recovery, Performance Baselines | Strict Maraca build fails on parity drift, unsafe trust sink or budget regression |

## Decision

The underused kernel modules should be adopted in this order:

1. Product Surface bootstrap evidence, Template Artifacts and Performance CI summaries.
2. Detached Runtime and DomCompat parity gates.
3. Warm Reentry / Prewarm Worker as an opt-in production feature with topology telemetry.
4. Worker/server prerender interop once the gates are stable.
5. Policy parity, panic/recovery and performance baselines as release hardening.
