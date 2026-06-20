# XTensions Architecture and Threat Model Contract

- Status: `accepted by XTN-00`
- Datum: 2026-06-20
- Backlog: `development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md`
- Workpackage: `XTN-00`
- Contract: `xtend.xtensions.architecture-threat-model.v1`
- HostController Contract Target: `xtend.xtensions.host-controller.v1`
- Signal Bridge Contract Target: `xtend.xtensions.signal-bridge.v1`
- Manifest Target: `xtend.maraca.xtension-manifest.v1`
- Runtime Report Target: `xtend.xtensions.runtime-report.v1`
- Diagnostic Trail Target: `xtend.xtensions.diagnostic-trail.v1`
- Dependency Policy: `xtend.native-first.dependency-diet-policy.v1`
- Boundary: `no-rmt-kernel-import-of-framework-runtime-types`
- Boundary: `no-framework-test-fixture-dependencies-in-xtend-package`
- Boundary: `no-vendored-third-party-frameworks-in-repo-or-npm-package`
- Boundary: `framework-pocs-use-contract-stubs-or-external-opt-in-peer-harnesses`
- Boundary: `no-implicit-global-framework-event-bus`
- Boundary: `no-shared-framework-state-across-xtension-boundaries`
- Boundary: `dynamic-import-requires-manifest-policy-and-integrity`
- Boundary: `xtensions-are-host-adapters-not-kernel-features`
- Zielzustand: `xtensions-source-of-truth-threat-model-ready`
- Folgepakete: `XTN-01`, `XTN-02`, `XTN-03`, `XTN-11`

## Zweck

Contract marker:

```text
schema: "xtend.xtensions.architecture-threat-model.v1"
```

Dieser Contract startet XTN-00 und friert die Architektur-, Sicherheits- und Dependency-Annahmen fuer XTensions ein. XTensions sollen externe Frameworks ueber native XTend-Technologien orchestrierbar machen: RMT-Kernel, Scheduler Records, Fibers, Lanes in Fabric, Signals, Reactivity, Surface Records, Diagnostics und Maraca-Artefakte.

Die wichtigste Schutzregel lautet:

```text
External frameworks are orchestration targets, not XTend dependencies.
```

React, Vue, Three.js, Leaflet, Chart.js oder aehnliche Bibliotheken duerfen fuer XTensions-PoCs nicht als Core-, Runtime-, Test- oder vendored Dependencies in das XTend-Repo oder das XTend-NPM-Paket wandern. Testkomponenten muessen frameworkless Contract Stubs nutzen oder in explizit externen, opt-in Peer-Harnesses laufen.

## Architekturentscheidung

XTensions sind Host-Adapter fuer externe Runtime-Inseln. Der RMT-Kernel bleibt host-neutral und kennt keine Framework-Typen, Imports oder Lifecycle-Sonderfaelle.

| Ebene | Rolle in XTensions | Boundary |
|-------|--------------------|----------|
| RMT-Kernel | beschreibt Schedules, Fibers, Operations, Signals und Policy Records | kein Framework-Import, kein Framework-Mount |
| Fabric | vermittelt Lanes, Fibers, Diagnostics, Telemetry, Backpressure und Lifecycle Evidence | kein impliziter globaler Event Bus |
| Signals/Reactivity | transportiert serialisierbare State- und Update-Records | keine Framework-Proxies oder Stores ueber Grenzen |
| Surface Runtime | besitzt Container, Focus, Layout, Persistence, Fallback und Shell Lifecycle | Host-owned DOM Boundary |
| HostController | kapselt genau eine XTension Runtime und uebersetzt Records in Framework-Idiomatik | Adapter-owned Runtime |
| Maraca | beschreibt Entry, Contract, Capability, Fingerprint, Lazy Policy und Integrity | Build-Provenance vor Runtime Load |
| Tooling/LSP/AI | liest Contracts und Reports ohne Runtime-Ausfuehrung | Static Introspection only |

## Begriffe

| Begriff | Definition |
|---------|------------|
| `XTension` | Eine deklarierte Integrationsflaeche fuer eine externe Runtime oder Bibliothek, die ueber native XTend Contracts orchestriert wird. |
| `HostController` | Der adapter-owned Controller, der Mount, Update, Suspend, Resume, Error, Unmount, Cleanup und Event-Normalisierung fuer genau eine XTension verantwortet. |
| `XTensionContract` | Statischer, toollesbarer Vertrag fuer accepts, emits, capabilities, framework metadata, lifecycle policy, security policy und dependency class. |
| `XTensionManifest` | Maraca-/Build-seitiger Record fuer Entry, Version, Contract Snapshot, Lazy Policy, Integrity, CSP, Fallback und Artefakt-Fingerprint. |
| `KernelSignal` | Serialisierbarer Downstream-Record aus RMT/Fabric an eine XTension mit target, lane, priorityHint, payload, schemaRef und policy. |
| `SurfaceEvent` | Normalisierter Upstream-Record aus einer XTension an Fabric mit owner, direction, payloadSchema, lane, trustBoundary, timestamp und sourceRef. |
| `Framework Runtime` | Externe Bibliothek wie React, Vue, Three.js, Leaflet oder Chart.js. Sie bleibt ausserhalb von XTend-Core und wird nur ueber HostController angesprochen. |
| `Frameworkless Contract Stub` | Testadapter, der relevante Framework-Lifecycle- und Event-Formen simuliert, ohne das echte Dritt-Framework zu installieren oder zu vendoren. |
| `External Opt-in Peer Harness` | Separates, nicht in XTend-Core paketiertes Test-/Demo-Projekt, das echte Framework-Peers bereitstellt und XTensions gegen reale Libraries prueft. |

## Protected Assets

| Asset | Schutzbedarf |
|-------|--------------|
| RMT Kernel Neutrality | Der Kernel darf keine React-, Vue-, Three-, Leaflet-, Chart- oder DOM-Sondertypen importieren. |
| XTend Package Integrity | Dritt-Frameworks duerfen nicht als Dependencies, vendored Assets oder Testartefakte in das XTend-NPM-Paket gelangen. |
| App Shell Stability | Eine fehlerhafte XTension darf Shell, Surface Manager, Routing, Focus und State nicht unkontrolliert blockieren. |
| Fabric Lane Integrity | XTension-Arbeit muss Lane-, Fiber-, Budget- und Backpressure-Evidence erzeugen. |
| Signal Payload Safety | Downstream- und Upstream-Payloads muessen serialisierbar, schemafaehig und policy-gatebar bleiben. |
| Reactivity Boundary | Framework-Proxies, Stores, Contexts und Signals duerfen nicht ueber XTension-Grenzen leaken. |
| DOM Ownership | Container, Shadow DOM, Styles, Focus, Event Listener, Timers, Observers, Workers und Animation Frames muessen eindeutig besessen und cleanup-faehig sein. |
| Build Provenance | Lazy XTension-Artefakte brauchen Entry-, Contract-, Version- und Integrity-Fakten vor dem Laden. |
| Tooling Safety | LSP, DevTools und AI-Agenten duerfen Contracts lesen, ohne Framework-Code auszufuehren. |

## Trust Boundaries

| Boundary | Beschreibung | Regel |
|----------|--------------|-------|
| Kernel Boundary | RMT-Kernel, Parser, Compiler, Schedules und Fibers | Host-neutral; keine Framework-Runtime-Imports |
| Fabric Boundary | Lanes, Fibers, Telemetry, Diagnostics und Backpressure | Events nur als owner-/payload-gebundene Records |
| Reactivity Boundary | XTend Signals, `xstate`, RMT State Selectors und injected adapters | keine fremden Proxy-/Store-Objekte uebergeben |
| HostController Boundary | Framework-spezifische Mount-/Update-/Unmount-Logik | Adapter-owned, idempotent, cleanup-pflichtig |
| DOM Boundary | Container, Shadow Root, Styles, Focus und Event Listener | eindeutiger Owner, keine globalen DOM-Sinks ohne Policy |
| Build Boundary | Maraca Entry, Contract, Bundle Report und `.xtend-build` Provenance | kein Laden ohne Manifest-/Integrity-Fakten |
| Test Fixture Boundary | lokale Stubs, Browser fixtures und optionale echte Framework-Proben | keine externen Framework-Dependencies im XTend-Paket |
| Remote Boundary | spaetere remote-faehige XTensions | nur ueber E16 Remote Surface Policy, Integrity, Origin und Fallback |

## Dependency-Entscheidung

XTensions uebernehmen die Native-First Dependency Diet Policy. Fuer XTN-00 gilt:

| Dependency-Klasse | XTensions-Default | Begruendung |
|-------------------|-------------------|------------|
| `core-runtime-dependency` | `blocked` | Dritt-Frameworks duerfen nicht in Browser-, Component-, RMT-, Fabric- oder Loader-Core wandern. |
| `runtime-peer-dependency` | `blocked-until-XTN-13-or-explicit-exception` | Peer-Strategie braucht Package-, Owner-, Security- und Compatibility-Entscheidung. |
| `dev-test-dependency` | `blocked-for-framework-pocs-in-core-repo` | Tests duerfen keine echten Frameworks als Repo-Dependency erzwingen. |
| `docs-demo-dependency` | `blocked-inside-core-package` | Demos duerfen keine Frameworks in NPM-Files oder Git-vendored Assets bringen. |
| `external-opt-in-peer-harness` | `allowed-outside-core-package` | Echte Framework-Proben duerfen separat, opt-in und nicht release-relevant laufen. |
| `frameworkless-contract-stub` | `allowed` | Ermoeglicht lokale, deterministische Contract-Gates ohne Dritt-Framework. |
| `vendored-third-party-framework` | `blocked` | Keine ganzen Frameworks als eingecheckte Dateien, Bundles oder Fixture-Kopien. |

## Test-Fixture Dependency Boundary

XTensions brauchen realistische Testkomponenten. Diese duerfen aber keine neue Produkt- oder Repo-Abhaengigkeit erzeugen.

Erlaubt:

- frameworkless Contract Stubs fuer React-/Vue-/Three-/Leaflet-/Chart-aehnliche Lifecycles
- Mini-Adapter, die nur XTend-eigene Test-APIs nutzen
- Browser-Fixtures, die vorhandene XTend-Runtime, Fabric, RMT und SurfaceManager verwenden
- Golden-Records fuer Manifest, Contract, Signals, SurfaceEvents, Cleanup und Diagnostics
- externe opt-in Peer-Harnesses ausserhalb des XTend-Core-Pakets, wenn sie nicht in `files`, `exports`, Root Dependencies oder Release-Artefakte gelangen

Nicht erlaubt:

- `react`, `react-dom`, `vue`, `three`, `leaflet`, `chart.js` oder vergleichbare Frameworks in Root- oder Workspace-Dependencies fuer XTensions-PoCs
- vendored Framework-Bundles in `components/`, `fabric/`, `xtendrmt/`, `xtend-maraca/`, `tools/rmt-language/`, `tests/fixtures/` oder `products/`
- CDN- oder Netzwerkpflicht fuer lokale XTensions-Gates
- Testfixtures, die echte Framework-APIs als unverzichtbaren lokalen Gate voraussetzen
- Rollup-/Maraca-Bundles, die Framework-Code als XTend-Artefakt ausliefern

## Threat Classes

| Threat | Risiko | Required Control |
|--------|--------|------------------|
| Framework Dependency Creep | Test- oder PoC-Abhaengigkeit wird versehentlich Teil des Produktpakets | Dependency class gate, package file audit, no vendored frameworks |
| Kernel Boundary Collapse | Framework-spezifische Lifecycle-Logik wandert in den RMT-Kernel | HostController-only rule, static contracts, no kernel imports |
| Event Coupling Chaos | Framework Events werden zu freiem globalem Bus | `SurfaceEvent` owner, direction, payloadSchema, lane und policy |
| Reactivity Leak | Vue Proxies, React Context, Stores oder mutable objects verlassen die XTension | serializable payload gate, clone/sanitize, no framework state across boundary |
| Render Loop Escape | Three.js oder aehnliche Hosts starten freien `requestAnimationFrame` Loop | host-registered scheduled endpoint, visibility pause, cleanup evidence |
| Cleanup Failure | Framework Root, timers, observers, listeners oder WebGL Ressourcen bleiben nach Unmount aktiv | idempotent unmount contract, lifecycle diagnostics, cleanup fiber |
| Supply Chain Drift | Framework-Version oder License wird ohne Review produktnah | explicit peer/exception decision, lockfile evidence outside core, XTN-13 |
| CSP Bypass | Dynamic import, worker, wasm oder image/connect policy wird zu breit | manifest CSP facts, deny-by-default capability policy, strict gate |
| Tooling Runtime Execution | LSP oder AI-Agent fuehrt Framework-Entry aus, um Contract zu lesen | static contract export, build snapshot, no runtime introspection |
| Remote Surface Confusion | XTensions werden unkontrolliert als Remote Runtime Loader genutzt | E16 remote policy required, no remote runtime in kernel |

## Mandatory Facts fuer Folgepakete

Jede produktionsnahe XTension braucht spaetestens ab `XTN-03` diese Fakten:

- `id`
- `owner`
- `framework`
- `frameworkVersionRange`
- `dependencyClass`
- `entry`
- `contract`
- `capabilities`
- `accepts`
- `emits`
- `lifecyclePolicy`
- `cleanupPolicy`
- `surfaceBinding`
- `lanePolicy`
- `payloadSchemas`
- `fallback`
- `degradationPolicy`
- `csp`
- `integrity`
- `testMode`
- `testDependencyPolicy`

## Diagnostic Baseline

| Code | Severity | Bedeutung |
|------|----------|-----------|
| `xtensions.dependency.framework_in_core` | error | Eine XTension bringt ein echtes Framework in Core-, Runtime- oder Workspace-Dependencies. |
| `xtensions.dependency.framework_vendored` | error | Ein Framework-Bundle wurde als Repo- oder NPM-Artefakt vendored. |
| `xtensions.test.fixture.requires_framework` | error | Ein lokales Gate benoetigt ein echtes Dritt-Framework. |
| `xtensions.kernel.framework_import` | error | Kernel-, Parser- oder Compiler-Code importiert Framework-Typen oder Runtime-Code. |
| `xtensions.contract.missing` | error | Eine XTension besitzt keinen statisch lesbaren Contract. |
| `xtensions.contract.runtime_introspection` | error | Tooling muesste Framework-Code ausfuehren, um den Contract zu lesen. |
| `xtensions.event.owner_missing` | error | Ein SurfaceEvent besitzt keinen Owner. |
| `xtensions.event.payload_schema_missing` | error | Ein SurfaceEvent besitzt kein Payload Schema. |
| `xtensions.payload.non_serializable` | error | Payload enthaelt Proxy-, Function-, DOM- oder Framework-Objekte. |
| `xtensions.lifecycle.cleanup_missing` | error | HostController beschreibt keinen Cleanup fuer Runtime-Ressourcen. |
| `xtensions.loop.unscheduled_raf` | error | Render Loop laeuft ausserhalb von Fiber-/Lane-/Host-Policy. |
| `xtensions.manifest.integrity_missing` | error | Lazy oder remote-faehiges Artefakt hat keine Integrity-Fakten. |

## Source-of-Truth

| Artefaktklasse | Fuehrende Rolle |
|----------------|-----------------|
| `development/BACKLOG-XTensions-Framework-Integration-Oekosystem.md` | Backlog, Workpackage-Reihenfolge, Scope und Status |
| `development/XTensions-Architecture-and-Threat-Model-Contract.md` | XTN-00 Architektur-, Threat-Model- und Dependency-Baseline |
| `development/XTend-Native-First-Dependency-Diet-Policy-Contract.md` | Dependency-Klassen, Blocking-Regeln, Review- und Gate-Modell |
| `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md` | Host-neutrale RMT- und Migrationsgrenzen |
| `development/XTendRMT-vNext-Surface-Registry-Contract.md` | Surface Registry und Lane-/Operation-Beziehungen |
| `development/XTendRMT-vNext-Cross-Surface-Event-Protocol-Contract.md` | Event Records fuer Cross-Surface-Kommunikation |
| `development/XTendRMT-vNext-Event-Governance-Contract.md` | Owner-, Payload-, Direction- und Policy-Regeln fuer Events |
| `development/XTendRMT-vNext-Remote-Surfaces-Threat-Model-Contract.md` | Remote Boundary fuer spaetere remote-faehige XTensions |
| `development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md` | App Shell, Surface Runtime, Fallback und Shell-first Verhalten |
| `xtendrmt/` | RMT-Kernel-, Scheduler-, Surface-, Reactivity- und Runtime-Flaechen |
| `fabric/` | Fabric Lanes, Fibers, Diagnostics, Backpressure und Runtime Bridges |
| `components/xstate.js` | optionale State-/Reactivity-Bruecke ausserhalb des RMT-Kernels |
| `xtend-maraca/` | Build, Bundle Report, Artefakte, Lazy Loading und Provenance |
| `tools/rmt-language/` | Parser-, Compiler-, LSP-, Agent- und Diagnostic-Fakten |
| `tests/` | offlinefaehige Contract-, Fixture-, Browser- und Supply-Chain-Gates |

## Handoff Rules

- `XTN-01` darf HostController Lifecycle und Cleanup definieren, aber keine echten Framework-Dependencies einfuehren.
- `XTN-02` muss Signals und Events als Fabric-/RMT-Records modellieren, nicht als Framework Event Bus.
- `XTN-03` muss Manifest- und Build-Provenance-Felder fuer Dependency Class, Test Mode und Integrity aufnehmen.
- `XTN-04` muss statische Contract-Introspection ohne Runtime-Ausfuehrung pruefen.
- `XTN-05` darf eine Runtime Capability Registry bauen, aber keine zweite globale Surface Registry erzeugen.
- `XTN-06` bis `XTN-09` duerfen echte React/Vue/Three/Leaflet/Chart-Proben nur als externe opt-in Peer-Harnesses oder explizit genehmigte Ausnahme behandeln.
- `XTN-11` muss Supply-Chain-, CSP-, Integrity- und Package-File-Gates vor produktiver Adapterfreigabe haerten.
- `XTN-13` entscheidet erst spaeter, ob und wie Framework-Peers in separaten XTension-Packages beschrieben werden duerfen.

## Definition of Done

| Kriterium | Ergebnis |
|-----------|----------|
| XTensions sind als Host-Adapter, nicht als Kernel-Feature, definiert | erfuellt |
| RMT-Kernel Boundary ist eingefroren | erfuellt: kein Framework-Runtime-Import |
| Test-Fixture Dependency Boundary ist festgelegt | erfuellt: keine echten Frameworks in XTend-Core-Paket |
| Vendored Dritt-Frameworks sind blockiert | erfuellt |
| Remote vs lokal/package-basiert ist vorentschieden | erfuellt: lokal/package-basiert zuerst, remote nur ueber E16 Policy |
| Source-of-Truth fuer Folgepakete ist benannt | erfuellt |
| Threat Classes und Diagnostic Baseline sind definiert | erfuellt |

## Gate

`XTN-00` ist ein Scope-, Threat-Model- und Dependency-Boundary-Paket. Ein Runtime-, Parser- oder Framework-Test entsteht erst ab `XTN-01` bis `XTN-03`.

Dokumentations- und lokale Policy-Gates:

```bash
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```

Ein spaeterer XTensions-Gate muss zusaetzlich pruefen:

- keine echten Frameworks in Root-/Workspace-Dependencies fuer XTensions-PoCs
- keine vendored Framework-Bundles in Repo- oder NPM-Files
- keine lokalen XTensions-Fixtures mit Netzwerkpflicht
- keine Kernel-, Parser- oder Compiler-Imports von Framework-Runtimes

## Verifikation

Lokal ausgefuehrt am 2026-06-20:

```bash
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```

Ergebnis:

- `references`: `passed`, 2398 Passes, 0 Failures, 0 Warnings
- `supply-chain`: `passed`, 74 Passes, 0 Failures, 0 Warnings
- Supply-Chain-Klassifikation: `dependencyCount: 0`
