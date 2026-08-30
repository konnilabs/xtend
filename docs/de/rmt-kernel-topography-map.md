# RMT Kernel Topography Map

Stand: 2026-08-30

Diese Karte beschreibt die kanonischen RMT-Kernelquellen im XTend-Stack. `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-core.esm.js` und `xtendrmt/rmt-runtime.browser.js` sind erzeugte Auslieferungsartefakte, keine Build-Eingaben. Source of Truth ist `xtendrmt/kernel/rmt-kernel-sources.json` mit den eigenständigen Quellen unter `xtendrmt/` und `xtendrmt/kernel/modules/`.

KernelLab in XTend Scaffold ist Source-Assembler und verbindliches MVC-Gate. `xt kernel-lab analyze --json` prüft Rollen, Ports, Capabilities, Abhängigkeiten und Ownership, ohne Ausgaben zu verändern. `xt kernel-lab build --profile clean --write --json` erzeugt Runtime-, Typ-, Schema- und Manifest-Artefakte gemeinsam; `--check` weist Drift nach. Release-Builds können `--version <semver>` setzen, damit Header, Runtime-API-Version, Typen und Manifest synchron bleiben.

## Zweck

Die Map beantwortet drei Fragen:

- Welche Funktionsflächen sind im Kernel vorhanden?
- Welche davon werden im XTend-Stack bereits direkt genutzt?
- Wo liegen noch nicht ausgeschöpfte Potenziale für Maraca, Fabric, App Runtime und Surface Manager?

Die Modulbewertung blendet generierte Produkt-Bundles und Build-Kopien aus. Diese belegen Artefakt-Parität, aber keine eigenständige Framework-Integration.

Modulzahl, Reihenfolge, Targets, Exports und Hashes werden aus dem Source-Manifest abgeleitet. Es gibt keine separat gepflegte historische Modulzahl. Jeder Eintrag deklariert genau eine MVC-Rolle (`shared`, `model`, `view`, `controller`, `adapter` oder `composition`), seine Ports, Adapterrichtung, Capabilities und Ownership-Domänen. Illegale Schichtkanten, Zyklen, doppelte Provider, konkurrierende Owner und nicht deklarierte Fähigkeiten blockieren den Release-Build.

## Kanonische Source-Topologie

| Bundle-Modul | Primäre Factory | Funktionsfläche |
| --- | --- | --- |
| `rmt-kernel-scheduler.js` (separates `./kernel-scheduler`-Artefakt) | `createRmtKernelScheduler` | Hostneutrale Queue, Job-Lifecycle, Yield, Cancellation, Diagnostics und Scheduler-Host-Port |
| `rmt-engine.js`, `rmt-engine-controller.js`, `rmt-engine-host-adapter.js` | `createRmtEngine` | Root-, Ressourcen-, Command- und Binding-Services, die UI-Arbeit an den injizierten Microkernel-Scheduler delegieren |
| `rmt-diagnostics-hub.js` | `createRmtDiagnosticsHub` | Diagnostics-Publikation, Subscription und begrenzte Event-Flüsse |
| `rmt-command-bus.js` | `createRmtCommandBus` | Command Dispatch |
| `rmt-reactivity.js` | `createRmtReactivity` | State- und Resource-Reaktivität |
| `rmt-policy-parity.js` | `createRmtKernelPolicyParity` | Compile-/Runtime-Policy-Parität und Security-Regressionen |
| `rmt-browser-host-adapter.js` | `createRmtBrowserHostAdapter` | Host Timer, Idle Callbacks, Animation Frames, DOM Events und AbortController |
| `rmt-performance-runtime.js` | `createRmtPerformanceRuntime` | Budgets, Backpressure-Profile, Browser-Signale, CI-Artefakte und Trend-Reports |
| `rmt-dom-descriptor-renderer.js` | `createRmtDomDescriptorRenderer` | Einziger DOM-Commit-Port für normale UI-Projektion und validierte Application-Binding-Records |
| `rmt-format.js` | `createRmtFormat` | Reines Format-Model für RMT-Normalisierung und Referenzgraphen |
| `rmt-input-routing-controller.js` | `createRmtXRouterAdapter` | Input-/Routing-Controller über Route- und Navigation-Ports |
| `rmt-xtend-component-adapter.js` | `createRmtXtendComponentAdapter` | Component-Output-Adapter und Lifecycle-Telemetry |
| `rmt-surface-adapter.js` | `createRmtSurfaceAdapter` | Surface-Projektion über Descriptor- und Lifecycle-Ports |
| `rmt-state-telemetry-adapter.js` | `createRmtStateSchedulerDiagnosticsBridge` | State-/Scheduler-Telemetry als Output-Adapter |
| `rmt-template-registry.js` | `createRmtTemplateRegistry` | Template- und Document-Registry |
| `rmt-template-loader.js` | `createRmtTemplateLoader` | RMT-Source-Laden |
| `rmt-template-binding-model.js` | `createRmtTemplateBindingModel` | Host- und DOM-freie Binding-Normalisierung |
| `rmt-template-compiler.js` | `createRmtTemplateCompiler` | Prepared Documents, Templates, Fingerprints und Dependency Refs über Binding-/Clock-Ports |
| `rmt-template-artifacts.js` | `createRmtTemplateArtifacts` | Deterministische Artifact Bundles und Runtime Profile Hints |
| `rmt-template-runtime-renderer.js` | `createRmtTemplateRuntimeRenderer` | Runtime Bindings, Trusted DOM, Panic und Recovery |
| `rmt-template-trust-model.js`, `rmt-template-recovery-model.js` | Trust-/Recovery-Ports | Deterministische Trust-, Sanitize-, Panic- und Recovery-Modelle |
| `rmt-template-execution-model.js` | Execution-Model-Port | Host- und DOM-freie Execution- und Hydration-Pläne |
| `rmt-template-interaction-adapter.js` | Interaction-/DOM-Ports | DOM- und Host-Interaktionen als Adapter |
| `rmt-template-execution-controller.js` | Execution-Controller-Port | Orchestriert Model und Adapter ohne konkrete View-Abhängigkeit |
| `rmt-template-execution-path.js` | `createRmtTemplateExecutionPath` | Schlanker Composition Root für Execution, Trust, Recovery und Interaction |
| `rmt-template-transport-adapters.js` | `createRmtTemplateWorkerAdapter`, `createRmtTemplateServerAdapter` | Worker-/Server-Prerender-Envelopes, Supersession und Hydrate Response Handling |
| `rmt-prewarm-worker-source.js` | `createRmtPrewarmWorkerSourceBuilder` | Browser Worker Source für Template Prewarm |
| `rmt-prewarm-worker-runtime.js` | `createRmtPrewarmWorkerRuntime` | Template Sync, Worker Health, Prerender Dispatch und Topologie-Snapshots |
| `rmt-dom-compat-view-adapter.js` | `createRmtDomCompat` | DOM-Compatibility als expliziter View-Adapter |
| `rmt-public-island-controller.js` | Island-/Root-Lifecycle-Ports | Controller für öffentliche Island-Lifecycle-Operationen |
| `rmt-public-api.js` | `createRmtCore`, `createRmtTemplateApi` | Schlanke Public-API-Composition ohne eigene DOM- oder Host-Logik |
| `rmt-browser-runtime.js` | `createRmtBrowserRuntime`, `createRmtRuntime` | Browser Runtime, Mount, Hydrate, Render, Prerender, Performance Delegation und Prewarm-Integration |
| `rmt-detached-dom-runtime.js` | `createRmtDetachedRuntime` | Detached DOM Runtime für hostneutrale Ausführung |
| `rmt-worker-prerender-runtime.js` | `createRmtWorkerPrerenderRuntime`, `createRmtWorkerRuntime` | Worker-Prerender- und Hydration-Runtime |
| `rmt-server-prerender-runtime.js` | `createRmtServerPrerenderRuntime`, `createRmtServerRuntime` | Server-Prerender- und Hydration-Runtime |
| `rmt-product-surface.js` | `createRmtProductSurface`, `installRmtProductSurface` | Produktfassade, Entry-Point-Inventar und Browser Global Installer |

## Aktuelle Nutzung

| Interface | Aktueller XTend-Status |
| --- | --- |
| `createRmtRuntime`, `createRmtCore` | Aktiv in Maraca, Kernel-Orchestration und Kompatibilitätstests |
| `createRmtFormat` und getrennte native Adapter | Stark genutzt in Parsing-, Surface-, Component- und Lifecycle-Suites; Model, Controller und Output-Adapter sind physisch getrennt |
| `createRmtStateSchedulerDiagnosticsBridge` | Aktiv in Maraca, Fabric Diagnostics, Telemetry und Backpressure-Tests |
| `createRmtPerformanceRuntime` | Aktiv in Maraca, Kernel-Orchestration, Fabric-Backpressure und der Retained-Warm-Reuse-Release-Baseline |
| `createRmtTemplateExecutionPath` | Aktiv in Security-Gates; redigierte Panic-/Recovery-Lifecycles werden in Fabric Diagnostics projiziert |
| `createRmtKernelPolicyParity` | Aktiv in Strict-Maraca- und Release-Parity-Gates |
| `createRmtProductSurface` | Expliziter Opt-in-Service; direkte Microkernel-Composition bleibt Default und ESM-Importe haben keinen Boot-Side-Effect |
| `createRmtTemplateArtifacts` | Exportiert, typisiert und in Maraca Build-/Report-Evidence abgebildet |
| Worker-/Server-Prerender-Runtimes | Exportiert, typisiert und capability-gated optionale Services |
| `createRmtPrewarmWorkerRuntime` | Explizites Opt-in, standardmaessig deaktiviert, bei kritischer Backpressure pausiert und invalidiert |
| `createRmtDetachedRuntime` | In deterministischen Lifecycle-, Telemetry- und Resource-Release-Gates aktiv |
| `createRmtDomCompat` | Als eigener View-Adapter aktiv; Surface-Lifecycle bleibt beim Surface Controller und DOM-Ownership beim Descriptor Renderer |

## Abschluss der Adoption

| Potenzial | Kernel-Fähigkeit | Empfohlene Härtung |
| --- | --- | --- |
| Product-Surface-Bootstrap | `createRmtProductSurface()` inventarisiert Runtime-, Core-, Performance-, Template- und Transport-Factories | Als expliziter Opt-in-Service abgeschlossen; direkte Microkernel-Composition ist Default |
| Source-to-Sea Template Artifacts | `createRmtTemplateArtifacts()` erzeugt Fingerprints und Runtime Profile Hints | Maraca Reports um `templateArtifacts` erweitern und Fingerprints mit Surface-/Resource-Evidence verbinden |
| Warm Reentry | Prewarm Worker, Worker Topology und Performance Backpressure Profile | Mit 32-Eintraegen/zwei Generationen, Critical-Pressure-Invalidierung und Chromium-p95-Release-Gate abgeschlossen |
| Detached Runtime Testing | `createRmtDetachedRuntime()` stellt Browser-Runtime-Semantik ohne Live-DOM bereit | Lifecycle-, Telemetry- und Resource-Release-Gates deterministischer machen |
| DOM Compatibility | `createRmtDomCompat()` kennt Ownership Modes und Island Mount/Unmount | Surface Manager Destroy-Semantik gegen gemeinsame DOM-Contracts prüfen |
| Performance Evidence | CI Summary, Baselines, Trendlines und File Artifacts | Maraca PROD Reports mit Budget-, Baseline- und Backpressure-Evidence anreichern |
| Panic und Recovery | Execution Path und Runtime Renderer liefern Trust Verdicts, Panic Events und Recovery Outcomes | Mit redigierter Diagnostics-Lane-Projektion abgeschlossen; sensitive Payloads verbleiben im Kernel |

## Layer Map

| XTend-Schicht | Bevorzugtes Kernel-Interface | Nutzen |
| --- | --- | --- |
| RMT Tooling | `createRmtFormat()`, `createRmtTemplateCompiler()`, `createRmtTemplateArtifacts()` | Normalisierte Records, Prepared Templates und stabile Artefakte |
| Kernel Runtime | `createRmtCore()`, `createRmtRuntime()`, `createRmtPerformanceRuntime()` | Hostneutrale Scheduling-, Lifecycle-, Diagnostics- und Performance-Semantik |
| Fabric | `createRmtStateSchedulerDiagnosticsBridge()`, Performance Samples | Kompatible Lane-, Fiber- und Backpressure-Telemetry |
| UI/Surface Layer | `createRmtSurfaceAdapter()`, `createRmtDomCompat()` | Contract-driven Open/Close/Destroy/Focus und Ownership Modes |
| Maraca | `createRmtProductSurface()`, Template Artifact APIs, Performance APIs | Produktweiter Bootstrap mit Bundle Evidence und Entry-Point-Prüfung |
| SSR/Worker/Prewarm | Worker-/Server-Transport-Adapter, Prerender-Runtimes, Prewarm Worker Runtime | Teure Template-Arbeit aus sichtbaren Lanes herauslösen |
| App Runtime | `createRmtAppRuntime()`, Command-, Stream- und Reducer-APIs | Host Services und App-Aktionen mit Fabric- und Kernel-Diagnostics verbinden |

## Release-Referenz

Die [RMT Kernel Feature Adoption Evaluation](./rmt-kernel-feature-adoption-evaluation.md) dokumentiert die abgeschlossenen Tracks. Breaking Changes stehen im [0.8-Migrationsleitfaden](./rmt-kernel-0-8-migration.md).
