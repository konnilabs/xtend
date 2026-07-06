# RMT Kernel Topography Map

Stand: 2026-06-19

Diese Karte beschreibt den gebündelten RMT Kernel im XTend-Stack. Der Kernel stammt aus ehemals einzelnen Modulen und liegt heute vor allem in `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-core.esm.js` und `xtendrmt/rmt-runtime.browser.js`. `xtendrmt/rmt-app-runtime.js` bleibt eine kernelnahe App-Runtime-Schicht für Commands, Host Services, Streams, Reducer und Fabric-Integration.

KernelLab in XTend Scaffold ist der kontrollierte Analyse- und Clean-Build-Pfad fuer dieses Bundle. `xt kernel-lab analyze --json` schreibt `xtendrmt/rmt-kernel-module-manifest.json`; `xt kernel-lab build --profile clean --check --json` prueft, dass der Standardkernel frei von alten Dashboard-Compat-Factories bleibt. Release-Builds koennen `--version <semver>` setzen, damit Header, Runtime-API-Version, Typen und Manifest synchron bleiben.

## Zweck

Die Map beantwortet drei Fragen:

- Welche Funktionsflächen sind im Kernel vorhanden?
- Welche davon werden im XTend-Stack bereits direkt genutzt?
- Wo liegen noch nicht ausgeschöpfte Potenziale für Maraca, Fabric, App Runtime und Surface Manager?

Die Modulbewertung blendet generierte Produkt-Bundles und Build-Kopien aus. Diese belegen Artefakt-Parität, aber keine eigenständige Framework-Integration.

KernelLab gleicht aktuell die historische Erwartung von 26 Modulen mit den 25 sichtbaren Bundle-Wrappern ab und haelt diese Abweichung als Report-Metadatum fest, statt sie als stille Build-Wahrheit zu behandeln.

## Bundle-Topologie

| Bundle-Modul | Primäre Factory | Funktionsfläche |
| --- | --- | --- |
| `rmt-engine.js` | `createRmtEngine` | Root Lifecycle, Scheduler-Integration, Resources, Commands, Reaktivität und Runtime State |
| `rmt-priority-queue.js` | `createRmtQueue` | Priorisierte Runtime-Arbeit |
| `rmt-diagnostics-hub.js` | `createRmtDiagnosticsHub` | Diagnostics-Publikation, Subscription und begrenzte Event-Flüsse |
| `rmt-command-bus.js` | `createRmtCommandBus` | Command Dispatch |
| `rmt-reactivity.js` | `createRmtReactivity` | State- und Resource-Reaktivität |
| `rmt-policy-parity.js` | `createRmtKernelPolicyParity` | Compile-/Runtime-Policy-Parität und Security-Regressionen |
| `rmt-browser-host-adapter.js` | `createRmtBrowserHostAdapter` | Host Timer, Idle Callbacks, Animation Frames, DOM Events und AbortController |
| `rmt-performance-runtime.js` | `createRmtPerformanceRuntime` | Budgets, Backpressure-Profile, Browser-Signale, CI-Artefakte und Trend-Reports |
| `rmt-format.js` | `createRmtFormat` | RMT-Normalisierung plus XRouter-, Component-, Surface- und Scheduler-Adapter |
| `rmt-template-registry.js` | `createRmtTemplateRegistry` | Template- und Document-Registry |
| `rmt-template-loader.js` | `createRmtTemplateLoader` | RMT-Source-Laden |
| `rmt-template-compiler.js` | `createRmtTemplateCompiler` | Prepared Documents, Templates, Fingerprints und Dependency Refs |
| `rmt-template-artifacts.js` | `createRmtTemplateArtifacts` | Artifact Bundles, Runtime Profile Hints und registerbare Prepared Documents |
| `rmt-template-runtime-renderer.js` | `createRmtTemplateRuntimeRenderer` | Runtime Bindings, Trusted DOM, Panic und Recovery |
| `rmt-template-execution-path.js` | `createRmtTemplateExecutionPath` | Execution Plans, Prerender Chunks, Hydration, Trust Verdicts und Recovery |
| `rmt-template-transport-adapters.js` | `createRmtTemplateWorkerAdapter`, `createRmtTemplateServerAdapter` | Worker-/Server-Prerender-Envelopes, Supersession und Hydrate Response Handling |
| `rmt-prewarm-worker-source.js` | `createRmtPrewarmWorkerSourceBuilder` | Browser Worker Source für Template Prewarm |
| `rmt-prewarm-worker-runtime.js` | `createRmtPrewarmWorkerRuntime` | Template Sync, Worker Health, Prerender Dispatch und Topologie-Snapshots |
| `rmt-public-api.js` | `createRmtCore`, `createRmtDomCompat`, `createRmtTemplateApi` | Public API, DOM Compatibility und Template API Composition |
| `rmt-browser-runtime.js` | `createRmtBrowserRuntime`, `createRmtRuntime` | Browser Runtime, Mount, Hydrate, Render, Prerender, Performance Delegation und Prewarm-Integration |
| `rmt-detached-dom-runtime.js` | `createRmtDetachedRuntime` | Detached DOM Runtime für hostneutrale Ausführung |
| `rmt-worker-prerender-runtime.js` | `createRmtWorkerPrerenderRuntime`, `createRmtWorkerRuntime` | Worker-Prerender- und Hydration-Runtime |
| `rmt-server-prerender-runtime.js` | `createRmtServerPrerenderRuntime`, `createRmtServerRuntime` | Server-Prerender- und Hydration-Runtime |
| `rmt-product-surface.js` | `createRmtProductSurface`, `installRmtProductSurface` | Produktfassade, Entry-Point-Inventar und Browser Global Installer |

## Aktuelle Nutzung

| Interface | Aktueller XTend-Status |
| --- | --- |
| `createRmtRuntime`, `createRmtCore` | Aktiv in Maraca, Kernel-Orchestration und Kompatibilitätstests |
| `createRmtFormat` und native Adapter | Stark genutzt in Parsing-, Surface-, Component- und Lifecycle-Suites |
| `createRmtStateSchedulerDiagnosticsBridge` | Aktiv in Maraca, Fabric Diagnostics, Telemetry und Backpressure-Tests |
| `createRmtPerformanceRuntime` | Vorhanden in Maraca und Kernel-Orchestration; Advanced Reports sind noch zu wenig genutzt |
| `createRmtTemplateExecutionPath` | In Kernel-Security-Tests genutzt, noch nicht als breite Produktions-Evidence |
| `createRmtKernelPolicyParity` | In dedizierten Gates genutzt, noch nicht als durchgängige Release-Prüfung |
| `createRmtProductSurface` | Exportiert und dokumentiert, Maraca bootet aber noch mehrere Factories direkt |
| `createRmtTemplateArtifacts` | Exportiert, typisiert und produktfähig, aber noch nicht als Maraca-Artefaktpipeline genutzt |
| Worker-/Server-Prerender-Runtimes | Exportiert und typisiert, in Produktflüssen noch nicht aktiv |
| `createRmtPrewarmWorkerRuntime` | Browser Runtime kann sie komponieren, XTend nutzt sie noch nicht als Warm-Reentry-Pfad |
| `createRmtDetachedRuntime` | Exportiert, aber noch nicht als Standard für deterministische Runtime-Gates eingesetzt |
| `createRmtDomCompat` | Exportiert, aber Surface Manager und Surface Adapter tragen Ownership-Logik noch weitgehend selbst |

## Untergenutzte Potenziale

| Potenzial | Kernel-Fähigkeit | Empfohlene Härtung |
| --- | --- | --- |
| Product-Surface-Bootstrap | `createRmtProductSurface()` inventarisiert Runtime-, Core-, Performance-, Template- und Transport-Factories | Maraca und Kernel-Orchestrator optional über Product Surface booten und Entry Points im Bundle Report ausweisen |
| Source-to-Sea Template Artifacts | `createRmtTemplateArtifacts()` erzeugt Fingerprints und Runtime Profile Hints | Maraca Reports um `templateArtifacts` erweitern und Fingerprints mit Surface-/Resource-Evidence verbinden |
| Warm Reentry | Prewarm Worker, Worker Topology und Performance Backpressure Profile | Route- und Surface-Reentry als opt-in Prewarm-Pfad einführen |
| Detached Runtime Testing | `createRmtDetachedRuntime()` stellt Browser-Runtime-Semantik ohne Live-DOM bereit | Lifecycle-, Telemetry- und Resource-Release-Gates deterministischer machen |
| DOM Compatibility | `createRmtDomCompat()` kennt Ownership Modes und Island Mount/Unmount | Surface Manager Destroy-Semantik gegen gemeinsame DOM-Contracts prüfen |
| Performance Evidence | CI Summary, Baselines, Trendlines und File Artifacts | Maraca PROD Reports mit Budget-, Baseline- und Backpressure-Evidence anreichern |
| Panic und Recovery | Execution Path und Runtime Renderer liefern Trust Verdicts, Panic Events und Recovery Outcomes | Fabric Telemetry und Maraca Lifecycle Reports mit Security-/Recovery-Daten erweitern |

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

## Nächster Schritt

Die [RMT Kernel Feature Adoption Evaluation](./rmt-kernel-feature-adoption-evaluation.md) bewertet die untergenutzten Module einzeln und benennt konkrete Einhängepunkte in Maraca, Fabric, App Runtime, Surface Manager und Tests.
