# RMT Kernel Topography Map

Updated: 2026-06-19

This map describes the bundled RMT kernel used by the XTend stack. The kernel was originally composed from separate modules and is now shipped mainly through `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-core.esm.js` and `xtendrmt/rmt-runtime.browser.js`. `xtendrmt/rmt-app-runtime.js` remains the kernel-adjacent app runtime layer for commands, host services, streams, reducers and Fabric integration.

## Purpose

The map answers three questions:

- Which functional surfaces already exist in the kernel?
- Which of them are currently used directly by the XTend stack?
- Which underused surfaces could improve Maraca, Fabric, App Runtime and Surface Manager?

Generated product bundles and build copies are excluded from the adoption assessment. They prove artifact parity, but not separate framework integration.

## Bundle Topology

| Bundle module | Primary factory | Function surface |
| --- | --- | --- |
| `render-man.js` | `createRmtEngine` | Root lifecycle, scheduler integration, resources, commands, reactivity and runtime state |
| `renderman-priority-queue.js` | `createRmtQueue` | Prioritized runtime work |
| `renderman-diagnostics-hub.js` | `createRmtDiagnosticsHub` | Diagnostics publication, subscription and bounded event flow |
| `renderman-command-bus.js` | `createRmtCommandBus` | Command dispatch |
| `renderman-reactivity.js` | `createRmtReactivity` | State and resource reactivity |
| `renderman-policy-parity.js` | `createRmtKernelPolicyParity` | Compile/runtime policy parity and security regression surface |
| `renderman-browser-host-adapter.js` | `createRmtBrowserHostAdapter` | Host timers, idle callbacks, animation frames, DOM events and AbortController |
| `renderman-performance-runtime.js` | `createRmtPerformanceRuntime` | Budgets, backpressure profiles, browser signals, CI artifacts and trend reports |
| `renderman-rmt-format.js` | `createRmtFormat` | RMT normalization plus XRouter, component, surface and scheduler adapters |
| `renderman-template-registry.js` | `createRmtTemplateRegistry` | Template and document registry |
| `renderman-template-loader.js` | `createRmtTemplateLoader` | RMT source loading |
| `renderman-template-compiler.js` | `createRmtTemplateCompiler` | Prepared documents, templates, fingerprints and dependency refs |
| `renderman-template-artifacts.js` | `createRmtTemplateArtifacts` | Artifact bundles, runtime profile hints and registerable prepared documents |
| `renderman-template-runtime-renderer.js` | `createRmtTemplateRuntimeRenderer` | Runtime bindings, Trusted DOM, panic and recovery |
| `renderman-template-execution-path.js` | `createRmtTemplateExecutionPath` | Execution plans, prerender chunks, hydration, trust verdicts and recovery |
| `renderman-template-transport-adapters.js` | `createRmtTemplateWorkerAdapter`, `createRmtTemplateServerAdapter` | Worker/server prerender envelopes, supersession and hydrate response handling |
| `renderman-prewarm-worker-source.js` | `createRmtPrewarmWorkerSourceBuilder` | Browser worker source for template prewarm |
| `renderman-prewarm-worker-runtime.js` | `createRmtPrewarmWorkerRuntime` | Template sync, worker health, prerender dispatch and topology snapshots |
| `renderman-public-api.js` | `createRmtCore`, `createRmtDomCompat`, `createRmtTemplateApi` | Public API, DOM compatibility and template API composition |
| `renderman-browser-runtime.js` | `createRmtBrowserRuntime`, `createRmtRuntime` | Browser runtime, mount, hydrate, render, prerender, performance delegation and prewarm integration |
| `renderman-detached-dom-runtime.js` | `createRmtDetachedRuntime` | Detached DOM runtime for host-neutral execution |
| `renderman-worker-prerender-runtime.js` | `createRmtWorkerPrerenderRuntime`, `createRmtWorkerRuntime` | Worker prerender and hydration runtime |
| `renderman-server-prerender-runtime.js` | `createRmtServerPrerenderRuntime`, `createRmtServerRuntime` | Server prerender and hydration runtime |
| `renderman-product-surface.js` | `createRmtProductSurface`, `installRmtProductSurface` | Product facade, entry-point inventory and browser global installer |

## Current Utilization

| Interface | Current XTend status |
| --- | --- |
| `createRmtRuntime`, `createRmtCore` | Active in Maraca, kernel orchestration and compatibility tests |
| `createRmtFormat` and native adapters | Heavily used by parsing, surface, component and lifecycle suites |
| `createRmtStateSchedulerDiagnosticsBridge` | Active in Maraca, Fabric diagnostics, telemetry and backpressure tests |
| `createRmtPerformanceRuntime` | Present in Maraca and kernel orchestration; advanced reports are still underused |
| `createRmtTemplateExecutionPath` | Used in kernel security tests, not yet broad production evidence |
| `createRmtKernelPolicyParity` | Used in focused gates, not yet as an end-to-end release constraint |
| `createRmtProductSurface` | Exported and documented, while Maraca still boots several factories directly |
| `createRmtTemplateArtifacts` | Exported, typed and production-ready, but not yet used as the Maraca artifact pipeline |
| Worker/server prerender runtimes | Exported and typed, not yet active in product flows |
| `createRmtPrewarmWorkerRuntime` | Browser runtime can compose it, but XTend does not yet use it as a Warm Reentry path |
| `createRmtDetachedRuntime` | Exported, but not yet the standard runtime for deterministic gates |
| `createRmtDomCompat` | Exported, while Surface Manager and Surface Adapter still own most DOM lifecycle rules locally |

## Underused Potential

| Potential | Kernel capability | Recommended hardening |
| --- | --- | --- |
| Product-surface bootstrap | `createRmtProductSurface()` inventories runtime, core, performance, template and transport factories | Boot Maraca and the kernel orchestrator through Product Surface optionally, then expose entry points in bundle reports |
| Source-to-Sea template artifacts | `createRmtTemplateArtifacts()` creates fingerprints and runtime profile hints | Add `templateArtifacts` to Maraca reports and connect fingerprints to surface/resource evidence |
| Warm Reentry | Prewarm worker, worker topology and performance backpressure profiles | Introduce route and surface reentry as an opt-in prewarm path |
| Detached runtime testing | `createRmtDetachedRuntime()` provides browser-runtime semantics without live DOM | Make lifecycle, telemetry and resource-release gates more deterministic |
| DOM compatibility | `createRmtDomCompat()` knows ownership modes and island mount/unmount | Validate Surface Manager destroy semantics against shared DOM contracts |
| Performance evidence | CI summaries, baselines, trendlines and file artifacts | Enrich Maraca production reports with budget, baseline and backpressure evidence |
| Panic and recovery | Execution path and runtime renderer expose trust verdicts, panic events and recovery outcomes | Surface security and recovery records in Fabric telemetry and Maraca lifecycle reports |

## Layer Map

| XTend layer | Preferred kernel interface | Why it matters |
| --- | --- | --- |
| RMT tooling | `createRmtFormat()`, `createRmtTemplateCompiler()`, `createRmtTemplateArtifacts()` | Normalized records, prepared templates and stable artifacts |
| Kernel runtime | `createRmtCore()`, `createRmtRuntime()`, `createRmtPerformanceRuntime()` | Host-neutral scheduling, lifecycle, diagnostics and performance semantics |
| Fabric | `createRmtStateSchedulerDiagnosticsBridge()`, performance samples | Compatible lane, fiber and backpressure telemetry |
| UI/surface layer | `createRmtSurfaceAdapter()`, `createRmtDomCompat()` | Contract-driven open/close/destroy/focus and ownership modes |
| Maraca | `createRmtProductSurface()`, template artifact APIs, performance APIs | Product-wide bootstrap with bundle evidence and entry-point checks |
| SSR/worker/prewarm | Worker/server transport adapters, prerender runtimes, prewarm worker runtime | Moves expensive template work out of visible lanes |
| App Runtime | `createRmtAppRuntime()`, command, stream and reducer APIs | Connects host services and app actions to Fabric and kernel diagnostics |

## Next Step

The [RMT Kernel Feature Adoption Evaluation](./rmt-kernel-feature-adoption-evaluation.md) evaluates the underused modules one by one and names concrete hooks in Maraca, Fabric, App Runtime, Surface Manager and tests.
