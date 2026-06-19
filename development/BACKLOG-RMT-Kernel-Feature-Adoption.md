# BACKLOG: RMT Kernel Feature Adoption

- Status: `proposed`
- Datum: 2026-06-19
- Source Doc: `docs/de/rmt-kernel-feature-adoption-evaluation.md`
- Topography Doc: `docs/de/rmt-kernel-topography-map.md`
- Contract Target: `xtend.rmt-kernel-feature-adoption.v1`
- Report Target: `xtend.rmt-kernel-feature-adoption-report.v1`
- Leitlinie: `runtime-first`, `observable-by-default`, `contracts-over-heuristics`

## Zielbild

Der XTend-Stack nutzt die bisher untergenutzten RMT-Kernel-Module gezielt dort, wo sie Framework-Stabilität, Performance, Telemetry, Source-to-Sea-Evidence und Produktionsdiagnostik verbessern. Die Adoption erfolgt bewusst gestaffelt:

1. Evidence und Reports ohne riskante Laufzeitänderungen.
2. Deterministische Runtime-Gates und Contract-Parität.
3. Opt-in Warm Reentry und Worker Prewarm.
4. Worker-/Server-Prerender-Interop.
5. Strict Release Hardening über Policy, Panic/Recovery und Performance Baselines.

## Nicht-Ziele

- Keine globale Aktivierung aller Kernel-Features ohne Capability- und Host-Prüfung.
- Keine neue RMT-Syntax als Voraussetzung für die ersten Arbeitspakete.
- Kein Worker-DOM-Commit. Worker bereiten Chunks vor; Trusted DOM Runtime und Main Thread bleiben Commit-Autorität.
- Kein Ersatz vorhandener Node/PHP SSR-Adapter durch Kernel-Server-Runtime. Ziel ist Envelope-Kompatibilität, nicht ein Adapter-Rewrite.

## Backlog Übersicht

| WP | Priorität | Thema | Ergebnis |
| --- | --- | --- | --- |
| RKFA-00 | P0 | Source-of-Truth und Capability Registry | Einheitliche Capability-Liste für Kernel-Feature-Adoption |
| RKFA-01 | P0 | Product Surface Bootstrap Evidence | Maraca/Orchestrator können optional über Product Surface booten |
| RKFA-02 | P0/P1 | Template Artifacts in Maraca | Bundle Reports enthalten Artifact Fingerprints und Runtime Profile Hints |
| RKFA-03 | P0/P1 | Performance Runtime Advanced Reports | Maraca/Fabric nutzen CI Summary, Budgets, Backpressure und Baselines |
| RKFA-04 | P1 | Detached Runtime Gate Harness | Lifecycle-/Telemetry-Szenarien laufen deterministisch ohne Browser-Flakes |
| RKFA-05 | P1 | DOM Compat Parity | Surface Manager Destroy/Ownership wird gegen Kernel DomCompat geprüft |
| RKFA-06 | P1 | Warm Reentry Capability Model | Routen, Surfaces und Hydration Plans können Prewarm semantisch beschreiben |
| RKFA-07 | P1/P2 | Prewarm Worker Runtime Integration | Worker Topology und Health werden runtime-nah beobachtbar |
| RKFA-08 | P2 | Worker Prerender Interop | `worker_prerender_hydrate` bekommt Capability Records und Smoke Gates |
| RKFA-09 | P2 | Server Prerender Interop | Node/PHP SSR Responses werden gegen Kernel Envelope geprüft |
| RKFA-10 | P1/P2 | Panic/Recovery Telemetry Bridge | Trust, Panic und Recovery werden Fabric-/Maraca-sichtbar |
| RKFA-11 | P1/P2 | Policy Parity Release Gates | Strict Builds erkennen Policy-/Runtime-Drift |
| RKFA-12 | P1/P2 | App Runtime Backpressure Coupling | Stream Pressure und Yield-Hints fließen in Kernel-/Fabric-Telemetry |
| RKFA-13 | P2 | Production Bundle Closure | PROD-Maraca-Bundles erhalten ein vollständiges Lifecycle/Telemetry/Prewarm-Kapitel |

## RKFA-00: Source-of-Truth und Capability Registry

**Status:** `completed`

**Umgesetzt:** 2026-06-19

**Ziel:** Eine zentrale, maschinenlesbare Capability-Sicht auf adoptierbare Kernel-Features schaffen.

**Betroffene Bereiche:**

- `xtend-maraca/index.js`
- `xtendrmt/rmt-kernel-orchestration-controller.js`
- `xtendrmt/rmt-manifest.json`
- `docs/de/rmt-kernel-feature-adoption-evaluation.md`
- `docs/en/rmt-kernel-feature-adoption-evaluation.md`

**Umsetzung:**

- Capability Keys definieren: `productSurface`, `templateArtifacts`, `performanceAdvancedReports`, `detachedRuntime`, `domCompat`, `warmReentry`, `prewarmWorker`, `workerPrerender`, `serverPrerender`, `panicRecovery`, `policyParity`.
- Pro Capability erfassen: `supported`, `runtimeRequired`, `prodDefault`, `diagnosticsRequired`, `strictFallbackAllowed`.
- Maraca Bundle Report und Kernel-Orchestrator-Snapshot auf dieselbe Capability-Liste ausrichten.

**Implementierungsnotiz:**

- Registry: `xtendrmt/rmt-kernel-feature-adoption-registry.js`
- Typen: `xtendrmt/rmt-kernel-feature-adoption-registry.d.ts`
- Manifest-Anker: `xtendrmt/rmt-manifest.json#kernelFeatureAdoption`
- Maraca Evidence: `bundleReport.kernelFeatureAdoption` und `bundleReport.kernel.featureAdoption`
- Runtime Evidence: `createRmtKernelOrchestrationController().snapshot().featureAdoption`

**Akzeptanzkriterien:**

- Bundle Report und Kernel-Orchestrator verwenden identische Capability Keys.
- Nicht unterstützte Capabilities liefern eine degradierte Diagnose statt stiller No-Ops.
- Capability-Status kann in Tests ohne Browser gelesen werden.

**Gates:**

```bash
node scripts/run_xtend_tests.js rmt-kernel-orchestration maraca-bundle-report --json
```

## RKFA-01: Product Surface Bootstrap Evidence

**Status:** `completed`

**Umgesetzt:** 2026-06-19

**Ziel:** `createRmtProductSurface()` als optionale Boot-Fassade in Maraca und Kernel-Orchestrator einführen, ohne direkte Factory-Nutzung sofort zu entfernen.

**Betroffene Bereiche:**

- `xtend-maraca/index.js`
- `xtendrmt/rmt-kernel-orchestration-controller.js`
- `xtendrmt/rmt-core.d.ts`
- `tests/rmt/*`
- `tests/maraca/*`

**Umsetzung:**

- Optionalen Boot-Modus `kernelBootMode: "direct" | "productSurface"` einführen.
- `listEntryPoints()` und `listOptionalCompat()` in Reports aufnehmen.
- Sicherstellen, dass Product-Surface-Boot dieselben Kernobjekte erzeugt wie der direkte Boot-Pfad.

**Implementierungsnotiz:**

- Maraca akzeptiert `kernelBootMode: "direct" | "productSurface"`; `direct` bleibt Default.
- Build Plan und Bundle Report enthalten `kernel.productSurface` mit `entryPoints`, `optionalCompat`, `runtimeFactories`, `bootMode` und Diagnose-Status.
- Der Kernel-Orchestrator bootet optional über `createRmtProductSurface()` und legt `bootMode` sowie `productSurface` im Runtime-Snapshot offen.
- Capability Evidence markiert `productSurface` nur dann als aktiv, wenn der Product-Surface-Bootpfad tatsächlich gewählt und erzeugt wurde.
- Tests decken Direct-Default, Product-Surface-Boot, Factory-Parität, Scheduler-Endpoint-Parität und Type-Export-Kompatibilität ab.

**Akzeptanzkriterien:**

- Direct Boot bleibt Default und rückwärtskompatibel.
- Product-Surface-Boot ist testbar und erzeugt keine andere Runtime-Semantik.
- Bundle Report enthält `kernel.productSurface.entryPoints` und `kernel.productSurface.optionalCompat`.

**Gates:**

```bash
node scripts/run_xtend_tests.js maraca-plan maraca-bundle maraca-kernel-orchestration rmt-compatibility --json
node scripts/run_xtend_tests.js type-exports-rmt --json
```

## RKFA-02: Template Artifacts in Maraca

**Status:** `completed`

**Umgesetzt:** 2026-06-19

**Ziel:** `createRmtTemplateArtifacts()` in Maraca als Source-to-Sea-Evidence nutzen.

**Betroffene Bereiche:**

- `xtend-maraca/index.js`
- `tools/rmt-language/vnext-compiler.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-core.d.ts`
- `tests/rmt-language/*`
- `tests/maraca/*`

**Umsetzung:**

- Nach dem Compile-/Build-Plan eine `templateArtifacts`-Sektion erzeugen.
- Document IDs, Template IDs, Source Fingerprint, Bundle Fingerprint und Runtime Profile Hints reporten.
- Optionales `runtime.registerArtifactBundle()` nur für gebündelte, vertrauenswürdige Artefakte aktivieren.

**Implementierungsnotiz:**

- Build Plan und Bundle Report enthalten `templateArtifacts` mit `documentIds`, `templateIds`, `sourceFingerprint`, `artifactBundleFingerprint`, `bundleFingerprint`, `runtimeProfileHints` und Source-to-Sea-ID-Parität.
- Die Artefact-Bundles nutzen Kernel-kompatible Shapes (`renderman_template_artifact_bundle`, `renderman_template_artifact_document`) und stabile Fingerprints.
- `kernelFeatureAdoption` markiert `templateArtifacts` aktiv, sobald ein unterstütztes, trusted Artefact-Bundle vorbereitet wurde.
- Der gebaute Maraca-Entry exportiert `MARACA_TEMPLATE_ARTIFACTS` und registriert trusted Bundles zur Laufzeit nur guarded über `createRmtTemplateArtifacts().registerArtifactBundle()`.
- Package-Metadaten deklarieren `templateArtifactsReportSchema`, damit Release-/Debug-Gates die Evidence finden.

**Akzeptanzkriterien:**

- `.rmt`-Produkte mit Templates erhalten stabile Artifact Fingerprints.
- Bundle Fingerprint ändert sich nachvollziehbar bei Template-/Source-Änderung.
- Report verweist auf dieselben Dokument-IDs wie Compiler und Runtime.

**Gates:**

```bash
node scripts/run_xtend_tests.js rmt-vnext-lifecycle rmt-component-fabric-ingestion maraca-bundle --json
node scripts/run_xtend_tests.js maraca-plan maraca-bundle maraca-package-exports --json
node scripts/run_xtend_tests.js type-exports-rmt --json
```

## RKFA-03: Performance Runtime Advanced Reports

**Status:** `completed`

**Umgesetzt:** 2026-06-19

**Ziel:** Die erweiterten Performance Runtime APIs als reguläre Telemetry- und Release-Evidence nutzen.

**Betroffene Bereiche:**

- `xtend-maraca/index.js`
- `fabric/xtend-fabric.js`
- `xtendrmt/rmt-kernel-orchestration-controller.js`
- `xtendrmt/rmt-app-runtime.js`
- `tests/fabric/*`
- `tests/rmt/*`

**Umsetzung:**

- `createCiSummary()`, `createFileArtifact()`, `compareRunReportToBaseline()` und `getBackpressureProfile()` in Maraca/Fabric-Snapshots einbinden.
- Budgetklassen `visible_commit`, `command_turnaround`, `hydration_followup` und `retained_warm_reuse` sichtbar machen.
- Runtime Expected Status in Bundle Reports mit Performance Summary verbinden.
- Maraca erzeugt `xtend.maraca.performance-report.v1` mit CI Summary, Run-Report-Artefakt, Baseline Comparison, Backpressure Profile, Budget Snapshot und strukturierten Budget-Miss-Diagnostics.
- Fabric Telemetry kann eine injizierte Kernel Performance Runtime auslesen und Kernel Snapshot, Budget Snapshot, Backpressure Profile, CI Summary, File Artifact und Baseline Comparison in `snapshot.performance` weiterreichen.
- Kernel-Orchestration-Controller stellt einen Performance Snapshot bereit und fällt kontrolliert auf die Maraca-Plan-Evidence zurück, wenn keine Runtime injiziert wurde.
- App Runtime besitzt `getPerformanceTelemetrySnapshot()` als Dev-/Gate-Schnittstelle für Commands, Stream-Patches, Stream Records und Backpressure-Signale.

**Akzeptanzkriterien:**

- Fabric Telemetry enthält Kernel Performance Snapshot und Backpressure Profile.
- Maraca Report enthält `performance.ciSummary`, `performance.budgetSnapshot` und optional `performance.baselineComparison`.
- Budget-Misses werden als strukturierte Diagnostics und nicht nur als Textmeldung erfasst.

**Gates:**

```bash
node scripts/run_xtend_tests.js fabric-lifecycle-boundary fabric-lane-mapping rmt-component-lifecycle-telemetry --json
node scripts/run_xtend_tests.js maraca-plan maraca-bundle maraca-package-exports --json
node scripts/run_xtend_tests.js fabric-telemetry-snapshot rmt-app-runtime type-exports-rmt --json
node scripts/run_xtend_tests.js maraca-kernel-orchestration --json
```

## RKFA-04: Detached Runtime Gate Harness

**Status:** `completed`

**Umgesetzt:** 2026-06-19

**Ziel:** `createRmtDetachedRuntime()` als Standardwerkzeug für deterministische Lifecycle-, Telemetry- und Resource-Release-Gates etablieren.

**Betroffene Bereiche:**

- `scripts/run_xtend_tests.js`
- `tests/rmt/*`
- `tests/components/*`
- `xtendrmt/rmt-runtime.esm.js`
- `src/components/x-surface-manager/*`

**Umsetzung:**

- Detached Runtime Test Helper bauen.
- Szenarien für `mount`, `hydrate`, `unmount`, `destroySurface`, `disposeRoot`, Resource Release und Tombstone Telemetry abbilden.
- Browser-nahe Smokes behalten, aber schnelle Regressionen zuerst detached laufen lassen.
- Neuer Gate `rmt-detached-runtime-harness` erzeugt `xtend.rmt.detached-runtime-gate-result.v1` mit Operationen, Snapshots, Telemetry Records und browser-smoke-kompatiblem Result Shape.
- Harness koppelt echte `createRmtDetachedRuntime()`-Mount/Hydrate/Unmount-Flows mit SurfaceController, Surface Resource Graph Runtime und ResourceManager.
- `destroySurface` prueft Resource Release, Event-Owner-Detach und Tombstone-Diagnostik ohne echten Browser.

**Akzeptanzkriterien:**

- Lifecycle Destroy/Release läuft ohne echten Browser stabil.
- Telemetry Records sind aus dem Test Harness abrufbar.
- Detached Runtime und Browser Smoke liefern kompatible Result Shapes.

**Gates:**

```bash
node scripts/run_xtend_tests.js rmt-vnext-lifecycle surface-controller surface-manager rmt-surface-resource-graph-runtime rmt-detached-runtime-harness --json
```

## RKFA-05: DOM Compat Parity

**Status:** `completed`

**Ziel:** `createRmtDomCompat()` als gemeinsame Contract-Schicht für Ownership Modes und Island Mount/Unmount nutzen.

**Betroffene Bereiche:**

- `src/components/x-surface-manager/surface-controller.ts`
- `src/components/x-surface-manager/x-surface-manager.ts`
- `xtendrmt/rmt-surface-resource-graph-runtime.js`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `components/xsurfacemanager-controller.js`
- `catalog/surface-manager-adapter-runtime.js`
- `tests/components/*`
- `tests/rmt/*`

**Umsetzung:**

- DomCompat Contract gegen Surface Manager Ownership testen.
- Destroy-Semantik für `managed_subtree`, `replace_children`, `hydrate_existing`, `observe_only` prüfen.
- RMT Surface Adapter optional mit DomCompat-Checks anreichern.
- `ownershipMode` wird im SurfaceAdapter-Mapping, in Materialization-Attributen, im Controller-Record und im Snapshot gespiegelt.
- Unsupported DomCompat Ownership wird über `rmt.surface.dom_compat_ownership_unsupported` diagnostiziert.
- Neues Gate `rmt-dom-compat-parity` prüft Runtime-Unmount, Adapter-Mapping, Snapshot-Parity und Destroy-DOM-Semantik.

**Akzeptanzkriterien:**

- Owned Surfaces werden beim Destroy sauber entfernt.
- Externe Host-Elemente bleiben erhalten, außer `removeElement: true` ist gesetzt.
- DomCompat- und Surface-Manager-Snapshot stimmen bei Ownership und Unmount überein.

**Gates:**

```bash
node scripts/run_xtend_tests.js surface-controller surface-manager surface-runtime-release-handoff rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-dom-compat-parity surface-adapter-runtime --json
```

## RKFA-06: Warm Reentry Capability Model

**Status:** `completed`

**Ziel:** Warm Reentry als deklarative, optionale Capability in Build Plan, Hydration Plan und Runtime Telemetry beschreiben.

**Betroffene Bereiche:**

- `xtend-maraca/index.js`
- `fabric/hydration-policy.js`
- `fabric/rmt-lane-mapping.js`
- `src/components/x-surface-manager/*`
- `tools/rmt-language/vnext-parser.js`
- `tools/rmt-language/vnext-compiler.js`

**Umsetzung:**

- `warmReentry` / `prewarm` Report-Sektion aus vorhandenen `prewarm`-Operationen und Hydration Modes ableiten.
- Fiber-Kinds `template.prewarm`, `template.prerender`, `surface.prewarm`, `route.prewarm` im Lane Mapping erfassen.
- Hydration Policy um `warm` / `prewarm` Entscheidung erweitern.
- Surface Manager invalidiert Prewarm- und Chunk-Handles bei `destroySurface`.
- Maraca Build-/Bundle-Reports und Package-Metadata deklarieren `xtend.maraca.warm-reentry-report.v1`.

**Akzeptanzkriterien:**

- Warm Reentry bleibt opportunistisch und blockiert sichtbare Arbeit nicht.
- Kritische Backpressure reduziert oder pausiert Prewarm.
- `destroySurface` invalidiert zugehörige Prewarm- und Chunk-Handles.

**Gates:**

```bash
node scripts/run_xtend_tests.js fabric-lane-mapping hydration-policy surface-lazy-hydration --json
```

## RKFA-07: Prewarm Worker Runtime Integration

**Status:** `completed`

**Ziel:** `createRmtPrewarmWorkerRuntime()` als opt-in Produktionspfad mit Health-, Topology- und Fallback-Telemetry anbinden.

**Betroffene Bereiche:**

- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-kernel-orchestration-controller.js`
- `xtend-maraca/index.js`
- `fabric/xtend-fabric.js`
- `tests/rmt/*`

**Umsetzung:**

- Runtime Flag `enablePrewarmWorker` sauber in Bundle Capability und Runtime Boot reflektieren.
- `getPrewarmWorkerTopology()` in Kernel-/Fabric-Telemetry aufnehmen.
- Fallback-Diagnosen für fehlende Worker-, Blob- oder URL-APIs strukturieren.
- Root Dispose und harte App-Unmount-Pfade terminieren Worker.
- Maraca Kernel-Plan und Bundle-Report deklarieren `xtend.maraca.prewarm-worker-runtime.v1`.
- `rmt-kernel-orchestration` ist als Runner-Alias für das RKFA-07-Gate registriert.

**Akzeptanzkriterien:**

- Worker Topology enthält Health, pending jobs, submitted jobs, templates synced, missing APIs und last error.
- Fehlende Host APIs führen zu kontrollierter Degradation.
- Prewarm Worker übernimmt keine DOM-, Event- oder State-Ownership.

**Gates:**

```bash
node scripts/run_xtend_tests.js rmt-kernel-orchestration fabric-lifecycle-boundary rmt-component-lifecycle-telemetry --json
```

## RKFA-08: Worker Prerender Interop

**Status:** `completed`

**Ziel:** `worker_prerender_hydrate` als explizit testbare Worker-Prerender-Capability verdrahten.

**Betroffene Bereiche:**

- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-core.d.ts`
- `tools/rmt-language/vnext-compiler.js`
- `fabric/rmt-lane-mapping.js`
- `fabric/hydration-policy.js`
- `tests/rmt-language/*`
- `tests/rmt/*`

**Umsetzung:**

- Capability Record `workerPrerender` im Hydration Plan erzeugen.
- Worker Responses über `hydrateResponse()` und Trusted DOM Main-Thread-Commit validieren.
- Supersession-Regeln für alte Worker-Antworten testen.

**Akzeptanzkriterien:**

- `worker_prerender_hydrate` ist im Bundle Report als supported/degraded sichtbar.
- Worker-Antworten ohne passende Generation werden verworfen.
- Host Services werden im Worker-Pfad nicht ausgeführt.

**Gates:**

```bash
node scripts/run_xtend_tests.js rmt-vnext-fabric-bridge rmt-component-fabric-ingestion hydration-policy --json
```

**Evidence 2026-06-19:**

- `workerPrerender` wird im Hydration Plan als Capability Record erzeugt und in Maraca Hydration/Bundle Reports gespiegelt.
- `hydrateResponse()` verwirft Worker-Antworten mit abweichender Generation vor dem Hydration-Commit und meldet `status: "superseded"`.
- Worker-Payloads mit Host-Service-/Effect-/Command-Requests werden diagnostiziert und nicht ausgeführt.
- Gate grün: `node scripts/run_xtend_tests.js rmt-vnext-fabric-bridge rmt-component-fabric-ingestion hydration-policy --json`.

## RKFA-09: Server Prerender Interop

**Status:** `completed`

**Ziel:** Kernel Server Prerender Runtime und bestehende Node/PHP SSR-Adapter über kompatible Envelopes verbinden.

**Betroffene Bereiche:**

- `xtendrmt/rmt-node-ssr-adapter.js`
- `xtendrmt/rmt-php-ssr-adapter.php`
- `xtendrmt/rmt-runtime.esm.js`
- `xtend-maraca/index.js`
- `docs/de/*`
- `docs/en/*`
- `tests/rmt/*`

**Umsetzung:**

- SSR Responses gegen `RmtTemplatePrerenderResponseEnvelope` prüfen.
- `hydrateResponseCompatible` im Maraca Report ausweisen.
- Bestehende `server_prerender_hydrate` Docs-/Product-Flows als Evidence nutzen.

**Akzeptanzkriterien:**

- Node und PHP Adapter liefern kompatible Envelope-Metadaten.
- Client Runtime kann Server Response hydratisieren oder kontrolliert degradieren.
- Bundle Report benennt Adapter Kind, Support Status und Diagnose.

**Gates:**

```bash
node scripts/run_xtend_tests.js rmt-compatibility rmt-vnext-lifecycle maraca-bundle-report --json
```

**Evidence 2026-06-19:**

- `node scripts/run_xtend_tests.js rmt-compatibility rmt-vnext-lifecycle maraca-bundle-report --json`
- `node scripts/run_xtend_tests.js rmt-node-ssr-adapter rmt-php-ssr-adapter maraca-bundle --json`

## RKFA-10: Panic/Recovery Telemetry Bridge

**Status:** `completed`

**Ziel:** Trust Verdicts, Panic Events, Recovery Outcomes und Safe Snapshots aus dem Kernel in Fabric und Maraca sichtbar machen.

**Betroffene Bereiche:**

- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-kernel-orchestration-controller.js`
- `fabric/xtend-fabric.js`
- `xtend-maraca/index.js`
- `xtendrmt/rmt-app-runtime.js`
- `tests/rmt/*`
- `tests/fabric/*`

**Umsetzung:**

- Kernel Panic/Recovery Records als `diagnostics` Lane in Fabric aufnehmen.
- Maraca Report um `kernel.security`, `panicRecovery`, `trustedDom` erweitern.
- Surface Lifecycle nach Panic mit Safe Snapshot und Quarantine Scope korrelieren.

**Akzeptanzkriterien:**

- Panic/Recovery Records sind in Dev-Schnittstellen abrufbar.
- Strict Reports unterscheiden Trust Verdict, Recovery Outcome und Quarantine Scope.
- Surface Destroy nach Panic hinterlässt nachvollziehbare Diagnostics.

**Gates:**

```bash
node scripts/run_xtend_tests.js rmt-compatibility fabric-lifecycle-boundary rmt-component-lifecycle-telemetry --json
```

**Evidence:**

- `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-runtime.browser.js` und `xtendrmt/rmt-core.esm.js` exponieren `listPanicRecoveryRecords()` und `getPanicRecoverySnapshot()` bis zur BrowserRuntime-/Template-API.
- `fabric/xtend-fabric.js` nimmt Kernel Panic/Recovery Records als `diagnostics` Lane auf, erzeugt Kernel-Fibers und stellt `getKernelPanicRecoveryRecords()`/`getPanicRecoverySnapshot()` bereit.
- `xtendrmt/rmt-app-runtime.js` merged Kernel- und Fabric-Panic/Recovery Records als Dev-Snapshot.
- `xtend-maraca/index.js` reported `panicRecovery`, `trustedDom` und `kernel.security` inklusive Strict-Diagnostics fuer Trust Verdict, Recovery Outcome und Quarantine Scope.
- Gate: `node scripts/run_xtend_tests.js rmt-compatibility fabric-lifecycle-boundary rmt-component-lifecycle-telemetry --json` passed am 2026-06-19.
- Extra: `node scripts/run_xtend_tests.js maraca-bundle --json` und `node scripts/run_xtend_tests.js maraca-bundle-report --json` passed am 2026-06-19.

## RKFA-11: Policy Parity Release Gates

**Status:** `completed`

**Ziel:** `createRmtKernelPolicyParity()` als Cross-Layer Release Constraint nutzen.

**Betroffene Bereiche:**

- `xtend-maraca/index.js`
- `catalog/*`
- `package.json`
- `scripts/run_xtend_tests.js`
- `tests/platform/*`
- `tests/rmt/*`

**Umsetzung:**

- Policy Parity Report mit Runtime Trust Sinks, Surface Lifecycle und Bundle Capabilities verbinden.
- Strict Mode schlägt bei Policy Drift, fehlenden Factories oder unsicherem Trust Sink fehl.
- Release Reports enthalten `policyParity.ok`, `policyParity.driftCount`, `requiredFactories`.

**Akzeptanzkriterien:**

- Strict PROD Bundle kann Policy Drift nicht still übergehen.
- Policy Parity ist maschinenlesbar und in Release-Reports auffindbar.
- Dedicated Kernel Gates und Maraca Release Gates nutzen dieselbe Interpretation.

**Gates:**

```bash
node scripts/run_xtend_tests.js epic14-rmt-tooling-release-gates rmt-compatibility maraca-bundle-report --json
```

**Evidence:**

- `xtend-maraca/index.js` erzeugt `policyParity` als Kernel-/Bundle-Report und blockt Strict Kernel Builds bei Drift, fehlenden Factories oder unsicherer Trust-Sink-Abdeckung.
- `policyParity.ok`, `policyParity.driftCount`, `policyParity.requiredFactories`, `policyParity.missingFactories` und `kernel.security.policyParity` sind in Maraca Reports maschinenlesbar.
- `catalog/epic14-rmt-tooling.js`, `package.json`, `xtend-builder/scaffold.config.js` und `docs/rmt-tooling-release-gates.md` verankern Kernel Policy Parity als Release-Constraint.
- Gate: `node scripts/run_xtend_tests.js epic14-rmt-tooling rmt-compatibility maraca-bundle-report --json` passed am 2026-06-19.
- Extra: `node scripts/run_xtend_tests.js rmt-kernel-policy-parity maraca-kernel-orchestration --json` passed am 2026-06-19.

## RKFA-12: App Runtime Backpressure Coupling

**Status:** `completed`

**Ziel:** Stream Pressure, Terminal Stream Lifecycle und Yield-Hints aus der App Runtime stärker mit Kernel Scheduler und Fabric Telemetry koppeln.

**Betroffene Bereiche:**

- `xtendrmt/rmt-app-runtime.js`
- `fabric/xtend-fabric.js`
- `fabric/hydration-policy.js`
- `xtendrmt/rmt-kernel-orchestration-controller.js`
- `tests/fabric/*`
- `tests/rmt/*`

**Umsetzung:**

- Stream-Deltas und terminale Stream-Zustände als Scheduler-/Performance-Samples spiegeln.
- Yield Actions bei hoher UI-Backpressure als strukturierte Telemetry ausgeben.
- Prewarm und Lazy Hydration unter hoher Stream Pressure automatisch drosseln.

**Akzeptanzkriterien:**

- RMT-Kernel reagiert messbar auf steigende UI-Backpressure.
- Yield-Aktionen sind in Telemetry Records abrufbar.
- Lazy Hydration und Prewarm werden bei kritischem Druck hinter sichtbare Arbeit sortiert.

**Gates:**

```bash
node scripts/run_xtend_tests.js fabric-lifecycle-boundary hydration-policy rmt-component-lifecycle-telemetry --json
```

**Evidence:**

- `xtendrmt/rmt-app-runtime.js` erzeugt Stream-Pressure-Records, terminale Scheduler-Samples und strukturierte Yield Actions fuer hohe/kritische Stream-Backpressure.
- `fabric/xtend-fabric.js` aggregiert App-Runtime Stream Pressure in `streamPressure` und spiegelt relevante Records in die Fabric-Backpressure-Summary.
- `fabric/hydration-policy.js` drosselt Lazy Hydration und pausiert Prewarm/Worker-Prewarm unter kritischer Stream Pressure hinter sichtbarer Arbeit.
- `xtendrmt/rmt-kernel-orchestration-controller.js` kann App-Runtime-Backpressure als Kernel-nahe Snapshot-/Performance-Spur aufnehmen.
- Gate: `node scripts/run_xtend_tests.js fabric-lifecycle-boundary hydration-policy rmt-component-lifecycle-telemetry --json` passed am 2026-06-19.
- Extra: `node scripts/run_xtend_tests.js fabric-telemetry-snapshot rmt-app-runtime --json` passed am 2026-06-19.
- Extra: `node scripts/run_xtend_tests.js rmt-kernel-orchestration --json` passed am 2026-06-19.

## RKFA-13: Production Bundle Closure

**Status:** `completed`

**Ziel:** PROD-Maraca-Bundles erhalten ein vollständiges Kernel-Feature-Adoption-Kapitel mit Lifecycle, Telemetry, Performance, Policy, Prewarm und Prerender Status.

**Betroffene Bereiche:**

- `xtend-maraca/index.js`
- `products/*`
- `catalog/*`
- `docs/de/*`
- `docs/en/*`
- `tests/platform/*`

**Umsetzung:**

- Report-Kapitel `kernelFeatureAdoption` oder erweiterte Kapitel `kernel`, `lifecycle`, `telemetry`, `performance`, `warmReentry`, `policyParity` erzeugen.
- Strict Fallbacks in PROD sichtbar machen.
- Bundle Budget Pass mit Runtime Expected Status verbinden.

**Akzeptanzkriterien:**

- Bundle Report beantwortet pro Capability: supported, active, degraded, blocked, diagnostics.
- PROD Gate fällt, wenn RMT Features verwendet werden, aber Runtime-/Bundle-Capabilities fehlen.
- Source-to-Sea Links verbinden RMT Source, Artifact Fingerprints, Runtime Feature Status und Tests.

**Gates:**

```bash
node scripts/run_xtend_tests.js maraca-bundle-report rmt-stack-docs epic14-rmt-tooling-release-gates --json
```

**Evidence:**

- `xtend-maraca/index.js` erzeugt `productionClosure` und `kernelFeatureAdoptionClosure` mit Capability-Matrix fuer Lifecycle, Telemetry, Performance, Policy Parity, Warm Reentry, Prewarm Worker und Prerender.
- `productionClosure.releaseConstraint` verbindet PROD-Enforcement, Strict-Fallbacks, Runtime Expected Status und Bundle-Budget-Pass.
- `productionClosure.sourceToSea` verbindet RMT Source-Fingerprint, Artifact-/Bundle-Fingerprints, Runtime Feature Status und Release-Tests.
- `xtend-maraca/index.d.ts` exportiert `MARACA_PRODUCTION_BUNDLE_CLOSURE_SCHEMA`, `MaracaProductionBundleClosureReport` und `createMaracaProductionBundleClosure`.
- Docs und Gates dokumentieren `productionClosure`, `kernelFeatureAdoptionClosure` und `xtend.maraca.production-bundle-closure.v1`.
- Gate: `node scripts/run_xtend_tests.js maraca-bundle-report rmt-stack-docs epic14-rmt-tooling-release-gates --json` passed am 2026-06-19.
- Extra: `node scripts/run_xtend_tests.js maraca-kernel-orchestration --json` passed am 2026-06-19.

## Empfohlene Umsetzungsschritte

1. RKFA-00, RKFA-01 und RKFA-02 zusammen starten, weil sie Evidence liefern und kaum Laufzeitrisiko tragen.
2. RKFA-03 ergänzen, sobald Maraca und Fabric dieselben Capability Keys nutzen.
3. RKFA-05 vor produktiver Worker-Adoption umsetzen; RKFA-04 liefert bereits den deterministischen Lifecycle-/Telemetry-Harness.
4. RKFA-06 und RKFA-07 als opt-in Warm-Reentry-Pfad liefern.
5. RKFA-08 und RKFA-09 erst nach stabiler Prewarm-/Hydration-Policy produktisieren.
6. RKFA-10 bis RKFA-13 als Release-Härtung und PROD-Bundle-Closure abschließen.

## Offene Architekturentscheidungen

- Soll Product Surface mittelfristig der Default-Bootpfad werden oder nur eine Report-/Evidence-Fassade bleiben?
- Soll `enablePrewarmWorker` initial `false`, `auto-if-supported` oder produktabhängig gesetzt werden?
- Wo liegt die Retention-Grenze für Prewarm-Chunks bei vielen Surface-Generationen?
- Welche Performance Baseline ist für `retained_warm_reuse` verbindlich genug, um Release-Gates zu steuern?
- Sollen Panic/Recovery Records immer an Fabric gehen oder nur bei Strict/Diagnostics Mode?

## Referenz-Gates Gesamtpaket

```bash
node scripts/run_xtend_tests.js rmt-kernel-orchestration maraca-bundle-report rmt-compatibility --json
```

```bash
node scripts/run_xtend_tests.js fabric-lifecycle-boundary fabric-lane-mapping hydration-policy rmt-component-lifecycle-telemetry --json
```

```bash
node scripts/run_xtend_tests.js surface-controller surface-manager rmt-surface-resource-graph-runtime surface-runtime-release-handoff --json
```

```bash
node scripts/run_xtend_tests.js rmt-vnext-lifecycle rmt-vnext-fabric-bridge rmt-component-fabric-ingestion --json
```
