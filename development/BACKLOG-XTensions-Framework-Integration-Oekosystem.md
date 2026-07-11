# BACKLOG: XTensions Framework-Integration Oekosystem

- Status: `proposed`
- Datum: 2026-06-20
- Source Doc: `/Users/konnitroetscher/Downloads/xtensions-konzeptpapier.md`
- Source Context: `XTDC Konzeptpapier v0.1`
- Contract Target: `xtend.xtensions.host-controller.v1`
- Manifest Target: `xtend.maraca.xtension-manifest.v1`
- Runtime Report Target: `xtend.xtensions.runtime-report.v1`
- Diagnostic Trail Target: `xtend.xtensions.diagnostic-trail.v1`
- Vanilla Adapter Target: `xtend.xtensions.vanilla-adapter.v1`
- Leitlinie: `host-neutral-kernel`, `adapter-owned-runtime`, `fabric-mediated-events`, `observable-by-default`, `explicit-capabilities`
- Boundary: `no-rmt-kernel-import-of-framework-runtime-types`
- Boundary: `no-framework-test-fixture-dependencies-in-xtend-package`
- Boundary: `no-vendored-third-party-frameworks-in-repo-or-npm-package`
- Boundary: `framework-pocs-use-contract-stubs-or-external-opt-in-peer-harnesses`
- Boundary: `no-implicit-global-framework-event-bus`
- Boundary: `no-shared-framework-state-across-xtension-boundaries`
- Boundary: `dynamic-import-requires-manifest-policy-and-integrity`
- Boundary: `hostcontroller-lifecycle-must-be-fabric-observable`
- Boundary: `xtensions-do-not-weaken-native-first-owned-runtime-goals`
- Boundary: `legacy-global-dom-requires-iframe-sandbox`
- Bezug:
  - `development/XTensions-Architecture-and-Threat-Model-Contract.md`
  - `development/XTensions-HostController-Lifecycle-Contract.md`
  - `development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md`
  - `development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md`
  - `development/XTensions-Static-Contract-Introspection-Contract.md`
  - `development/XTensions-Runtime-Capability-Registry-and-Loading-Policy-Contract.md`
  - `development/XTensions-React-HostController-PoC-and-Scheduling-Hints-Contract.md`
  - `development/XTensions-Vue-HostController-PoC-and-Explicit-Update-Adapter-Contract.md`
  - `development/XTensions-Chart-Leaflet-Imperative-Host-PoCs-Contract.md`
  - `development/XTensions-Three-Fiber-Render-Loop-PoC-Contract.md`
  - `development/XTensions-Diagnostic-Trail-Contract.md`
  - `development/XTensions-Vanilla-Host-Adapter-und-Legacy-Sandbox-Contract.md`
  - `development/XTensions-Angular-Host-Adapter-Contract.md`
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `development/EPIC_E15_RMT_vNext_Syntax.md`
  - `development/XTendRMT-vNext-Surface-Registry-Contract.md`
  - `development/EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry.md`
  - `development/XTendRMT-vNext-Remote-Surface-Manifest-Contract.md`
  - `development/XTendRMT-vNext-Cross-Surface-Event-Protocol-Contract.md`
  - `development/XTendRMT-vNext-Event-Governance-Contract.md`
  - `development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md`
  - `development/XTend-Native-First-Framework-Leverage-Layer-Contract.md`
  - `development/BACKLOG-RMT-Kernel-Feature-Adoption.md`

## Zweck

Dieses Backlog ueberfuehrt das XTDC-Konzeptpapier zu `XTensions` in startbare, gatebare Arbeitspakete. XTensions beschreiben einen formalen HostController-Layer, der externe Frameworks und Rendering-Bibliotheken als isolierte, fabric-vermittelte Surface-Runtimes in XTend/RMT-Anwendungen einbinden kann.

Die Idee ist produktstrategisch plausibel: Enterprise-Frontends bestehen oft aus React-, Vue-, Chart-, Map-, 3D- und nativen XTend-Teilen. XTensions sollen diese Realitaet koordinierbar machen, ohne Migration zu erzwingen und ohne den RMT-Kernel an konkrete Frameworks zu koppeln.

## Ergebnis der Konzeptpruefung

### Tragfaehige Punkte

- Das Konzept passt zur bestehenden RMT-Leitlinie: Der Kernel orchestriert host-neutral; konkrete Runtime-Arbeit bleibt Adapter-/Host-Aufgabe.
- Fabric als einzige Grenze fuer Lifecycle, Events, Diagnostics und Telemetry ist konsistent mit SurfaceManager, Remote Surfaces und Kernel Feature Adoption.
- Static Contracts fuer XTensions passen zu bestehenden Contract-, LSP-, AI-Agent- und DevTools-Zielen.
- Maraca-Manifest, Lazy Loading, Build-Provenance und Digital-Twin-Trail sind die richtigen Integrationspunkte.
- Die Beispiel-Domaenen React, Vue, Chart.js, Leaflet und Three.js bilden sinnvolle Risikoklassen: deklarativ, reaktiv, imperativ, event-reich und render-loop-getrieben.

### Korrekturbedarf vor Umsetzung

- `HostController` darf keine Framework-Sonderlogik in den RMT-Kernel tragen. Der Kernel sieht nur Capability-, Lifecycle-, Schedule- und Signal-Records.
- React `startTransition` ist nur ein Scheduling-Hint, keine harte Kernel-Prioritaetskontrolle. Prioritaeten muessen als Budget-/Lane-Hints und nicht als deterministische Steuerung formuliert werden.
- Three.js `requestAnimationFrame` darf nicht frei laufen. Ein PoC muss Cancellation, Visibility, Low-Power, Backpressure und Frame-Budget-Evidence nachweisen.
- Vue `globalProperties.$patch` ist kein universeller Vue-Vertrag. Der Vue-Host braucht eine explizite Adapter-Update-Funktion.
- Der statische `contract`-Getter braucht eine TypeScript-kompatible Form als Klassenstatic, Constructor-Side-Interface oder expliziter Modulexport. Ein Instanz-Interface mit `static readonly` reicht nicht.
- Dynamic Imports muessen mit CSP, Manifest-Policy, Integritaet, Versionierung, Supply-Chain-Gates und Offline-/Fallback-Verhalten abgestimmt werden.
- Upstream-Events brauchen Event-Governance: Owner, Richtung, Payload-Schema, Lane, Trust Boundary und Backpressure-Regel statt freier Eventnamen.

### Entscheidung

Das Konzept wird als `proposed` Backlog-Kandidat angenommen. Die erste Phase muss Contracts, Threat Model, Manifest-Policy und minimalen Runtime-Harness liefern, bevor framework-spezifische Adapter als produktive Features gelten.

## Zielbild

XTensions werden als explizite Surface-Adapter modelliert:

- Eine XTension besitzt Identitaet, Framework, Version, Capabilities, accepted signals, emitted events, Lifecycle und Security Policy.
- Ein HostController kapselt genau eine Framework-Runtime-Instanz und bindet sie an ein klar besessenes Container-Element oder Shadow Root.
- Downstream-Signale kommen aus RMT/Fabric als serialisierbare Records.
- Upstream-Events werden ueber Fabric normalisiert, validiert, diagnostiziert und budgetiert.
- Maraca erzeugt fuer XTensions eigene Artefakte mit Fingerprint, Version, Entry, Lazy Policy, CSP-Anforderungen, Peer-Dependencies und Contract-Snapshot.
- LSP, DevTools und AI-Agenten koennen XTension-Contracts lesen, ohne Framework-Quellcode auszufuehren.

## Nicht-Ziele

- Keine Abloesung der Native-First- und Owned-Component-Strategie.
- Keine externe UI-Framework-Runtime als Default-Dependency des Core-Pakets.
- Keine direkte Remote-Code-Ausfuehrung im RMT-Kernel.
- Keine globale Framework-Registry neben Surface Registry, Enterprise Surface Registry und Maraca Manifest.
- Keine implizite Store-, Context- oder Event-Bus-Kopplung zwischen XTensions.
- Keine framework-spezifischen Sonderfaelle in Parser, Core-Compiler oder Kernel.
- Keine Netzwerk- oder CDN-Pflicht fuer lokale Tests und Referenzfixtures.

## Definition of Ready

Ein XTensions-Workpackage darf gestartet werden, wenn:

- betroffene Kernel-, Fabric-, Maraca-, Surface-, Tooling- und Testpfade benannt sind
- die Kernel-Boundary `no-rmt-kernel-import-of-framework-runtime-types` explizit unveraendert bleibt
- Runtime-Dependencies als Peer, optional, vendored test fixture oder out-of-scope klassifiziert sind
- Lifecycle, Ownership, Cleanup und Error Boundary fuer die Ziel-XTension beschrieben sind
- CSP, Dynamic Import, Integrity und Fallback-Faelle benannt sind
- lokale Gates ohne Netzwerkzugriff moeglich sind oder ein klarer Handoff fuer externe Dependency-Gates existiert

## Backlog-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `XTN-00` | P0 | completed | WS0 | Source-of-Truth, Terminologie und Threat Model einfrieren | Konzeptpapier |
| `XTN-01` | P0 | completed | WS1 | HostController Contract und Lifecycle-Semantik definieren | `XTN-00` |
| `XTN-02` | P0 | completed | WS2 | Fabric Signal Bridge und Event Governance modellieren | `XTN-00`, `XTN-01` |
| `XTN-03` | P0/P1 | completed | WS3 | Maraca XTension Manifest, Artefakte und Build-Provenance spezifizieren | `XTN-01`, `XTN-02` |
| `XTN-04` | P1 | completed | WS4 | Static Contract Introspection fuer LSP, DevTools und AI-Agenten vorbereiten | `XTN-01`, `XTN-02`, `XTN-03` |
| `XTN-05` | P1 | completed | WS5 | Runtime Capability Registry und Adapter Loading Policy bauen | `XTN-01`, `XTN-03`, `XTN-04` |
| `XTN-06` | P1 | completed | WS6 | React HostController PoC mit Scheduling-Hints bauen | `XTN-01`, `XTN-02`, `XTN-05` |
| `XTN-07` | P1/P2 | completed | WS6 | Vue HostController PoC mit explizitem Update-Adapter bauen | `XTN-01`, `XTN-02`, `XTN-05` |
| `XTN-08` | P1/P2 | completed | WS7 | Chart.js und Leaflet imperative Host PoCs bauen | `XTN-01`, `XTN-02`, `XTN-05` |
| `XTN-09` | P1 | completed | WS8 | Three.js Fiber-controlled Render Loop PoC bauen | `XTN-01`, `XTN-02`, `XTN-05` |
| `XTN-10` | P1 | completed | WS9 | Digital Twin Diagnostic Trail fuer XTension-Aktionen integrieren | `XTN-02`, `XTN-03` |
| `XTN-11` | P1 | completed | WS10 | Security, CSP, Supply Chain und Integrity Gates haerten | `XTN-03`, `XTN-05` |
| `XTN-12` | P2 | completed | WS11 | Multi-Framework Dashboard Fixture und Browser-Smokes bauen | `XTN-06` bis `XTN-09` |
| `XTN-13` | P2 | completed | WS12 | XTension Registry und Package-Strategie entscheiden | `XTN-03`, `XTN-11` |
| `XTN-14` | P2 | completed | WS13 | Docs, Migration Guide und Enterprise Adoption Handoff schreiben | `XTN-12`, `XTN-13` |
| `XTN-15` | P2 | completed | WS14 | Vanilla Host Adapter und Legacy Sandbox Boundary spezifizieren | `XTN-01`, `XTN-03`, `XTN-11` |
| `XTN-16` | P2 | completed | WS14 | OpenUI5 Host Adapter und Product-local Runtime Boundary spezifizieren | `XTN-03`, `XTN-11`, `XTN-15` |
| `XTN-17` | P2 | completed | WS14 | Angular Host Adapter und AOT/Zoneless Boundary spezifizieren | `XTN-03`, `XTN-11`, `XTN-16` |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS0 | Konzept in XTend-Begriffe, Boundaries und Threat Model uebersetzen |
| WS1 | HostController als framework-neutralen Runtime-Vertrag definieren |
| WS2 | Signal-, Event-, Lane-, Payload- und Ownership-Regeln an Fabric anbinden |
| WS3 | Maraca-Authoring, Manifest, Lazy Loading und Build-Artefakte beschreiben |
| WS4 | Contract-Introspection fuer Tooling und AI-Agenten gatebar machen |
| WS5 | Adapter Loading, Capability Negotiation und Fallbacks runtime-nah abbilden |
| WS6 | deklarative Framework-Hosts wie React und Vue validieren |
| WS7 | imperative API-Hosts wie Chart.js und Leaflet validieren |
| WS8 | render-loop-getriebene Hosts wie Three.js unter Kernel-Budget pruefen |
| WS9 | Diagnostic Records und Digital Twin Trail produktfaehig machen |
| WS10 | Security-, CSP-, Supply-Chain- und Integrity-Policies absichern |
| WS11 | echte Multi-Framework-App als Regression- und Demo-Flaeche bauen |
| WS12 | Registry-, Package- und Versionierungsmodell entscheiden |
| WS13 | Migration, Doku und Release-Handoff abschliessen |
| WS14 | Vanilla- und Legacy-Adapter mit DOM-Boundary-Policy absichern |

## Workpackages im Detail

### XTN-00 - Source-of-Truth, Terminologie und Threat Model einfrieren

- Prioritaet: `P0`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - XTensions als Produkt- und Architekturbegriff gegen bestehende Surface-, Remote-Surface-, Host-Adapter- und Native-First-Begriffe abgrenzen.
- Scope:
  - Glossar fuer `XTension`, `HostController`, `XTensionContract`, `XTensionManifest`, `SurfaceEvent`, `KernelSignal`
  - Threat Model fuer externe Runtime-Bibliotheken, Dynamic Import, Event Bridge, DOM Ownership und Cleanup
  - Entscheidung, ob XTensions ausschliesslich lokale/package-basierte Adapter sind oder auch Remote-Surface-Manifeste referenzieren duerfen
  - Mapping auf vorhandene Contracts: Surface Registry, Remote Manifest, Cross-Surface Events, Fabric Diagnostics, Maraca Reports
- Zielartefakte:
  - `development/XTensions-Architecture-and-Threat-Model-Contract.md`
  - aktualisierte Bezugsmatrix zu E15, E16, SurfaceManager und Native-First
- Implementierungsnotiz:
  - XTN-00 friert XTensions als Host-Adapter-Schicht ein: Externe Frameworks sind Orchestrierungsziele, keine XTend-Dependencies.
  - Testkomponenten fuer React-, Vue-, Three-, Leaflet- oder Chart-aehnliche Lifecycles muessen frameworkless Contract Stubs oder externe opt-in Peer-Harnesses nutzen.
  - Echte Dritt-Frameworks bleiben aus Root-/Workspace-Dependencies, NPM-Files, lokalen Gates und vendored Repo-Artefakten heraus, bis XTN-13 oder eine explizite Dependency-Ausnahme anders entscheidet.
- Definition of Done:
  - XTensions haben eine eindeutige Grenze zu Remote Surfaces und SurfaceManager
  - Kernel-Boundary ist schriftlich fixiert
  - Security-Baseline ist reviewbar
  - Test-Fixture-Dependency-Boundary ist fixiert

### XTN-01 - HostController Contract und Lifecycle-Semantik definieren

- Prioritaet: `P0`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - Einen framework-neutralen HostController-Vertrag fuer Mount, Update, Suspend, Resume, Error, Unmount und Cleanup spezifizieren.
- Scope:
  - Lifecycle-Signale `surface:ready`, `surface:suspended`, `surface:resumed`, `surface:destroyed`, `surface:error`
  - Container Ownership: explizites Host-Element, Shadow DOM Policy, Style Boundary, Focus Boundary
  - Cleanup-Pflichten fuer Event Listener, Timers, Observers, Animation Frames, Workers und Framework Roots
  - Fehlersemantik: recoverable, terminal, degraded, policy-blocked
- Zielartefakte:
  - `xtend.xtensions.host-controller.v1`
  - `development/XTensions-HostController-Lifecycle-Contract.md`
  - `tools/xtensions/host-controller-contract.js`
  - `tools/xtensions/host-controller-contract.d.ts`
  - `tests/fixtures/xtensions/host-controller-dummy.json`
  - `tests/xtensions/xtensions_host_controller_suite.js`
- Implementierungsnotiz:
  - XTN-01 fuehrt einen frameworkless HostController-Contract ein, keinen React-/Vue-/Three-/Leaflet-Adapter.
  - Dummy-Hosts modellieren Lifecycle, Cleanup, Container Ownership und Diagnostics ohne externe Runtime-Imports.
  - `assertNoFrameworkDependencies()` prueft Root-Manifeste und echte `import`/`require`-Statements gegen die blockierten Framework-Pakete.
  - Package-Metadaten und Export bleiben Contract-orientiert; Framework-PoCs muessen spaeter als externe opt-in Peer-Harnesses oder durch explizite Dependency-Entscheidung in `XTN-13` getrennt werden.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-host-controller --json`
- Definition of Done:
  - HostController ist ohne React/Vue/Three.js importierbar testbar
  - Lifecycle-Records sind serialisierbar und Fabric-kompatibel
  - Unmount ist idempotent und diagnostizierbar

### XTN-02 - Fabric Signal Bridge und Event Governance modellieren

- Prioritaet: `P0`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - Bidirektionale Signale zwischen RMT/Fabric und XTensions als kontrollierte, typisierte und diagnostizierbare Records definieren.
- Scope:
  - Downstream `KernelSignal` mit target, lane, priorityHint, payload, schemaRef und policy
  - Upstream `SurfaceEvent` mit owner, direction, payloadSchema, lane, trustBoundary und timestamp
  - Backpressure, event coalescing, rate limits und dead-letter diagnostics
  - Verbot freier Wildcard-Events in produktiven Contracts
- Zielartefakte:
  - `xtend.xtensions.signal-bridge.v1`
  - `development/XTensions-Signal-Bridge-and-Event-Governance-Contract.md`
  - `tools/xtensions/signal-bridge-contract.js`
  - `tools/xtensions/signal-bridge-contract.d.ts`
  - `tests/fixtures/xtensions/signal-bridge-valid.json`
  - `tests/xtensions/xtensions_signal_bridge_suite.js`
- Implementierungsnotiz:
  - XTN-02 modelliert `KernelSignal` downstream und `SurfaceEvent` upstream als serialisierbare Records, nicht als Runtime-Eventbus.
  - Die Governance-Matrix deckt React-, Vue-, Leaflet-, Chart.js- und Three-aehnliche Framework-Klassen als Daten ab, ohne Framework-Code zu importieren.
  - Fabric-Lanes werden gegen die kanonischen RMT-vNext Scheduler-Lanes normalisiert; Policy-Verletzungen erzeugen Diagnostics und Dead-Letter-Records.
  - Wildcard-, Global- und Bus-artige Eventnamen sind fuer produktive XTension-Contracts verboten.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-signal-bridge --json`
- Definition of Done:
  - Events sind owner- und payload-schemagebunden
  - Fabric kann XTension-Events reporten, ohne Frameworks zu kennen
  - Policy-Verletzungen erzeugen strukturierte Diagnostics

### XTN-03 - Maraca XTension Manifest, Artefakte und Build-Provenance spezifizieren

- Prioritaet: `P0/P1`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - XTensions im Maraca-Build als eigene Artefakte mit Fingerprint, Contract Snapshot und Lazy Loading Policy ausdruecken.
- Scope:
  - DSL-/Manifest-Entwurf fuer `xtension`
  - `entry`, `framework`, `version`, `lazy`, `contract`, `capabilities`, `integrity`, `csp`, `fallback`
  - `.xtend-build` Artefakt-Provenance mit SHA256 und Dependency-Klassifikation
  - Bundle Report Sektion `xtensions`
  - Degradation bei fehlendem, inkompatiblem oder policy-blockiertem Adapter
- Zielartefakte:
  - `xtend.maraca.xtension-manifest.v1`
  - `development/XTensions-Maraca-Manifest-and-Build-Provenance-Contract.md`
  - `tools/xtensions/maraca-xtension-manifest.js`
  - `tools/xtensions/maraca-xtension-manifest.d.ts`
  - `tests/fixtures/xtensions/maraca-xtension-manifest-valid.json`
  - `tests/fixtures/xtensions/maraca-xtension-manifest-missing.json`
  - `tests/fixtures/xtensions/maraca-xtension-manifest-policy-blocked.json`
  - `tests/xtensions/maraca_xtensions_suite.js`
- Implementierungsnotiz:
  - XTN-03 spezifiziert XTensions als eigene Maraca-Manifest-, Build-Plan-, Artefakt-, Provenance- und Bundle-Report-Records.
  - Fingerprints werden fuer Contract Snapshot, Manifest und Artefakt stabil aus serialisierbaren Daten erzeugt.
  - Lazy Loading ist nur mit explizitem opt-in, Manifest-Policy und SHA256-Integrity zulaessig.
  - Frameworks duerfen in Manifesten als externe Peer-Klassifikation erscheinen, aber nicht als Root-, vendored-, bundled- oder packageIncluded Dependency.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js maraca-xtensions --json`
- Definition of Done:
  - XTension-Artefakte sind im Bundle Report auffindbar
  - Fingerprints sind stabil und aendern sich bei Entry-/Contract-Aenderungen
  - Lazy Loading bleibt opt-in und policy-gatebar

### XTN-04 - Static Contract Introspection fuer LSP, DevTools und AI-Agenten vorbereiten

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - XTension-Contracts so bereitstellen, dass Tooling sie lesen kann, ohne Framework-Code auszufuehren.
- Scope:
  - TypeScript-kompatibler Static-Contract-Shape
  - alternativer Modulexport `XTENSION_CONTRACT`
  - LSP-Index fuer accepts/emits/capabilities
  - AI-Agent-Report mit Reparaturhinweisen bei Contract Drift
- Zielartefakte:
  - `development/XTensions-Static-Contract-Introspection-Contract.md`
  - `tools/xtensions/static-contract-introspection.js`
  - `tools/xtensions/static-contract-introspection.d.ts`
  - `tests/fixtures/xtensions/static-introspection-valid.json`
  - `tests/fixtures/xtensions/static-introspection-module.mjs`
  - `tests/fixtures/xtensions/static-introspection-drift-module.mjs`
  - `tests/fixtures/xtensions/static-introspection-no-export.mjs`
  - `tests/xtensions/xtensions_static_introspection_suite.js`
- Implementierungsnotiz:
  - XTN-04 fuehrt `XTENSION_CONTRACT` als JSON-kompatiblen statischen Export ein.
  - Tooling liest Source-Text, Maraca-Manifeste und Artefakte ohne `import()`, `require()` oder `eval()`.
  - LSP-, DevTools- und AI-Agent-Records werden aus demselben Static-Contract-Index erzeugt.
  - Missing `accepts`, `emits`, `capabilities`, fehlender Static Export und Drift zwischen Source und Maraca-Artefakt erzeugen Diagnostics und AI-Reparaturhinweise.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-static-introspection --json`
- Definition of Done:
  - Tooling kann Contracts aus Source oder Build-Artefakt lesen
  - fehlende accepts/emits erzeugen Diagnostics
  - keine Runtime-Ausfuehrung ist fuer Introspection noetig

### XTN-05 - Runtime Capability Registry und Adapter Loading Policy bauen

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - Runtime Hosts koennen XTensions registrieren, laden, ablehnen und degradieren, ohne neue globale Registry einzufuehren.
- Scope:
  - Host-lokale Registry ueber bestehende Surface-/Adapter-Pfade
  - Capability Negotiation vor Mount
  - Peer-Dependency- und Version-Kompatibilitaet
  - Fallback Surface oder degraded placeholder
  - Runtime Report fuer loaded, skipped, failed, degraded
- Zielartefakte:
  - `development/XTensions-Runtime-Capability-Registry-and-Loading-Policy-Contract.md`
  - `tools/xtensions/runtime-capability-registry.js`
  - `tools/xtensions/runtime-capability-registry.d.ts`
  - `tests/fixtures/xtensions/runtime-capability-registry-valid.json`
  - `tests/xtensions/xtensions_runtime_capability_registry_suite.js`
- Implementierungsnotiz:
  - XTN-05 fuehrt eine host-lokale Runtime Capability Registry als abgeleiteten Snapshot aus Host-Capabilities, Maraca-Artefakten und statischen Contracts ein.
  - Adapter Loading bleibt ein Policy-Entscheid mit `runtimeExecutionRequired: false`; XTN-05 importiert oder startet keine Framework-Runtime.
  - Capability Negotiation prueft Host-Capabilities, Peer-Verfuegbarkeit, Versionsrange, Integrity und Fallback vor einem spaeteren Mount.
  - Fehlende externe Peer-Runtimes degradieren mit nativer Fallback Surface und blockieren nicht die gesamte App Shell.
  - Globale Registry-Versuche, fehlende Integrity, fehlende Fallbacks und vendored/root Framework-Klassifikation erzeugen Diagnostics.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-runtime-capability-registry --json`
- Definition of Done:
  - keine zweite globale Surface Registry entsteht
  - Adapter Loading ist idempotent und policy-gatebar
  - fehlende Framework-Runtime blockiert nicht die gesamte App Shell

### XTN-06 - React HostController PoC mit Scheduling-Hints bauen

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - React als deklarativen Host pruefen, ohne React in den Kernel oder Core-Runtime-Pfad zu ziehen.
- Scope:
  - optionaler React Peer/Test-Adapter
  - Mount/Update/Unmount ueber React Root
  - Lane-/Budget-Hints als `startTransition`/sync render Entscheidung, nicht als harte Kernel-Kontrolle
  - Error Boundary und Suspense Diagnostics
- Zielartefakte:
  - `development/XTensions-React-HostController-PoC-and-Scheduling-Hints-Contract.md`
  - `tools/xtensions/react-host-controller-poc.js`
  - `tools/xtensions/react-host-controller-poc.d.ts`
  - `tests/fixtures/xtensions/react-host-controller-poc-valid.json`
  - `tests/xtensions/xtensions_react_host_controller_poc_suite.js`
- Implementierungsnotiz:
  - XTN-06 fuehrt einen frameworklosen React HostController PoC ein, keinen echten React-Core-Adapter.
  - React und React DOM erscheinen nur als `external-peer`-Daten fuer externe opt-in Harnesses; lokale Gates importieren oder installieren keine React-Runtime.
  - Der PoC simuliert einen `frameworkless-react-root-stub` mit Mount, Update, Suspend, Resume, Error Boundary, Suspense Boundary und Unmount/Cleanup.
  - `startTransition` bleibt ein beobachtbarer Scheduling-Hint; Records enthalten `hardKernelPriorityControl: false`.
  - Context-, Provider-, Store- und nicht serialisierbare Payload-Leaks erzeugen Diagnostics und bleiben ausserhalb der XTension-Grenze.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-react-host-controller-poc --json`
- Definition of Done:
  - React PoC ist optional und lokal testbar
  - Scheduling-Hints sind beobachtbar
  - React-Kontext/Store bleibt innerhalb der XTension

### XTN-07 - Vue HostController PoC mit explizitem Update-Adapter bauen

- Prioritaet: `P1/P2`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - Vue als reaktiven Host pruefen und Proxy-/State-Leaks ueber XTension-Grenzen verhindern.
- Scope:
  - `createApp`/`unmount` Lifecycle
  - explizite Adapter-Funktion fuer Props-/State-Updates statt implizitem `globalProperties.$patch`
  - Event Normalization und Cleanup
  - Diagnose fuer Proxy- oder nicht-serialisierbare Payloads
- Zielartefakte:
  - `development/XTensions-Vue-HostController-PoC-and-Explicit-Update-Adapter-Contract.md`
  - `tools/xtensions/vue-host-controller-poc.js`
  - `tools/xtensions/vue-host-controller-poc.d.ts`
  - `tests/fixtures/xtensions/vue-host-controller-poc-valid.json`
  - `tests/xtensions/xtensions_vue_host_controller_poc_suite.js`
- Implementierungsnotiz:
  - XTN-07 fuehrt einen frameworklosen Vue HostController PoC ein, keinen echten Vue-Core-Adapter.
  - Vue erscheint nur als `external-peer`-Daten fuer externe opt-in Harnesses; lokale Gates importieren oder installieren keine Vue-Runtime.
  - Der PoC simuliert `createApp`, Mount, explizite Update-Adapter, Event Normalization, Suspend/Resume, Error Boundary und Unmount/Cleanup.
  - Updates laufen ueber `applyPropsUpdate`, `applyStatePatch` oder `dispatchCommand`; implizites `globalProperties.$patch` wird diagnostiziert.
  - Vue-Proxies, Refs, Stores und nicht serialisierbare Payloads bleiben innerhalb der Host-Grenze oder blockieren die Operation.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-vue-host-controller-poc --json`
- Definition of Done:
  - Vue State bleibt host-intern
  - Downstream Updates nutzen serialisierbare Records
  - Unmount entfernt App und Listener vollstaendig

### XTN-08 - Chart.js und Leaflet imperative Host PoCs bauen

- Prioritaet: `P1/P2`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - Imperative Bibliotheken als XTension-Klasse validieren: datengetriebene Charts und event-reiche Maps.
- Scope:
  - Chart.js Update-Modi `active`/`none` als Policy-Hint
  - Leaflet Event Normalization fuer pan, zoom, layer click, marker drag, popup open
  - Resize, visibility und teardown
  - Payload-Schemas fuer selection, viewport und layer events
- Zielartefakte:
  - `development/XTensions-Chart-Leaflet-Imperative-Host-PoCs-Contract.md`
  - `tools/xtensions/imperative-host-pocs.js`
  - `tools/xtensions/imperative-host-pocs.d.ts`
  - `tests/fixtures/xtensions/imperative-host-pocs-valid.json`
  - `tests/xtensions/xtensions_imperative_host_pocs_suite.js`
- Implementierungsnotiz:
  - XTN-08 fuehrt frameworklose Chart.js- und Leaflet-HostController-PoCs ein, keine echten Chart.js-/Leaflet-Core-Adapter.
  - Chart.js und Leaflet erscheinen nur als `external-peer`-Daten fuer externe opt-in Harnesses; lokale Gates importieren oder installieren keine Framework-Runtime.
  - Der Chart-PoC simuliert Mount, Update-Modi `active`/`none`, Resize, Visibility und Unmount/Cleanup.
  - Der Leaflet-PoC normalisiert `pan`, `zoom`, `layer.click`, `marker.drag` und `popup.open` als serialisierbare Surface Events.
  - Event-Flut erzeugt Rate-Limit-Diagnostics; Canvas-, Map-, Layer-, Marker-, Popup- und native Event-Objekte bleiben hinter der HostController-Grenze.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-imperative-host-pocs --json`
- Definition of Done:
  - imperative APIs werden nur ueber HostController angesprochen
  - Event-Flut ist rate-limitierbar und diagnostizierbar
  - Cleanup entfernt Canvas/Map/Listener sicher

### XTN-09 - Three.js Fiber-controlled Render Loop PoC bauen

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - Eine render-loop-getriebene XTension unter Kernel-/Fabric-Budget und Host-Policy kontrollieren.
- Scope:
  - kein freier permanenter `requestAnimationFrame` Loop
  - Frame Budget, visibility pause, low-power degradation, context loss handling
  - Render Loop als host-registrierter Scheduled Endpoint/Fiber Record
  - Backpressure und dropped-frame Diagnostics
- Zielartefakte:
  - `development/XTensions-Three-Fiber-Render-Loop-PoC-Contract.md`
  - `tools/xtensions/three-render-loop-poc.js`
  - `tools/xtensions/three-render-loop-poc.d.ts`
  - `tests/fixtures/xtensions/three-render-loop-poc-valid.json`
  - `tests/xtensions/xtensions_three_render_loop_poc_suite.js`
- Implementierungsnotiz:
  - XTN-09 fuehrt einen frameworklosen Three.js Render-Loop HostController PoC ein, keinen echten Three.js-Core-Adapter.
  - Three.js erscheint nur als `external-peer`-Datenpunkt fuer externe opt-in Harnesses; lokale Gates importieren oder installieren keine Three.js-Runtime.
  - Der PoC nutzt native XTend/Fabric-Fiber-Records fuer den Render Endpoint, nicht `@react-three/fiber`.
  - Frame Records modellieren `rendered`, `dropped-over-budget`, `skipped-hidden`, `skipped-suspended` und `skipped-context-lost`.
  - Browser-Smoke-Evidence wird als frameworkloser Pixel-Probe-Record gehalten; echte Browser-/Three-Smokes duerfen spaeter nur extern opt-in laufen.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-three-render-loop-poc --json`
- Definition of Done:
  - Render Loop kann suspendiert, resumed und beendet werden
  - Unmount gibt WebGL-Ressourcen frei
  - Browser-Smoke weist nichtblanke Szene, Interaktion und Cleanup nach

### XTN-10 - Digital Twin Diagnostic Trail fuer XTension-Aktionen integrieren

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - Mount, Update, Signal Receive, Event Emit, Suspend, Resume, Error und Unmount als auditierbare Records erfassen.
- Scope:
  - Diagnostic Trail Schema
  - Korrelation zwischen Maraca Artefakt, Runtime Host, Surface, Lane und Event
  - Redaction fuer Payloads
  - Report-Ausgabe fuer CI und DevTools
- Zielartefakte:
  - `development/XTensions-Diagnostic-Trail-Contract.md`
  - `tools/xtensions/diagnostic-trail.js`
  - `tools/xtensions/diagnostic-trail.d.ts`
  - `tests/fixtures/xtensions/diagnostic-trail-valid.json`
  - `tests/xtensions/xtensions_diagnostic_trail_suite.js`
- Implementierungsnotiz:
  - XTN-10 fuehrt einen optionalen, frameworkfreien Diagnostic Trail fuer XTension-Aktionen ein.
  - Records korrelieren `xtensionId`, Maraca Manifest/Artefakt, Runtime Host, Surface, Fabric Lane, Signal/Event, Trace und Correlation ID.
  - Payloads werden vor CI-/DevTools-Ausgabe schema- und policy-basiert redigiert: `allowlist`, `shape`, `hash`, `drop` oder kontrolliertes `pass`.
  - Sensitive Felder wie Token, Authorization, Cookies, Secrets, Passwoerter und E-Mail-Adressen bleiben aus serialisierten Reports heraus.
  - Der Trail beobachtet HostController-, Signal-Bridge- und Runtime-Ereignisse, veraendert aber kein Runtime-Verhalten.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-diagnostic-trail --json`
- Definition of Done:
  - jede XTension-Aktion ist optional auditierbar
  - Payloads koennen schema- und policy-basiert reduziert werden
  - Reports sind ohne Framework-Code lesbar

### XTN-11 - Security, CSP, Supply Chain und Integrity Gates haerten

- Prioritaet: `P1`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - XTensions gegen unsichere Imports, fehlende Integritaet, ueberbreite Capabilities und Policy Drift absichern.
- Scope:
  - CSP-Anforderungen fuer Dynamic Import, Worker, WASM, Images und Connect
  - Integrity Pflicht fuer paketierte und remote-faehige Artefakte
  - Dependency-Klassifikation: core, peer, optional, dev/test, remote
  - Deny-by-default Capabilities
  - Strict Gate fuer fehlende Owner, Version, Contract, Fallback oder Integrity
- Zielartefakte:
  - `development/XTensions-Security-CSP-Supply-Chain-Integrity-Gates-Contract.md`
  - `tools/xtensions/security-integrity-gate.js`
  - `tools/xtensions/security-integrity-gate.d.ts`
  - `tests/fixtures/xtensions/security-integrity-gate-valid.json`
  - `tests/xtensions/xtensions_security_integrity_gate_suite.js`
- Implementierungsnotiz:
  - XTN-11 fuehrt einen frameworkfreien Strict Gate Report fuer XTension-Security ein.
  - Das Gate prueft Owner, Version, expliziten Contract, SHA256-Integrity, CSP-Direktiven, WASM-/Worker-Anforderungen, Remote/CDN-Quellen, Dependency-Klassifikation, Capabilities und sichtbare Fallbacks.
  - Framework-Runtimes wie React, Vue, Three.js, Leaflet und Chart.js bleiben nur Peer-/Optional-Metadaten fuer externe opt-in Harnesses.
  - Remote-faehige Artefakte und CDN-Quellen sind standardmaessig blockiert; lokale Fixtures laufen ohne Netzwerk.
  - Der Gate-Lauf fuehrt keinen Framework-Code aus und importiert keine Dritt-Frameworks.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-security-integrity-gate --json`
- Definition of Done:
  - unsichere XTension-Manifeste werden im strict Gate blockiert
  - lokale Fixtures brauchen kein CDN
  - Runtime-Fallback ist strukturiert und sichtbar

### XTN-12 - Multi-Framework Dashboard Fixture und Browser-Smokes bauen

- Prioritaet: `P2`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - Das Konzept mit einer realistischen App Shell pruefen: native XTend Surface, React/Vue Content, Chart, Map und 3D Surface.
- Scope:
  - RMT/Maraca Fixture fuer Multi-Framework Dashboard
  - Cross-Surface Event Flow: Map selection aktualisiert Chart und React/Vue Panel
  - Browser-Smokes fuer mount, interaction, lazy load, suspend, teardown
  - Pixel-/nonblank Checks fuer Canvas/WebGL
- Zielartefakte:
  - `development/XTensions-Multi-Framework-Dashboard-Fixture-and-Browser-Smokes-Contract.md`
  - `tools/xtensions/multi-framework-dashboard-fixture.js`
  - `tools/xtensions/multi-framework-dashboard-fixture.d.ts`
  - `tests/fixtures/xtensions/multi-framework-dashboard-valid.json`
  - `tests/xtensions/xtensions_multi_framework_dashboard_suite.js`
- Implementierungsnotiz:
  - XTN-12 fuehrt eine frameworkfreie Dashboard-Fixture mit nativer Shell, React-, Vue-, Chart.js-, Leaflet- und Three.js-aehnlichen XTension-Surfaces ein.
  - Die Fixture kombiniert Maraca-BuildPlan, Security-Gate, Runtime-Report, Fabric SurfaceEvent/KernelSignal-Flow und lokale Browser-Smoke-Evidence.
  - Map-Auswahl wird ueber Fabric an Chart, React und Vue geroutet; direkte Framework-zu-Framework-Kopplung bleibt verboten.
  - Vue ist absichtlich als fehlende Peer-Runtime degraded, waehrend Shell, Chart, React, Map und Three geladen bleiben.
  - Browser-Smokes sind frameworklose Evidence Records fuer Mount, Interaction, Lazy Load, Suspend, Teardown, Canvas-Pixel und WebGL-Pixel.
  - React, Vue, Chart.js, Leaflet und Three.js bleiben `external-peer`-Metadaten; lokale Gates importieren oder installieren keine Framework-Runtime.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-multi-framework-dashboard --json`
- Definition of Done:
  - Fixture laeuft lokal ohne Netzwerk
  - Interaktionen erzeugen Fabric Diagnostics
  - Shell bleibt bedienbar, wenn eine XTension degraded

### XTN-13 - XTension Registry und Package-Strategie entscheiden

- Prioritaet: `P2`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - Entscheiden, ob XTensions als NPM Subpackages, Repo-interne Adapters, Marketplace-Eintraege oder Projekt-lokale Manifeste ausgeliefert werden.
- Scope:
  - Namensschema `@xtend/xtension-*`
  - Versionierung und Compatibility Matrix
  - Ownership und Security Review
  - Release- und Deprecation-Regeln
- Entscheidung:
  - Primaere Distribution: `project-local-manifest`
  - NPM-Subpackages: `reserved-deferred`
  - Marketplace-Eintraege: `metadata-only`
  - Registry Scope: `project-local`
  - Registry Source of Truth: `maraca-manifest`
  - Runtime Source of Truth: `host-local-runtime-capability-registry`
- Zielartefakte:
  - `development/XTensions-Registry-and-Package-Strategy-Contract.md`
  - `tools/xtensions/registry-package-strategy.js`
  - `tools/xtensions/registry-package-strategy.d.ts`
  - `tests/fixtures/xtensions/registry-package-strategy-valid.json`
  - `tests/xtensions/xtensions_registry_package_strategy_suite.js`
- Implementierungsnotiz:
  - XTN-13 fuehrt einen frameworkfreien Registry- und Package-Strategie-Report ein.
  - Registry-Eintraege sind Indexdaten, keine zweite Runtime-Registry.
  - Maraca Manifest/Artefakt-Fingerprints bleiben die Identitaets- und Provenance-Quelle.
  - Die host-lokale Runtime Capability Registry bleibt fuer Runtime-Verfuegbarkeit, Peer-Status und Fallback autoritativ.
  - Compatibility Matrix, Release Policy und Deprecation Policy sind gatebar.
  - `@xtend/xtension-*` ist als Namensschema reserviert; echte NPM-Subpackages bleiben bis zu einer expliziten Folgeentscheidung blockiert.
  - Framework-Runtimes bleiben Peer-/Optional-Metadaten und werden nicht in Registry-Pakete aufgenommen.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-registry-package-strategy --json`
- Definition of Done:
  - Package-Strategie ist dokumentiert
  - Registry erzeugt keine zweite Runtime-Source-of-Truth
  - Compatibility und Deprecation sind gatebar

### XTN-14 - Docs, Migration Guide und Enterprise Adoption Handoff schreiben

- Prioritaet: `P2`
- Status: `completed`
- Umgesetzt: 2026-06-20
- Ziel:
  - XTensions fuer Enterprise-Adoption dokumentieren, ohne Migration bestehender Apps zu erzwingen.
- Scope:
  - Authoring Guide
  - Migration/Coexistence Guide fuer React, Vue, native XTend und Custom Hosts
  - Security Checklist
  - Release Handoff und Known Residuals
- Zielartefakte:
  - `development/XTensions-Docs-Migration-Enterprise-Adoption-Handoff-Contract.md`
  - `docs/de/xtensions-authoring-guide.md`
  - `docs/de/xtensions-migration-coexistence-guide.md`
  - `docs/de/xtensions-security-checklist.md`
  - `development/docs-evidence/legacy-routes/de/xtensions-enterprise-adoption-handoff.md`
  - `tools/xtensions/adoption-handoff.js`
  - `tools/xtensions/adoption-handoff.d.ts`
  - `tests/fixtures/xtensions/adoption-handoff-valid.json`
  - `tests/xtensions/xtensions_adoption_handoff_suite.js`
- Implementierungsnotiz:
  - XTN-14 fuehrt einen frameworkfreien Adoption-Handoff-Report ein, der Docs, Boundaries und Folge-Startpakete pruefbar macht.
  - Authoring, Migration/Coexistence, Security Checklist und Enterprise Handoff beschreiben XTensions als opt-in Modell mit no forced migration.
  - Native XTend bleibt Default; externe Frameworks bleiben Orchestrierungsziele ueber HostController, Fabric, Signals/Reactivity, Maraca Manifest und host-lokale Runtime Capability Registry.
  - React, Vue, Three, Leaflet, Chart.js und aehnliche Testkomponenten gehoeren in externe opt-in Peer-Harnesses; XTend bekommt keine Framework-Dependencies und keine vendored Framework-Artefakte.
  - Startpakete fuer externe Peer-Harnesses, Enterprise Policy, Registry-Metadaten, Browser-Smokes und Remote-Artifact-Policy sind priorisiert.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-adoption-handoff --json`
- Definition of Done:
  - XTensions sind als opt-in Coexistence-Modell beschrieben
  - Native-First und framework-agnostische Kernel-Boundaries bleiben klar
  - Startpakete fuer Folge-Epics sind priorisiert

### XTN-15 - Vanilla Host Adapter und Legacy Sandbox Boundary spezifizieren

- Prioritaet: `P2`
- Status: `completed`
- Umgesetzt: 2026-06-29
- Ziel:
  - Einen frameworkneutralen Vanilla Host Adapter definieren und die harte Grenze zwischen kooperativem Same-Realm-Code und Legacy-Code mit globalem DOM/CSS-Verhalten festlegen.
- Scope:
  - Vanilla HostController-Vertrag auf Basis der bestehenden Lifecycle-Methoden
  - DOM-Boundary-Record fuer `shadow-root`, `host-owned-container` und `iframe-sandbox`
  - Legacy Sandbox Record mit `sandbox="allow-scripts"` ohne `allow-same-origin`
  - Manifest-Isolation fuer `runtimeClass`, `domBoundary`, `styleBoundary`, `trustBoundary`, `mutationPolicy` und optionale Sandbox-Tokens
  - Security-/Maraca-Regel fuer `legacy-local-artifact`
- Zielartefakte:
  - `development/XTensions-Vanilla-Host-Adapter-und-Legacy-Sandbox-Contract.md`
  - `tools/xtensions/vanilla-host-adapter.js`
  - `tools/xtensions/vanilla-host-adapter.d.ts`
  - `tests/fixtures/xtensions/vanilla-host-adapter-valid.json`
  - `tests/xtensions/xtensions_vanilla_host_adapter_suite.js`
- Implementierungsnotiz:
  - XTN-15 fuehrt keinen iWebKit- oder Legacy-Code in Upstream ein. Upstream bekommt nur Contracts, Diagnosefunktionen und frameworklose Fixtures.
  - Shadow DOM ist im Same-Realm-Modus eine kooperative Boundary, aber keine harte Sicherheitsgrenze.
  - Legacy-Code mit globalem DOM/CSS-Verhalten ist nur als sandboxed iframe zulaessig; `allow-same-origin`, Top-Navigation und Popups bleiben blockiert.
  - Lokale Legacy-Testartefakte muessen als `legacy-local-artifact` klassifiziert und mit `iframe-sandbox` plus `sandboxed-adapter` isoliert werden.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-vanilla-host-controller xtensions-dom-boundary xtensions-legacy-sandbox-adapter --json`
- Definition of Done:
  - Vanilla-Adapter bleibt frameworkfrei
  - Legacy-Sandbox-Regeln sind im Manifest- und Security-Gate pruefbar
  - Boundary-Verletzungen degradieren die XTension statt die Shell zu blockieren

### XTN-16 - OpenUI5 Host Adapter und Product-local Runtime Boundary spezifizieren

- Prioritaet: `P2`
- Status: `completed`
- Umgesetzt: 2026-06-30
- Ziel:
  - Einen OpenUI5 Host Adapter fuer klassische UI5 Controls in XTension-Surfaces definieren, ohne OpenUI5 als Root-Dependency oder CDN-Runtime in XTend einzufuehren.
- Scope:
  - OpenUI5 HostController-Vertrag auf Basis der bestehenden Lifecycle-Methoden
  - Loader-Boundary fuer produktlokale OpenUI5-Ressourcen unter `dist/xtensions/openui5/resources/`
  - Manifest-/Security-Regel fuer `product-local-bundled`
  - Same-Realm-Policy fuer host-owned Container ohne harte Security-Isolation
  - Control-Destroy- und JSONModel-Update-Regeln fuer Lifecycle-Smokes
- Zielartefakte:
  - `development/XTensions-OpenUI5-Host-Adapter-Contract.md`
  - `tools/xtensions/openui5-host-adapter.js`
  - `tools/xtensions/openui5-host-adapter.d.ts`
  - `tests/fixtures/xtensions/openui5-host-adapter-valid.json`
  - `tests/xtensions/xtensions_openui5_host_adapter_suite.js`
- Implementierungsnotiz:
  - XTN-16 fuehrt kein OpenUI5 in das XTend-Root-Paket ein. Upstream bekommt nur Contract, Diagnosefunktionen und frameworklose Fixtures.
  - SAPUI5/OpenUI5-CDNs bleiben policy-blocked; OpenUI5 darf nur produktlokal und per SHA-256-Manifest in einem opt-in Product gebuendelt werden.
  - Same-Realm UI5 ist eine kooperative MFE-Integration und muss ihre Control-Instanzen beim Unmount zerstoeren.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-openui5-host-controller xtensions-openui5-loader-boundary --json`
- Definition of Done:
  - OpenUI5-Adapter bleibt upstream frameworkfrei
  - Product-local-Bundled-Regeln sind im Manifest- und Security-Gate pruefbar
  - UI5-Lifecycle-Records enthalten Mount, Update, Suspend, Resume, Error und Destroy-Cleanup

### XTN-17 - Angular Host Adapter und AOT/Zoneless Boundary spezifizieren

- Prioritaet: `P2`
- Status: `completed`
- Umgesetzt: 2026-06-30
- Ziel:
  - Einen Angular Host Adapter fuer standalone Angular-Komponenten in XTension-Surfaces definieren, ohne Angular als Root-Dependency, Workspace-Dependency oder CDN-Runtime in XTend einzufuehren.
- Scope:
  - Angular HostController-Vertrag auf Basis der bestehenden Lifecycle-Methoden
  - AOT-Boundary fuer produktlokal gebuendelte Angular-XTensions
  - Zoneless-/Signal-Update-Regel fuer host-gesteuerte Modellaktualisierung
  - Manifest-/Security-Regel fuer `product-local-bundled`
  - ApplicationRef-/ComponentRef-Destroy-Regel fuer Lifecycle-Smokes
- Zielartefakte:
  - `development/XTensions-Angular-Host-Adapter-Contract.md`
  - `tools/xtensions/angular-host-adapter.js`
  - `tools/xtensions/angular-host-adapter.d.ts`
  - `tests/fixtures/xtensions/angular-host-adapter-valid.json`
  - `tests/xtensions/xtensions_angular_host_adapter_suite.js`
- Implementierungsnotiz:
  - XTN-17 fuehrt kein Angular in das XTend-Root-Paket ein. Upstream bekommt nur Contract, Diagnosefunktionen und frameworklose Fixtures.
  - Angular-CDNs und Runtime-`@angular/compiler` bleiben policy-blocked; Angular darf nur produktlokal und per SHA-256-Manifest in einem opt-in Product gebuendelt werden.
  - Same-Realm Angular ist eine kooperative MFE-Integration und muss seine ApplicationRef beim Unmount zerstoeren.
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js xtensions-angular-host-controller xtensions-angular-zone-boundary --json`
- Definition of Done:
  - Angular-Adapter bleibt upstream frameworkfrei
  - Product-local-Bundled-Regeln sind im Manifest- und Security-Gate pruefbar
  - Angular-Lifecycle-Records enthalten Mount, Update, Suspend, Resume, Error und Destroy-Cleanup

## Startreihenfolge

1. `XTN-00` ist abgeschlossen und friert Architektur-, Threat-Model- und Test-Fixture-Dependency-Boundaries ein.
2. `XTN-01` ist abgeschlossen und friert HostController Lifecycle, Cleanup und Dummy-Fixture-Gate ein.
3. `XTN-02` ist abgeschlossen und friert Fabric Signal Bridge, Event Governance und Dead-Letter-Diagnostics ein.
4. `XTN-03` ist abgeschlossen und friert Maraca Manifest, Artefakte, Fingerprints und Build-Provenance ein.
5. `XTN-04` ist abgeschlossen und friert Static Contract Introspection fuer LSP, DevTools und AI-Agenten ein.
6. `XTN-05` ist abgeschlossen und friert host-lokale Runtime Capability Registry, Capability Negotiation und Adapter Loading Policy ein.
7. `XTN-06` ist abgeschlossen und friert den frameworklosen React HostController PoC mit beobachtbaren Scheduling-Hints ein.
8. `XTN-07` ist abgeschlossen und friert den frameworklosen Vue HostController PoC mit explizitem Update-Adapter ein.
9. `XTN-08` ist abgeschlossen und friert die frameworklosen Chart.js-/Leaflet-HostController-PoCs fuer imperative APIs ein.
10. `XTN-09` ist abgeschlossen und friert den frameworklosen Three.js Render-Loop HostController PoC mit Host-Fiber-Steuerung ein.
11. `XTN-10` ist abgeschlossen und friert den optionalen frameworkfreien Diagnostic Trail mit Payload-Redaction ein.
12. `XTN-11` ist abgeschlossen und friert Security-, CSP-, Supply-Chain- und Integrity-Gates ein.
13. `XTN-12` ist abgeschlossen und friert die frameworkfreie Multi-Framework-Dashboard-Fixture samt Browser-Smoke-Evidence ein.
14. `XTN-13` ist abgeschlossen und friert Registry- und Package-Strategie als projekt-lokalen Manifest-Index ein.
15. `XTN-14` ist abgeschlossen und friert Docs, Migration Guide, Security Checklist und Enterprise Adoption Handoff ein.
16. `XTN-15` ist abgeschlossen und friert Vanilla Host Adapter, DOM Boundary und Legacy Sandbox Policy ein.
17. `XTN-16` ist abgeschlossen und friert OpenUI5 Host Adapter, Loader Boundary und Product-local Runtime Policy ein.
18. `XTN-17` ist abgeschlossen und friert Angular Host Adapter, AOT Boundary und Zoneless Update Policy ein.

## Offene Entscheidungen

| Thema | Vorentscheidung | Klaerung in |
|-------|-----------------|-------------|
| Remote vs lokal/package-basiert | entschieden: XTensions starten lokal/package-basiert; Remote braucht E16-Policy | `XTN-11` |
| DSL-Syntax `xtension` | plausibel, aber erst nach Manifest-Contract stabilisieren | `XTN-03` |
| Shadow DOM Default | offen; muss pro Framework und Styling Boundary entschieden werden | `XTN-01` |
| React Prioritaeten | nur Hint/Budget, keine harte Kernel-Steuerung | `XTN-06` |
| Three.js Loop Ownership | Host-registrierter Scheduled Endpoint, kein freier Loop | `XTN-09` |
| Package Scope | entschieden: projekt-lokale Manifeste zuerst; `@xtend/xtension-*` reserviert, NPM-Subpackages deferred | `XTN-13` |
| Legacy Same-Realm | entschieden: globaler DOM/CSS-Legacy-Code ist policy-blocked und braucht `iframe-sandbox` | `XTN-15` |

## Residual Risks

- Externe Frameworks koennen Bundle-Groesse, Hydration-Zeit und Supply-Chain-Risiko deutlich erhoehen.
- Framework-eigene Scheduler lassen sich nur begrenzt deterministisch kontrollieren.
- Event-Bridges koennen ohne Governance zu impliziter Kopplung zwischen Surfaces werden.
- Canvas/WebGL-Hosts brauchen strengere Cleanup- und Browser-Smoke-Gates als DOM-Hosts.
- Zu fruehe DSL-Syntax vor Runtime- und Manifest-Contract kann langfristige Kompatibilitaet belasten.

## Erfolgskriterien

- Der RMT-Kernel bleibt host-neutral und importiert keine Framework-Runtime.
- XTensions sind opt-in, capability-gatebar und fallback-faehig.
- Maraca Reports und Runtime Reports koennen XTension-Artefakte, Contracts und Diagnostics nachvollziehen.
- Mindestens ein DOM-Framework, eine imperative Bibliothek und eine render-loop-getriebene Bibliothek sind per PoC validiert.
- Eine Multi-Framework-Fixture beweist Cross-Surface Events ohne direkte Framework-zu-Framework-Kopplung.
