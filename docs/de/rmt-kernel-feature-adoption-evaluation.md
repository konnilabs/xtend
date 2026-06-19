# RMT Kernel Feature Adoption Evaluation

Stand: 2026-06-19

Diese Evaluation baut auf der [RMT Kernel Topography Map](./rmt-kernel-topography-map.md) auf. Die Topography Map zeigt, welche Kernel-Flächen vorhanden sind. Dieses Dokument bewertet die bisher wenig genutzten Module: Ist das Modul für XTend nützlich, und falls ja, wo sollte es im Framework eingehängt werden?

## Executive Summary

Die wenig genutzten Kernel-Features sind größtenteils nicht obsolet. Sie stammen teilweise aus einer offline-only `file://` App, passen aber gut zu XTends Architektur, wenn sie optional, beobachtbar und strikt contract-gebunden integriert werden.

Die größten Hebel sind:

- **Warm Reentry und Prewarm Worker**: Sehr sinnvoll für Produktions-Apps, wenn wiederkehrende Routen, Surfaces oder Shell-Inhalte vorab in Worker-Chunks vorbereitet werden können.
- **Template Artifacts**: Sehr sinnvoll als Source-to-Sea-Evidence, Fingerprint- und Bundle-Report-Schicht.
- **Performance Runtime Advanced APIs**: Sehr sinnvoll für CI Summaries, Baselines, Trendlines und Backpressure-Profile.
- **Detached Runtime**: Sehr sinnvoll für deterministische Lifecycle-, Telemetry- und Resource-Release-Gates.
- **DOM Compat**: Sinnvoll als gemeinsame Ownership- und Island-Contract-Schicht für Surface Manager und RMT Surface Adapter.
- **Worker/Server Prerender Transports**: Sinnvoll, aber stufenweise. Worker-Prerender ist naheliegend für browser-only und offline-fähige Apps; Server-Prerender sollte mit vorhandenen Node/PHP SSR-Adaptern verbunden werden.

Nicht empfohlen ist eine sofortige globale Aktivierung aller Module. Die sinnvolle Linie ist: erst Build- und Report-Evidence, dann opt-in Runtime-Schalter, danach gezielte Produktionspfade.

## Bewertungsmatrix

| Kernel-Modul / API | Nützlich für XTend? | Bewertung | Empfohlene Einhängepunkte |
| --- | --- | --- | --- |
| `createRmtProductSurface()` | Ja | Hoher Strukturgewinn, weil Product Surface alle Runtime-, Core-, Template-, Transport- und Compat-Factories inventarisierbar macht | `xtend-maraca/index.js`, `xtendrmt/rmt-kernel-orchestration-controller.js`, Bundle Report `kernel.entryPoints` |
| `createRmtTemplateArtifacts()` | Ja | Hoher Source-to-Sea-Wert durch Fingerprints, Runtime Profile Hints und registerbare Artifact Bundles | Maraca Build Plan, Maraca Bundle Report, RMT Compiler-/Report-Pipeline |
| `createRmtPrewarmWorkerRuntime()` | Ja | Hoher Produktionswert für Warm Reentry, Route-/Surface-Reopen und Off-Main-Thread Preparation | Maraca Hydration Plan, Browser Runtime Boot Options, Fabric Hydration Policy, Surface Manager Lazy Hydration |
| `createRmtTemplateWorkerAdapter()` / `createRmtWorkerPrerenderRuntime()` | Ja, opt-in | Geeignet für `worker_prerender_hydrate`, wenn Worker nur Chunks berechnen und keine DOM-Verantwortung tragen | Hydration Plan, Fabric Lane Mapping, RMT Runtime Bridge, Browser Smoke Gates |
| `createRmtTemplateServerAdapter()` / `createRmtServerPrerenderRuntime()` | Ja, hostabhängig | Sinnvoll als gemeinsames Client/Server-Envelope für bestehende Node/PHP SSR-Adapter | `xtendrmt/rmt-node-ssr-adapter.js`, `xtendrmt/rmt-php-ssr-adapter.php`, Docs PHP SSR, Maraca SSR Capability Report |
| `createRmtDetachedRuntime()` | Ja | Sehr gut für CI und Regressionen ohne Browser-Flakes; Produktion nur für spezielle hostlose Vorberechnung | `scripts/run_xtend_tests.js`, RMT Lifecycle-/Telemetry-Suites, Surface Manager Resource Gates |
| `createRmtDomCompat()` | Ja | Sollte Ownership Modes, Island Mount/Unmount und Host Contract zentralisieren | Surface Manager Controller, RMT Surface Adapter, Surface Resource Graph, XSurfaceManager Docs/Gates |
| Performance Runtime Report-/History-APIs | Ja | Bereits vorhanden, aber noch nicht voll genutzt; bringt CI Summaries, Baselines und Trends | Fabric Telemetry, Maraca Bundle-/Size-Reports, Release Gates |
| `createRmtTemplateExecutionPath()` Trust/Panic/Recovery | Ja | Security- und Recovery-Daten sollten nicht nur in Kernel-Security-Tests sichtbar sein | Fabric Diagnostics, Maraca Lifecycle-/Kernel-Report, Browser Telemetry Bridge |
| `createRmtKernelPolicyParity()` | Ja | Gut für Release- und Strict-Mode-Gates, nicht nur dedizierte Kernel-Tests | Maraca Strict Gates, Package Release Reports, Policy-/Runtime-Parity-Report |
| Template Registry/Loader/Compiler Direct APIs | Teilweise | Als Unterbau wichtig, aber meist besser über Template API oder Runtime genutzt | Direkt nur für Maraca Artifact Generation und fokussierte Compiler Gates nutzen |
| RenderMan Legacy Aliases | Nein für neue Arbeit | Kompatibilität behalten, aber nicht als neue Integrationsfläche verwenden | Nur Parity- und Deprecation-Gates |

## Warm Reentry und Prewarm Worker

**Nutzen:** Ja, hoher Nutzen.

Der Prewarm Worker ist nicht nur historischer Offline-Code. Seine aktuellen Capabilities passen gut zu XTend:

- `syncTemplates()` synchronisiert Template-Snapshots in den Worker.
- `dispatchPrerenderEnvelope()` erzeugt vorbereitete Prerender-Responses.
- `getTopologySnapshot()` liefert Health, pending jobs, submitted jobs, synced templates, missing APIs und Verantwortungsgrenzen.
- Der Worker deklariert explizit, dass er keine DOM-Mutation, kein Event Binding und keine State Ownership übernimmt.
- Die Performance Runtime besitzt Backpressure-Profile mit `prewarmFootprintRatio`, `prewarmMaxItems`, `prewarmMaxDomNodes`, `preferIdle` und `delayMultiplier`.

| Schicht | Einhängepunkt |
| --- | --- |
| Maraca Build Plan | Neues optionales Kapitel `warmReentry` / `prewarm`, abgeleitet aus `prewarm`-Operationen, Hydration Modes und Route-/Surface-Wiederkehr |
| Maraca Runtime Boot | `createRmtRuntime({ enablePrewarmWorker })` hinter explizitem Feature Flag; Startwert `false` oder `auto-if-supported` |
| Fabric | Neue Fiber-Kinds `template.prewarm`, `template.prerender`, `surface.prewarm`, `route.prewarm` mit Default Lane `background` oder `idle` |
| Hydration Policy | Neuer Policy-Zweig `warm` oder `prewarm`, der bei hoher Backpressure reduziert statt erzwungen wird |
| Surface Manager | `open`, `focus`, Route Hover und Soon-Visible-Signale können Prewarm auslösen; `destroySurface` muss Prewarm- und Chunk-Handles invalidieren |
| Telemetry | Fabric Snapshot nimmt `prewarmTopology`, `workerHealth`, `templatesSynced`, `pendingJobs`, `missingApis` und `lastError` auf |

Empfohlene Semantik:

- Prewarm ist opportunistisch, nicht korrektheitskritisch.
- Prewarm darf sichtbare Arbeit nicht blockieren.
- Bei `critical` Backpressure wird Prewarm pausiert oder stark reduziert.
- Worker-Chunks sind vorbereitete Render-/Hydration-Artefakte; DOM Commit bleibt Main Thread und Trusted DOM Runtime.
- Warm Reentry bedeutet: erneutes Öffnen oder Rückkehr zu einer Route/Surface nutzt vorbereitete Chunks, retained Measurements und reduzierte Hydration-Followups.

## Template Artifacts

**Nutzen:** Ja, sehr hoch.

`createRmtTemplateArtifacts()` erzeugt Document Artifacts und Artifact Bundles mit Fingerprints, Runtime Profile Hints, Template IDs und registerbaren Prepared Documents. Das passt sehr gut zu XTends Source-to-Sea-Mentalität.

Einhängepunkte:

- `xtend-maraca/index.js`: nach Compile/Build-Plan eine `templateArtifacts`-Sektion erzeugen.
- Bundle Report: `templateArtifactCount`, `bundleFingerprint`, `runtimeProfileHints`, `sourceFingerprint`, `documentIds`.
- Runtime: `runtime.registerArtifactBundle()` nur für gebündelte, vertrauenswürdige Artefakte.
- Tests: Gate, dass `.rmt` mit Templates im Report einen stabilen Artifact-Fingerprint bekommt.

Priorität: P0/P1, weil dieses Feature Laufzeitverhalten nicht zwingend ändert und sofort Observability liefert.

## Worker Prerender Runtime

**Nutzen:** Ja, opt-in.

Die Worker-Prerender-Runtime kapselt `requestPrerender()`, `hydrateResponse()` und `execute()` über Worker Transport. Sie ist der natürliche Ausführungspfad für `worker_prerender_hydrate`.

Einhängepunkte:

- Fabric Lane Mapping: `template.prerender` und `template.prewarm` auf `background`; `hydrate.response` auf `visible` oder `idle` je nach Sichtbarkeit.
- Maraca Hydration Plan: Bei `worker_prerender_hydrate` oder `prewarm ... from worker` entsteht ein `workerPrerender` Capability Record.
- Browser Runtime: Worker Runtime nur bei Feature Flag und vorhandenen Worker APIs verwenden.
- Surface Manager: Lazy Hydration kann vorbereitete Worker Response konsumieren, wenn sie noch gültig ist.

Risiken:

- Worker dürfen keine Host Services ausführen.
- Worker-Resultate müssen durch Trusted DOM und Execution Path auf dem Main Thread gehen.
- Supersession ist wichtig: Neuere Route-/Surface-Intents müssen alte Worker-Antworten verdrängen.

## Server Prerender Runtime

**Nutzen:** Ja, aber nicht als Ersatz für SSR-Adapter.

Die Server-Transport-APIs sind als gemeinsames Envelope zwischen Client Runtime und Node/PHP SSR-Adaptern wertvoll. XTend besitzt bereits `rmt-node-ssr-adapter.js`, `rmt-php-ssr-adapter.php` und Docs-App-SSR-Pfade mit `server_prerender_hydrate`.

Einhängepunkte:

- SSR Adapter: Responses auf `RmtTemplatePrerenderResponseEnvelope` und `hydrateResponse()`-Kompatibilität prüfen.
- Docs PHP SSR: vorhandene `server_prerender_hydrate` Evidence mit Kernel Transport Adapter reporten.
- Maraca Report: `serverPrerender.supported`, `adapterKind`, `hydrateResponseCompatible`.

Priorität: P2, weil Worker, Artifacts und Telemetry schneller direkten Framework-Wert liefern.

## Detached Runtime

**Nutzen:** Ja, besonders für Tests.

`createRmtDetachedRuntime()` wickelt BrowserRuntime-Semantik in einem detached Host ab. Das ist ideal für reproduzierbare Gates, bei denen Browser-APIs, Timing und DOM-Flakes stören.

Einhängepunkte:

- Lifecycle Gates: `destroySurface`, resource release, `disposeRoot`, telemetry tombstones.
- Template Gates: render, prerender und hydrate ohne echten Browser Smoke.
- CI: schnelle Regressionen für Maraca Kernel-/Hydration-Pläne.

Produktionsnutzen: Mittel. In PROD eher für Preview, workerlose Vorberechnung oder Embedded Hosts ohne echtes DOM.

## DOM Compat

**Nutzen:** Ja, als Contract-Schicht.

`createRmtDomCompat()` kennt Host Contract, Ownership Modes, Island Mount/Unmount, Element Resolution und `finalizeIslandUnmount()`. Der Surface Manager hat heute viel eigene DOM- und Ownership-Logik. Eine harte Migration wäre riskant, aber eine Compatibility-Schicht ist sinnvoll.

Einhängepunkte:

- Surface Manager Controller: Ownership-Entscheidungen gegen DomCompat Contract testen.
- RMT Surface Adapter: `materializeSurfaces()` und `destroySurface()` können DomCompat für owned/external Element-Regeln nutzen.
- Docs/Gates: `managed_subtree`, `replace_children`, `hydrate_existing`, `observe_only` mit Destroy-Semantik validieren.

Priorität: P1/P2, nach Detached Runtime Gates.

## Performance Runtime Advanced APIs

**Nutzen:** Ja, sehr hoch.

Die Performance Runtime kann mehr als einfache Snapshots:

- Budgets evaluieren: `evaluateBudget()`, `evaluateBudgets()`
- Backpressure Profile ausgeben: `getBackpressureProfile()`
- Reports vergleichen: `compareRunReports()`, `compareRunReportToBaseline()`
- Baselines und Trends erzeugen: `createRunBaseline()`, `createTrendSeries()`, `createNightlyTrendlines()`
- CI- und File-Artefakte erzeugen: `createCiSummary()`, `createFileArtifact()`, `writeCiSummary()`
- Persisted History verwalten: `persistHarnessOutput()`, `exportPersistedHistory()`

Einhängepunkte:

- Fabric Telemetry Snapshot: Kernel Performance Snapshot und Backpressure Profile als first-class Feld aufnehmen.
- Maraca Bundle Report: `performance.ciSummary`, `performance.budgetSnapshot`, `performance.baselineComparison`.
- Release Gates: Budget Miss für `visible_commit`, `command_turnaround`, `retained_warm_reuse` und `hydration_followup`.
- Warm Reentry: `retained_warm_reuse` als Budgetklasse für Surface-/Route-Reentry.

## Template Execution Path, Trust, Panic und Recovery

**Nutzen:** Ja, sicherheitsrelevant.

Execution Path und Runtime Renderer können Trust Verdicts, Panic Events, Recovery Outcomes, Safe Snapshots und Quarantine Scopes ausgeben. Diese Daten sollten nicht nur in Kernel-Security-Tests sichtbar sein.

Einhängepunkte:

- Fabric Diagnostics: Panic/Recovery als `diagnostics` Lane, Severity `warn` oder `error`.
- Maraca Bundle Report: `kernel.security`, `panicRecovery`, `trustedDom`.
- Surface Lifecycle: Ein Surface Destroy oder Unmount nach Panic kann Safe Snapshot und Quarantine Scope referenzieren.
- App Runtime: Stream-, Error- und Cancel-Lifecycle kann Recovery-Diagnostics korrelieren.

## Product Surface Bootstrap

**Nutzen:** Ja, strukturell.

Maraca und der Kernel-Orchestrator erzeugen heute mehrere Factories direkt. Das funktioniert, aber Product Surface bietet eine robustere Boot-Fassade:

- `listEntryPoints()`
- `listOptionalCompat()`
- `createRuntime()`, `createCore()`, `createPerformanceRuntime()`
- `createTemplateArtifacts()`, `createWorkerRuntime()`, `createServerRuntime()`, `createDetachedDomRuntime()`

Einhängepunkte:

- Kernel-Orchestrator: optional `productSurface = createRmtProductSurface()` und Factories über Product Surface beziehen.
- Maraca Bundle Report: `kernel.productSurface.entryPoints`, `optionalCompat`, `runtimeFactories`.
- Tests: Product Surface Boot muss dieselbe Runtime-Kette erzeugen wie direkte Factory-Nutzung.

## Empfohlene Umsetzungstracks

| Track | Ziel | Module | Erste Gates |
| --- | --- | --- | --- |
| A: Evidence First | Artefakte und Reports nutzen, ohne Runtime-Verhalten zu riskieren | Product Surface, Template Artifacts, Performance CI Summary | Bundle Report enthält Entry Points, Artifact Fingerprints und Performance Summaries |
| B: Deterministic Runtime Gates | Kernel-Runtime-Funktionen reproduzierbar testen | Detached Runtime, DomCompat, Execution Path | Detached Lifecycle Destroy/Release, DomCompat Ownership Parity, Panic/Recovery Snapshot |
| C: Warm Reentry Opt-In | Worker Prewarm für Route-/Surface-Wiederkehr nutzen | Prewarm Worker, Worker Adapter, Performance Backpressure | Worker Topology Telemetry, `retained_warm_reuse` Budget, Prewarm degradiert unter Critical Pressure |
| D: Prerender Transport Interop | Worker-/Server-Transport-Kompatibilität herstellen | Worker/Server Prerender Runtime, Node/PHP SSR | `worker_prerender_hydrate` Smoke, `server_prerender_hydrate` Hydrate Response Compatibility |
| E: Strict Release Hardening | Policy, Panic und Telemetry in PROD Gates einbinden | Policy Parity, Panic/Recovery, Performance Baselines | Strict Maraca Build fällt bei Parity Drift, unsafe Trust Sink oder Budget Regression |

## Entscheidung

Die untergenutzten Kernel-Module sollten adoptiert werden, aber in dieser Reihenfolge:

1. Product Surface Bootstrap Evidence, Template Artifacts und Performance CI Summaries.
2. Detached Runtime und DomCompat Parity Gates.
3. Warm Reentry / Prewarm Worker als opt-in Produktionsfeature mit Topology Telemetry.
4. Worker-/Server-Prerender-Interop, sobald die Gates stabil sind.
5. Policy Parity, Panic/Recovery und Performance Baselines als Release-Härtung.
