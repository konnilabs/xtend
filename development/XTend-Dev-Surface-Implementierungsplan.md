# XTend Dev Surface Implementierungsplan

- Status: `xds-wp-09-handoff`
- Datum: 9. Juli 2026
- Product: `XTend Dev Surface`
- Extension Contract: `xtend.devsurface.extension.v1`
- Snapshot Contract: `xtend.devsurface.snapshot.v1`
- Performance View Contract: `xtend.devsurface.performance-view.v1`
- Fabric View Contract: `xtend.devsurface.fabric-view.v1`
- Kernel Monitor Contract: `xtend.devsurface.kernel-monitor.v1`
- Worker Path Contract: `xtend.devsurface.worker-path.v1`
- Handoff Contract: `xtend.devsurface.handoff.v1`
- Gate Run Contract: `xtend.devsurface.gate-run.v1`
- Diagnostic Contract: `xtend.devsurface.diagnostic.v1`
- Tooling Root: `tools/xtend-dev-surface/`
- Built Extension: `tools/xtend-dev-surface/dist/`
- Local Gate: `node scripts/run_xtend_tests.js xtend-dev-surface --json`
- Package Script: `npm run test:xtend-dev-surface`

## Produktplan

Die XTend Dev Surface ist eine Chromium DevTools Extension fuer XTend-Apps. Sie stellt eine native, frameworkfreie Debug-Oberflaeche bereit, die XTend/Fabric/RMT-Contracts ausliest, ohne die inspizierte Anwendung zu monkeypatchen oder eine zweite Runtime-Semantik einzufuehren.

V1 liefert vier Arbeitsflaechen:

| Bereich | Zweck | Datenquelle |
| --- | --- | --- |
| Gates | erlaubte lokale Gates starten und Reports anzeigen | Local Companion API auf `127.0.0.1` |
| Performance | XTend Performance Measurements bewerten | `window.__XTEND_DEV_API__.getPerformanceSnapshot()` |
| Kernel | Panic State, Recovery und Mitigation sichtbar machen | `window.__XTEND_DEV_API__.getKernelSnapshot()` |
| Fabric | Lanes, Fibers, Budget Misses und Backpressure visualisieren | `window.__XTEND_DEV_API__.getFabricTelemetrySnapshot()` |

Die Extension dogfoodet vorhandene XTend-Konzepte: Fabric-Telemetry, RMT-Kernel-Panic-Records, Gate-Reports und native Browser-UI. React/Vue/Three oder andere Frameworks werden nicht eingefuehrt.

## Architektur

| Schicht | Rolle | Grenze |
| --- | --- | --- |
| DevTools Page | registriert das XTend Panel | nutzt `chrome.devtools.*`, keine Runtime-Auswertung |
| Panel Page | Dashboard, Gate Controls, Snapshot Rendering | nur Extension DOM, kein Zugriff auf App-Interna ausser DEV API |
| Content Bridge | optionaler Message Relay fuer explizite App-Events | kein Patchen von Browser APIs |
| Extension Service Worker | Companion Fetch, Ports, Extension Events | DOM-los und eventgetrieben |
| Prewarm Worker | Snapshot-Normalisierung fuer UI-nahe Arbeit | keine DOM-, Host-Service- oder State-Ownership |
| Local Companion | erlaubte Gate-Ausfuehrung und Report-Normalisierung | keine freie Shell, nur Allowlist |

Die inspizierte App muss explizit eine DEV API bereitstellen:

```js
window.__XTEND_DEV_API__ = {
  version: '1.0.0',
  getPerformanceSnapshot() {},
  getFabricTelemetrySnapshot() {},
  getKernelSnapshot() {},
  subscribe(listener) {}
};
```

Wenn diese API fehlt, degradiert die Dev Surface sichtbar und zeigt keine heuristische Runtime-Introspection an.

## Workpackages

| Ticket | Titel | Liefergegenstand | Abnahme |
| --- | --- | --- | --- |
| `XDS-WP-00` | Source-of-Truth | dieses Dokument | Plan, Architektur, Tickets und Gates sind dokumentiert |
| `XDS-WP-01` | Contracts | `tools/xtend-dev-surface/contracts.js`, `tools/xtend-dev-surface/contracts.d.ts` | Snapshot-, Gate-, DEV-API-, Diagnostic- und Security-Boundary-Normalisierung ist testbar |
| `XDS-WP-02` | Extension Skeleton | `src/`, `dist/`, `extension-skeleton.js`, `dist/build-report.json` mit MV3 Manifest, DevTools Page, Panel, Worker und Bridge | Extension ist als unpacked `dist/` ladbar und Source/Dist-Paritaet ist testbar |
| `XDS-WP-03` | Runtime Bridge | `src/runtime-bridge.js`, Panel-Anbindung und DEV-API Snapshot Reader | nur `window.__XTEND_DEV_API__`, keine Patches an `fetch`, `history`, `performance`, `customElements` oder Frameworks |
| `XDS-WP-04` | Gate Runner | `companion.js` mit Token-Handshake, Gate-Allowlist, Stream-Events, JSON-Report-Parsing und Artefaktlinks | erlaubte Gates werden gestartet, unbekannte Commands blockiert |
| `XDS-WP-05` | Performance View | Bewertung aus `xtend.performance.measurement.v1`, Budget, Phasen und Trend | `pass/warn/fail` mappt auf `optimal/needs-improvement/flawed`, Budget-Misses und Regressionen werden sichtbar |
| `XDS-WP-06` | Kernel Monitor | Health, Panic State, Recovery, Mitigation, betroffene Scopes und Jobs aus Kernel Snapshot | `none/suspected/active/recovering/recovered/failed` wird als Dashboard sichtbar |
| `XDS-WP-07` | Fabric View | Lane/Fiber/Backpressure Summary, kritische Lanes und Fiber Records | Lanes werden nach Count, Failure, Budget Miss, Utilization und Backpressure aggregiert |
| `XDS-WP-08` | Worker Path | Prewarm Worker normalisiert Snapshots, erzeugt Chart-Daten und deklariert Ownership-Grenzen | Worker bleibt DOM-los, host-service-frei und besitzt keinen Canonical State |
| `XDS-WP-09` | Handoff | README, Build-Script, Runner-Suite, `dist/handoff.json` und Extension-Load-Anleitung | lokales Gate dokumentiert, Build reproduzierbar, Extension als unpacked `dist/` ladbar |
| `XDS-WP-10` | Hydration/XScaler | optionaler `getHydrationSnapshot()`, Hydration-Tab, Timeline, Surface Rows und XScaler-Status | Hydration bleibt read-only, fehlende Methode degradiert nur den Tab, XScaler wird ohne DOM-Scraping sichtbar |
| `XDS-WP-11` | Public Documentation | `docs/de/xtend-dev-surface.md`, `docs/en/xtend-dev-surface.md` und Developer-Center-Navigation | Drittentwickler koennen Extension, TestBench, DEV API, Tabs und Companion ohne internes Wissen verwenden |

## Security und Boundary Rules

- Keine Remote Scripts, kein CDN, keine `eval`-basierte UI-Logik.
- `chrome.devtools.inspectedWindow.eval` ist nur fuer den expliziten DEV-API-Read erlaubt.
- Keine Patches an App- oder Browser-Runtime APIs.
- Companion startet nur allowlistete Befehle per `spawn` ohne Shell.
- Companion-Zugriff braucht einen Token-Header.
- Snapshots und Reports werden redigierbar und schemafaehig normalisiert.
- Worker duerfen nur Daten normalisieren und keine DOM- oder Host-Service-Aufgaben uebernehmen.

## XDS-WP-01 Contract Surface

Status: `completed-contract-surface`

`XDS-WP-01` definiert die maschinenlesbaren Contracts fuer die erste Dev-Surface-Ausbaustufe:

| Contract | Schema | Modul |
| --- | --- | --- |
| Extension Contract | `xtend.devsurface.extension.v1` | `tools/xtend-dev-surface/contracts.js` |
| Contract Record | `xtend.devsurface.contract.v1` | `createDevSurfaceContract()` |
| DEV API Record | `xtend.devsurface.dev-api.v1` | `normalizeDevApiRecord()` |
| Snapshot Record | `xtend.devsurface.snapshot.v1` | `createDevSurfaceSnapshot()` |
| Hydration Snapshot | `xtend.devsurface.hydration-snapshot.v1` | `normalizeHydrationSnapshot()` |
| Hydration View | `xtend.devsurface.hydration-view.v1` | `createDevSurfaceContract()` |
| Gate Run Record | `xtend.devsurface.gate-run.v1` | `normalizeGateRun()` |
| Diagnostic Record | `xtend.devsurface.diagnostic.v1` | `createDevSurfaceDiagnostic()` |
| Security Boundary | `xtend.devsurface.security-boundary.v1` | `evaluateDevSurfaceSecurityBoundary()` |

Diagnostic-Codes:

- `xtend.devsurface.dev_api.missing`
- `xtend.devsurface.dev_api.method_missing`
- `xtend.devsurface.gate.not_allowed`
- `xtend.devsurface.security.remote_code_blocked`
- `xtend.devsurface.security.monkeypatch_blocked`
- `xtend.devsurface.security.framework_dependency_blocked`
- `xtend.devsurface.security.worker_ownership_blocked`
- `xtend.devsurface.security.free_command_blocked`
- `xtend.devsurface.security.csp_unsafe`
- `xtend.devsurface.skeleton.invalid`
- `xtend.devsurface.skeleton.source_dist_drift`
- `xtend.devsurface.runtime_bridge.unavailable`
- `xtend.devsurface.runtime_bridge.invalid`
- `xtend.devsurface.runtime_bridge.read_failed`
- `xtend.devsurface.runtime_bridge.serialization_failed`
- `xtend.devsurface.runtime_bridge.forbidden_source`
- `xtend.devsurface.gate.spawn_failed`
- `xtend.devsurface.gate.report_invalid`
- `xtend.devsurface.gate.artifact_blocked`
- `xtend.devsurface.companion.unauthorized`
- `xtend.devsurface.companion.bad_request`
- `xtend.devsurface.companion.not_found`
- `xtend.devsurface.companion.unavailable`

Security-Boundaries:

- `no-remote-code`
- `no-monkeypatching`
- `no-new-framework-dependency`
- `worker-normalization-only`
- `companion-allowlist-only`
- `extension-csp-local-only`

## XDS-WP-02 Extension Skeleton

Status: `completed-extension-skeleton`

`XDS-WP-02` macht die Dev Surface als Chromium-nahe DevTools Extension reproduzierbar greifbar. Die ladbare Extension liegt in `tools/xtend-dev-surface/dist/`; die bearbeitbaren Quellen bleiben in `tools/xtend-dev-surface/src/`.

| Artefakt | Zweck |
| --- | --- |
| `src/manifest.json` | Manifest V3, DevTools Page, Service Worker, lokale Companion-Host-Permissions |
| `src/devtools.html`, `src/devtools.js` | registriert das DevTools Panel `XTend` |
| `src/panel.html`, `src/panel.js`, `src/panel.css` | native Dashboard-Shell fuer Gates, Performance, Kernel und Fabric |
| `src/service-worker.js` | DOM-loser Extension Worker fuer Companion-Requests und Port-Nachrichten |
| `src/content-bridge.js` | expliziter Bridge-Handshake zur inspizierten Seite ohne Monkeypatching |
| `src/prewarm-worker.js` | klassischer Worker fuer Snapshot-Normalisierung und UI-nahe Chart-Daten |
| `extension-skeleton.js` | Skeleton-Contract, Manifest-Checks und Source/Dist-Paritaet |
| `dist/build-report.json` | reproduzierbarer Build-Report fuer die ladbare Extension |

Neue Schemas:

- `xtend.devsurface.extension-skeleton.v1`
- `xtend.devsurface.build-report.v1`

Skeleton-Gates:

- Manifest muss `manifest_version: 3`, `devtools_page: "devtools.html"` und `background.service_worker: "service-worker.js"` deklarieren.
- Extension-Scripts bleiben per CSP auf `'self'`; `unsafe-eval`, `unsafe-inline` und Remote Script Origins sind verboten.
- `host_permissions` sind auf `http://127.0.0.1/*` und `http://localhost/*` begrenzt.
- `dist/` muss alle kopierten Artefakte plus `build-report.json` enthalten.
- Source- und Dist-Dateien muessen fuer alle kopierten Artefakte sha256-identisch sein.

## XDS-WP-03 Runtime Bridge

Status: `completed-runtime-bridge`

`XDS-WP-03` trennt den DEV-API-Lesepfad aus dem Panel heraus und macht ihn als eigenes Extension-Artefakt testbar. Die Bridge lebt in `tools/xtend-dev-surface/src/runtime-bridge.js`, wird nach `dist/runtime-bridge.js` kopiert und vor `panel.js` geladen.

Neue Schemas:

- `xtend.devsurface.runtime-bridge.v1`
- `xtend.devsurface.runtime-bridge-read.v1`

Allowed Reads:

- `window.__XTEND_DEV_API__.version`
- `window.__XTEND_DEV_API__.getPerformanceSnapshot()`
- `window.__XTEND_DEV_API__.getFabricTelemetrySnapshot()`
- `window.__XTEND_DEV_API__.getKernelSnapshot()`
- `window.__XTEND_DEV_API__.subscribe` als Faehigkeitsanzeige, noch ohne Canonical-State-Ownership

Boundary:

- Der Page-Kontext wird nur ueber `chrome.devtools.inspectedWindow.eval` gelesen.
- Der Ausdruck greift ausschliesslich auf `window.__XTEND_DEV_API__` zu.
- Fehlende DEV API degradiert zu einem Snapshot mit `devApiPresent: false`.
- Fehlende Pflichtmethoden, geworfene Snapshot-Reads oder nicht serialisierbare Snapshot-Daten erzeugen Diagnostics.
- Die Bridge patcht keine Browser-, DOM-, Performance-, History-, Custom-Element- oder Framework-APIs.
- Fabric-, Kernel- und Performance-Snapshots werden gelesen, aber erst im Prewarm Worker/UI-Pfad normalisiert.

## XDS-WP-04 Gate Runner

Status: `completed-gate-runner`

`XDS-WP-04` produktisiert den lokalen Companion als Gate Runner fuer die DevTools-Surface. Der Companion startet weiterhin keine freien Shell-Kommandos, sondern nur Gate-Definitionen aus der Allowlist. Ausfuehrung passiert per `spawn(..., { shell: false })`.

Neue Schemas:

- `xtend.devsurface.companion.v1`
- `xtend.devsurface.companion-handshake.v1`
- `xtend.devsurface.gate-stream.v1`
- `xtend.devsurface.gate-artifact.v1`

Companion-Endpunkte:

- `GET /health` offen, meldet Companion-Metadaten und Tokenpflicht.
- `POST /handshake` tokenpflichtig, bestaetigt `x-xtend-dev-surface-token` und liefert erlaubte Gates.
- `GET /gates` tokenpflichtig, listet Allowlist-Gates.
- `POST /gate-runs` tokenpflichtig, queued einen Gate-Run und gibt `202` mit Run-ID zurueck.
- `GET /gate-runs` tokenpflichtig, liefert aktuelle Runs.
- `GET /gate-runs/:runId` tokenpflichtig, liefert einen einzelnen Run.
- `GET /gate-runs/events` tokenpflichtig, liefert Server-Sent Events fuer queued/running/stdout/stderr/completed.
- `GET /artifacts/:path` tokenpflichtig, liefert nur allowlistete `reportPath`-Artefakte.

Gate-Runner-Boundary:

- Token-Handshake ist Pflicht fuer Gate-, Stream- und Artifact-Routen.
- Command-Ausfuehrung nutzt nur definierte Gate-IDs, nie rohe Commands aus dem Panel.
- JSON-Reports werden aus `reportPath` oder aus stdout mit Log-Zeilen normalisiert.
- stdout/stderr werden nur als getrimmter Tail im Run-Record gehalten.
- Artefaktlinks werden nur fuer sichere relative `reportPath`-Werte erzeugt; absolute Pfade und Traversal werden blockiert.
- Das Panel zeigt laufende Runs als Stream-/Polling-Status und verlinkt erlaubte Artefakte ueber den lokalen Companion.

## XDS-WP-05 Performance View

Status: `completed-performance-view`

`XDS-WP-05` macht `window.__XTEND_DEV_API__.getPerformanceSnapshot()` im DevTools-Panel als bewertbares Performance-Dashboard sichtbar. Die Quelle bleibt `xtend.performance.measurement.v1`; die Dev Surface leitet daraus ein eigenes View-Modell fuer Budget, Phasen und Trend ab.

Neues Schema:

- `xtend.devsurface.performance-view.v1`

Performance-Bewertung:

- `pass` wird als `optimal` angezeigt.
- `warn` wird als `needs-improvement` angezeigt.
- `fail` wird als `flawed` angezeigt.
- `blocked` bleibt `blocked`, unbekannte Messungen bleiben `unknown`.

Budget-Modell:

- Jede Measurement erhaelt `budgetUsedPct`, `budgetDeltaMs` und `budgetStatus`.
- Der Snapshot aggregiert `totalDurationMs`, `totalBudgetMs`, `budgetMissCount`, `overBudgetMs`, `averageDurationMs` und `budgetUsedPct`.
- Budget-Misses werden ueber `durationMs > budgetMs` bestimmt, ohne Browser-Performance-APIs zu patchen.

Phase Summary:

- Measurements werden nach `phase` gruppiert.
- Pro Phase werden Count, Pass/Warn/Fail, Budget-Misses, Over-Budget-Zeit und Grade berechnet.
- Bereits gelieferte `phaseSummary`-Daten bleiben als `source` erhalten, aber die berechneten Werte sind fuer die UI kanonisch.

Trend:

- Optional gelieferte `history`, `trend` oder `samples` werden als Performance-Trend normalisiert.
- Die UI zeigt `improved`, `stable` oder `regressed` anhand der Budgetauslastung des letzten und vorherigen Samples.
- Ohne History bleibt der Trend stabil und nutzt den aktuellen Snapshot als sichtbaren Zustand.

Panel:

- Die Performance View zeigt Grade, Budgetauslastung, Trend, Warnungen, Failures, Phase Summary und die Measurement-Liste.
- Balken sind rein UI-seitig aus normalisierten Zahlen berechnet.
- Die automatische DEV-API-Abfrage bleibt ueber die Runtime Bridge und den optionalen Prewarm Worker angebunden.

## XDS-WP-06 Kernel Monitor

Status: `completed-kernel-monitor`

`XDS-WP-06` macht `window.__XTEND_DEV_API__.getKernelSnapshot()` als Kernel-Dashboard sichtbar. Die Dev Surface schreibt keine Kernel-Zustaende und importiert keine RMT-Kernel-Module; sie normalisiert nur den explizit gelieferten Snapshot.

Neues Schema:

- `xtend.devsurface.kernel-monitor.v1`

Health Mapping:

- `none` wird `healthy`.
- `suspected` wird `observing`.
- `active` wird `blocked`.
- `recovering` wird `degraded`.
- `recovered` wird `healthy`.
- `failed` wird `blocked`.

Monitor-Modell:

- `panic` normalisiert State, Health, Severity, Trigger, Panic-ID, Correlation-ID und Zeitstempel.
- `recovery` normalisiert Recovery-Status, Action, Strategy, Attempt-/Failure-Counts und blocked commits.
- `mitigation` normalisiert eine oder mehrere Mitigation Strategies mit Action, Status, Scope und Evidence.
- `affectedScopes` und `affectedJobs` werden als strukturierte Records angezeigt, nicht als rohe Strings.
- `summary` aggregiert Health, State, Severity, Scope-/Job-/Mitigation-Counts, Recovery-Zahlen und `needsAttention`.

Panel:

- Die Kernel View zeigt Kernel Health, Panic State, Recovery, Violations, Panic Details, Mitigation Strategies, Affected Scopes und Affected Jobs.
- Recovery-Status wird aus Panic State und Recovery-Failure-Count abgeleitet: `idle`, `pending`, `active`, `completed` oder `failed`.
- Auch hier bleibt der Datenpfad Runtime Bridge -> Prewarm Worker -> Panel; keine Patches und keine Kernel-Mutation.

## XDS-WP-07 Fabric View

Status: `completed-fabric-view`

`XDS-WP-07` macht `window.__XTEND_DEV_API__.getFabricTelemetrySnapshot()` als Lane-/Fiber-Dashboard sichtbar. Die Dev Surface liest nur explizite Fabric-Telemetrie und leitet daraus UI-nahe Aggregationen ab; sie uebernimmt keine Scheduler-, Lane- oder Canonical-State-Ownership.

Neues Schema:

- `xtend.devsurface.fabric-view.v1`

Lane-Modell:

- Jede Lane erhaelt Utilization, Failure Rate, Budget-Miss Rate, Backpressure Level und Health.
- `utilizationPct` ist fuer Balken auf 100 Prozent gedeckelt; `utilizationRawPct` bleibt fuer Diagnosewerte erhalten.
- Lanes koennen als Objekt oder Array geliefert werden.
- Optionale `fibers` oder `fiberRecords` pro Lane werden als strukturierte Fiber Records erhalten.

Fiber Summary:

- Der Snapshot aggregiert `fiberCount`, `completedCount`, `failedCount`, `budgetMissCount`, `activeFiberCount`, `pendingFiberCount` und `suspendedFiberCount`.
- Source-`totals` haben Vorrang; fehlende Werte werden aus den Lanes berechnet.

Backpressure:

- Backpressure normalisiert `level`, `action`, `laneIds`, `pressureLaneCount`, `reason` und Metadata.
- Ohne explizites Backpressure-Record wird der Level aus Lane-Auslastung, Failures und Budget-Misses abgeleitet.
- `high` und `critical` machen die Fabric View sichtbar degraded.

Panel:

- Die Fabric View zeigt Fabric Health, Fiber Summary, Failures, Utilization, Backpressure, Critical Lanes und alle Lanes.
- Kritische Lanes werden separat hervorgehoben, bleiben aber in der Gesamtliste erhalten.
- Alle Balken und Counts stammen aus normalisierten Snapshot-Zahlen, nicht aus Runtime-Patches.

## XDS-WP-08 Worker Path

Status: `completed-worker-path`

`XDS-WP-08` haertet den klassischen Prewarm Worker als expliziten Normalisierungspfad. Der Worker lebt weiter in `tools/xtend-dev-surface/src/prewarm-worker.js` und wird nach `tools/xtend-dev-surface/dist/prewarm-worker.js` kopiert.

Neues Schema:

- `xtend.devsurface.worker-path.v1`

Worker-Contract:

- Mode: `classic-prewarm-worker`
- Message Type: `xds:normalize-snapshot`
- Input Schema: `xtend.devsurface.runtime-bridge-read.v1`
- Output Schema: `xtend.devsurface.snapshot.v1`
- Workpackage: `XDS-WP-08`

Ownership-Grenzen:

- `normalizationOnly: true`
- `ownsDom: false`
- `ownsHostServices: false`
- `ownsCanonicalState: false`
- `remoteRuntimeAllowed: false`
- Kein Zugriff auf DOM APIs, persistenten Storage, DevTools APIs, Companion IO oder weitere Worker-Fanout-Pfade.

Chart-Daten:

- `performanceBudgetSeries` fuer Measurement-Budget-Balken.
- `performancePhaseSeries` fuer Phasen-Uebersichten.
- `fabricLaneSeries` fuer Lane-Auslastung, Failures, Budget-Misses und Backpressure.
- `fabricFiberSeries` fuer optionale Fiber Records.
- `kernelHealthSeries` fuer Health, State, Severity und betroffene Scopes/Jobs.

Audit:

- `evaluateDevSurfaceWorkerPathSource()` prueft den Worker-Source gegen die Ownership-Grenzen.
- Die Suite laedt den Worker in eine VM mit Mock-`self`, sendet `xds:normalize-snapshot` und prueft `workerPath` plus `chartData`.
- Der Panel-Pfad bleibt optional: Wenn der Worker nicht startet, wird der rohe Snapshot genutzt; wenn er startet, bleibt er rein normalisierend.

## XDS-WP-09 Handoff

Status: `completed-handoff`

`XDS-WP-09` schliesst die erste Dev-Surface-Ausbaustufe als uebergabefaehiges Tool ab. Die Source bleibt in `tools/xtend-dev-surface/src/`, die ladbare Chromium Extension liegt in `tools/xtend-dev-surface/dist/`.

Neues Schema:

- `xtend.devsurface.handoff.v1`

Handoff-Artefakte:

- `tools/xtend-dev-surface/README.md` dokumentiert Build, Test, Extension-Laden, DEV API, Companion und Boundaries.
- `tools/xtend-dev-surface/dist/handoff.json` beschreibt Build Commands, Test Commands, Load Instructions, Companion, DEV API und Artefakte maschinenlesbar.
- `tools/xtend-dev-surface/dist/build-report.json` bleibt der reproduzierbare Build-/Parity-Report.
- `package.json` verweist auf Schemas, Workpackages, Dist-Pfad, Suite, Build-Report und Handoff.

Build und Test:

- `node tools/xtend-dev-surface/build.js`
- `node scripts/run_xtend_tests.js xtend-dev-surface --json`
- `npm run test:xtend-dev-surface`

Extension laden:

1. `node tools/xtend-dev-surface/build.js` ausfuehren.
2. In Chromium/Chrome/Edge `chrome://extensions` oeffnen.
3. Developer Mode aktivieren.
4. `tools/xtend-dev-surface/dist/` als unpacked Extension laden.
5. DevTools in einer XTend-App oeffnen und das Panel `XTend` auswaehlen.

Abschluss-Boundaries:

- DEV API bleibt die einzige Datenquelle fuer App-Snapshots.
- Companion bleibt lokal und allowlist-only.
- Prewarm Worker bleibt normalization-only.
- Keine Remote Runtime, kein UI-Coprocessor, kein Monkeypatching, keine neue Framework-Abhaengigkeit.

## XDS-WP-10 Hydration/XScaler

Status: `completed-hydration-xscaler-tab`

`XDS-WP-10` erweitert die Dev Surface um einen Tab `Hydration`, der Hydration-Strategie, Resume-Status, Resume-Token, Timing, Surface-Zeilen und XScaler-Signale gemeinsam sichtbar macht. XScaler bleibt in v1 im Hydration-Kontext eingebettet, weil Lazy-Surfaces, Resume und ATC-Handoff dort diagnostisch zusammengehoeren.

Neue Schemas:

- `xtend.devsurface.hydration-snapshot.v1`
- `xtend.devsurface.hydration-view.v1`

DEV-API-Erweiterung:

- `getHydrationSnapshot()` ist optional.
- Fehlende Methode erzeugt keinen global degraded Snapshot.
- Die Runtime Bridge blockiert weiterhin asynchrone Snapshot-Returns und nicht serialisierbare Werte.
- Resume Tokens werden so angezeigt, wie die App sie liefert; redigierte Tokens werden nur als redigiert markiert.

UI und Normalisierung:

- Tab-Reihenfolge: `Performance`, `Hydration`, `Kernel`, `Fabric`, `Gates`.
- Overview-Karten zeigen Strategy, Status, Resume Token, Timing und XScaler.
- Timeline-Schritte: SSR response, resume payload, token read, hydrate/resume, lazy surface preflight, ATC handoff.
- Surface Rows zeigen Hydration-/Resume-Status pro Surface oder Root.
- XScaler zeigt Mode, Preflight-Akzeptanz, Rejections, `networkDuringRender`, lazy-loaded Surfaces und ATC Sessions.
- Prewarm Worker erzeugt Hydration-/XScaler-Chart-Daten, bleibt aber normalization-only.

Animation TestBench:

- `window.__XTEND_DEV_API__.getHydrationSnapshot()` wird aus Boot-/Resume-Payload und Runtime-State abgeleitet.
- Strategie: `server_prerender_resume`.
- Genutzte Fakten: `data-resume-token`, SSR-Hydration-Record, Resume-Payload, `boot.xscaler`, Preflight-Count, Lazy-Loaded-Surfaces und ATC-Handoffs.

## XDS-WP-11 Public Documentation

Status: `completed-public-documentation`

`XDS-WP-11` macht die Dev Surface als oeffentliche deutsch- und englischsprachige Entwicklerdokumentation auffindbar. Die redaktionelle und strukturelle Source of Truth ist `development/XTend-Docs-Quality-Implementierungsplan.md`.

Oeffentliche Pfade:

- `docs/de/xtend-dev-surface.md`
- `docs/en/xtend-dev-surface.md`
- Slug `xtend-dev-surface` in der Gruppe `quality`

Die Artikel fuehren von Build und Unpacked-Installation ueber die RMT Animation TestBench auf Port `9196` zur expliziten `window.__XTEND_DEV_API__`. Sie erklaeren alle fuenf Panel-Tabs, die Statusbewertung, den lokalen Companion, die Allowlist-Grenze sowie `No XTend app detected` und `degraded` als getrennte Fehlerzustaende. Die Extension-Shell bleibt englisch; die deutsche Dokumentation uebersetzt Erklaerungen, aber keine sichtbaren UI-Labels.

## Test- und Gateplan

```bash
node --check tools/xtend-dev-surface/contracts.js
node --check tools/xtend-dev-surface/companion.js
node --check tools/xtend-dev-surface/extension-skeleton.js
node --check tools/xtend-dev-surface/src/runtime-bridge.js
node --check tools/xtend-dev-surface/src/prewarm-worker.js
node --check tools/xtend-dev-surface/src/panel.js
node --check tools/xtend-dev-surface/build.js
node tools/xtend-dev-surface/build.js
node scripts/run_xtend_tests.js xtend-dev-surface --json
npm run test:xtend-dev-surface
```

Die Suite prueft:

- Contract-Normalisierung, Performance-Grades, Budgetbewertung, Phase Summary, Trendstatus, Hydration-/XScaler-Summary, Kernel-Monitor-Summary, Fabric-View-Aggregate, Worker-Path-Chart-Daten und Handoff-Record
- Companion-Allowlist und blockierte freie Commands
- Manifest-V3, CSP und Dist-Artefakte
- Skeleton-Contract, Build-Report und Source/Dist-Paritaet
- Runtime-Bridge-Contract, Mock-Page-Reads, fehlende DEV API und Read-Failure-Diagnostics
- Optionale Hydration-Reads, fehlende Hydration-Methode ohne globalen Degrade und negative XScaler-Fixtures
- Companion-Handshake, erlaubter Mock-Gate-Run, Stream-Events, JSON-Report-Parsing und Artifact-Boundary
- Kernel Health Mapping, Panic Details, Recovery Status, Mitigation Strategies und betroffene Scopes/Jobs
- Fabric Lane/Fiber Summary, Backpressure, kritische Lanes und Fiber Records
- Worker-Path-Audit, VM-Smoke fuer `xds:normalize-snapshot`, `workerPath` und `chartData`
- Handoff-Artefakt `dist/handoff.json`, README-Load-Anleitung und Package-Metadaten
- DevTools Page, Panel, Service Worker, Content Bridge und Prewarm Worker
- No-Monkeypatch-Regeln fuer Browser APIs
- Runner- und Package-Script-Wiring

## Extension laden

1. Optional `node tools/xtend-dev-surface/build.js` ausfuehren, um `dist/` aus `src/` zu aktualisieren.
2. In einem Chromium-nahen Browser `chrome://extensions` oeffnen.
3. Developer Mode aktivieren.
4. `tools/xtend-dev-surface/dist/` als unpacked Extension laden.
5. DevTools in einer XTend-App oeffnen und das Panel `XTend` auswaehlen.

Der lokale Companion ist optional. Ohne Companion bleibt der Gate-Bereich im degraded/read-only Zustand.
