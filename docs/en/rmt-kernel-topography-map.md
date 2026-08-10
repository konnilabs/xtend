# RMT Kernel Topography Map

Updated: 2026-08-02

This map describes the canonical RMT kernel sources used by the XTend stack. `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-core.esm.js`, and `xtendrmt/rmt-runtime.browser.js` are generated delivery artifacts, not build inputs. The source of truth is `xtendrmt/kernel/rmt-kernel-sources.json` together with the independent sources under `xtendrmt/` and `xtendrmt/kernel/modules/`.

KernelLab in XTend Scaffold is both the source assembler and the mandatory MVC gate. `xt kernel-lab analyze --json` checks roles, ports, capabilities, dependencies, and ownership without changing outputs. `xt kernel-lab build --profile clean --write --json` generates runtime, type, schema, and manifest artifacts together; `--check` detects drift. Release builds can pass `--version <semver>` so headers, runtime API version, types, and manifests stay synchronized.

## Purpose

The map answers three questions:

- Which functional surfaces already exist in the kernel?
- Which of them are currently used directly by the XTend stack?
- Which underused surfaces could improve Maraca, Fabric, App Runtime and Surface Manager?

Generated product bundles and build copies are excluded from the adoption assessment. They prove artifact parity, but not separate framework integration.

Module count, order, targets, exports, and hashes are derived from the source manifest. There is no separately maintained historical module count. Every entry declares exactly one MVC role (`shared`, `model`, `view`, `controller`, `adapter`, or `composition`), its ports, adapter direction, capabilities, and ownership domains. Illegal layer edges, cycles, duplicate providers, competing owners, and undeclared capabilities block a release build.

## Canonical Source Topology

| Bundle module | Primary factory | Function surface |
| --- | --- | --- |
| `rmt-engine.js`, `rmt-engine-controller.js`, `rmt-engine-host-adapter.js` | `createRmtEngine` | Thin composition root, command/scheduler controller, and separate host adapter for timing and events |
| `rmt-priority-queue.js` | `createRmtQueue` | Prioritized runtime work |
| `rmt-diagnostics-hub.js` | `createRmtDiagnosticsHub` | Diagnostics publication, subscription and bounded event flow |
| `rmt-command-bus.js` | `createRmtCommandBus` | Command dispatch |
| `rmt-reactivity.js` | `createRmtReactivity` | State and resource reactivity |
| `rmt-policy-parity.js` | `createRmtKernelPolicyParity` | Compile/runtime policy parity and security regression surface |
| `rmt-browser-host-adapter.js` | `createRmtBrowserHostAdapter` | Host timers, idle callbacks, animation frames, DOM events and AbortController |
| `rmt-performance-runtime.js` | `createRmtPerformanceRuntime` | Budgets, backpressure profiles, browser signals, CI artifacts and trend reports |
| `rmt-dom-descriptor-renderer.js` | `createRmtDomDescriptorRenderer` | The only normal UI DOM commit port and producer of validated application binding records |
| `rmt-format.js` | `createRmtFormat` | Pure format model for RMT normalization and reference graphs |
| `rmt-input-routing-controller.js` | `createRmtXRouterAdapter` | Input/routing controller over route and navigation ports |
| `rmt-xtend-component-adapter.js` | `createRmtXtendComponentAdapter` | Component output adapter and lifecycle telemetry |
| `rmt-surface-adapter.js` | `createRmtSurfaceAdapter` | Surface projection through descriptor and lifecycle ports |
| `rmt-state-telemetry-adapter.js` | `createRmtStateSchedulerDiagnosticsBridge` | State/scheduler telemetry output adapter |
| `rmt-template-registry.js` | `createRmtTemplateRegistry` | Template and document registry |
| `rmt-template-loader.js` | `createRmtTemplateLoader` | RMT source loading |
| `rmt-template-binding-model.js` | `createRmtTemplateBindingModel` | Host- and DOM-free binding normalization |
| `rmt-template-compiler.js` | `createRmtTemplateCompiler` | Prepared documents, templates, fingerprints, and dependency refs over binding/clock ports |
| `rmt-template-artifacts.js` | `createRmtTemplateArtifacts` | Deterministic artifact bundles and runtime profile hints |
| `rmt-template-runtime-renderer.js` | `createRmtTemplateRuntimeRenderer` | Runtime bindings, Trusted DOM, panic and recovery |
| `rmt-template-trust-model.js`, `rmt-template-recovery-model.js` | Trust/recovery ports | Deterministic trust, sanitize, panic, and recovery models |
| `rmt-template-execution-model.js` | Execution model port | Host- and DOM-free execution and hydration plans |
| `rmt-template-interaction-adapter.js` | Interaction/DOM ports | DOM and host interactions as adapters |
| `rmt-template-execution-controller.js` | Execution controller port | Orchestrates model and adapters without a concrete View dependency |
| `rmt-template-execution-path.js` | `createRmtTemplateExecutionPath` | Thin composition root for execution, trust, recovery, and interaction |
| `rmt-template-transport-adapters.js` | `createRmtTemplateWorkerAdapter`, `createRmtTemplateServerAdapter` | Worker/server prerender envelopes, supersession and hydrate response handling |
| `rmt-prewarm-worker-source.js` | `createRmtPrewarmWorkerSourceBuilder` | Browser worker source for template prewarm |
| `rmt-prewarm-worker-runtime.js` | `createRmtPrewarmWorkerRuntime` | Template sync, worker health, prerender dispatch and topology snapshots |
| `rmt-dom-compat-view-adapter.js` | `createRmtDomCompat` | DOM compatibility as an explicit View adapter |
| `rmt-public-island-controller.js` | Island/root lifecycle ports | Controller for public island lifecycle operations |
| `rmt-public-api.js` | `createRmtCore`, `createRmtTemplateApi` | Thin public API composition without its own DOM or host logic |
| `rmt-browser-runtime.js` | `createRmtBrowserRuntime`, `createRmtRuntime` | Browser runtime, mount, hydrate, render, prerender, performance delegation and prewarm integration |
| `rmt-detached-dom-runtime.js` | `createRmtDetachedRuntime` | Detached DOM runtime for host-neutral execution |
| `rmt-worker-prerender-runtime.js` | `createRmtWorkerPrerenderRuntime`, `createRmtWorkerRuntime` | Worker prerender and hydration runtime |
| `rmt-server-prerender-runtime.js` | `createRmtServerPrerenderRuntime`, `createRmtServerRuntime` | Server prerender and hydration runtime |
| `rmt-product-surface.js` | `createRmtProductSurface`, `installRmtProductSurface` | Product facade, entry-point inventory and browser global installer |

## Current Utilization

| Interface | Current XTend status |
| --- | --- |
| `createRmtRuntime`, `createRmtCore` | Active in Maraca, kernel orchestration and compatibility tests |
| `createRmtFormat` and split native adapters | Heavily used by parsing, surface, component, and lifecycle suites; Model, Controller, and output adapters are physically separate |
| `createRmtStateSchedulerDiagnosticsBridge` | Active in Maraca, Fabric diagnostics, telemetry and backpressure tests |
| `createRmtPerformanceRuntime` | Present in Maraca and kernel orchestration; advanced reports are still underused |
| `createRmtTemplateExecutionPath` | Used in kernel security tests, not yet broad production evidence |
| `createRmtKernelPolicyParity` | Used in focused gates, not yet as an end-to-end release constraint |
| `createRmtProductSurface` | Exported and documented, while Maraca still boots several factories directly |
| `createRmtTemplateArtifacts` | Exported, typed and production-ready, but not yet used as the Maraca artifact pipeline |
| Worker/server prerender runtimes | Exported and typed, not yet active in product flows |
| `createRmtPrewarmWorkerRuntime` | Browser runtime can compose it, but XTend does not yet use it as a Warm Reentry path |
| `createRmtDetachedRuntime` | Exported, but not yet the standard runtime for deterministic gates |
| `createRmtDomCompat` | Exported as its own View adapter; Surface lifecycle belongs to the Surface Controller and DOM ownership to the descriptor renderer |

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
