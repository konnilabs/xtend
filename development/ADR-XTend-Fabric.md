# ADR - XTend-Fabric

- Status: Accepted
- Datum: 5. Mai 2026
- Contract: `xtend.fabric.adr.v1`
- API Contract: `xtend.fabric.api.v1`
- Roadmap-Paket: `ER-WP-07`
- Bezug:
  - `development/ROADMAP-XTend-Enterprise-Reife.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
  - `tests/rmt/rmt_compatibility_suite.js`

## Kontext

XTend hat nach Epic 05 einen stabilen Web-Component- und XTendRMT-Bridge-Kern. Was fuer Enterprise-Reife noch fehlt, ist eine globale Host-Schicht, die Runtime-Fehler, Diagnostics, Telemetry, Reporter-Anbindung und spaetere Scheduler-Optimierung kontrolliert zusammenfuehrt.

XTendRMT besitzt bereits State-, Scheduler- und Diagnostics-Bruecken sowie Performance-/Schedule-Surfaces. Diese duerfen nicht in XTend eingebettet werden und XTend darf nicht in den RMT Kernel wandern. Die UI-Seite braucht deshalb eine eigene, host-nahe Schutz- und Integrationsschicht.

Diese Schicht heisst `XTend-Fabric`.

## Entscheidung

XTend fuehrt `XTend-Fabric` als globale Sicherheits-, Telemetry-, Error-Boundary- und Enterprise-Hook-Schicht ein.

Fabric ist:

- eine XTend-Host-Schicht oberhalb von Loader, API, Komponenten und App-Code
- eine optionale Integrationsschicht fuer XTendRMT Diagnostics und Scheduler-Signale
- ein sicherer Adapterpunkt fuer QS-, Monitoring- und Error-Reporting-Systeme
- eine Sugar-API fuer wiederkehrende Runtime-Schutzmuster

Fabric ist nicht:

- Teil des XTendRMT Kernels
- ein Ersatz fuer XTendRMT
- ein externes Telemetrie-Backend
- ein Vendor-spezifischer Error-Reporting-Client
- ein Grund, Komponenten oder RMT-Dokumente ohne lokale Tests zu akzeptieren

## Namespaces und Packaging-Ziel

| Surface | Name | Status |
|---------|------|--------|
| API-Name | `@xtend-fabric` | kanonische API-Bezeichnung |
| Browser Namespace | `window.XTendFabric` | browsernahe globale Fassade |
| Contract Namespace | `xtend.fabric.*` | Contract- und Diagnostic-Namespace |
| erster Runtime-Pfad | `fabric/xtend-fabric.js` | Ziel fuer `ER-WP-08` |
| spaeterer Package Export | `@xtend-fabric/core` | reserviert fuer Release-Strategie |
| spaeterer Browser Export | `@xtend-fabric/browser` | reserviert fuer Release-Strategie |

Bis `ER-WP-06` die Package-Export-Strategie konkretisiert, ist `@xtend-fabric` die API-Bezeichnung und kein zwingend publiziertes NPM-Package.

## API Surface

Der API Contract traegt:

```text
xtend.fabric.api.v1
```

Mindest-API fuer `ER-WP-08`:

```js
createXtendFabric(options)
```

Erzeugt eine Fabric-Instanz mit Noop-Reporter, lokalen Diagnostics und optionalen Host-Adaptern.

```js
fabric.wrapComponent(componentClassOrInstance, options)
```

Erzeugt eine Error-Boundary-Fassade fuer Custom-Element-Lifecycle-Arbeit.

```js
fabric.runFiber(fiberInput, callback)
```

Fuehrt eine UI-Arbeitseinheit mit Diagnostics-, Timing-, Lane- und Fehlerkontext aus.

```js
fabric.emitDiagnostic(event)
```

Publiziert ein strukturiertes Diagnostic Event lokal und optional an registrierte Reporter.

```js
fabric.registerReporter(reporter)
```

Registriert einen opt-in Reporter. Ohne Registrierung gibt es keine externe Uebertragung.

```js
fabric.createBoundary(scope, options)
```

Erzeugt eine wiederverwendbare Boundary fuer Loader-, Component-, Route- oder API-Arbeit.

```js
fabric.captureError(error, context)
```

Normalisiert Fehler in Fabric Diagnostics.

```js
fabric.connectRmtDiagnostics(source, options)
```

Koppelt XTendRMT Diagnostics oder Adapter Results an Fabric, ohne RMT Kernel Imports zu erzeugen.

## Diagnostic Event Contract

Der Diagnostic Contract traegt:

```text
xtend.fabric.diagnostic.v1
```

Mindestfelder:

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `schema` | ja | `xtend.fabric.diagnostic.v1` |
| `id` | ja | lokale Event-ID |
| `timestamp` | ja | ISO-Zeitpunkt |
| `level` | ja | `debug`, `info`, `warn`, `error`, `fatal` |
| `code` | ja | stabiler Diagnostic Code |
| `message` | ja | sichere, kurze Meldung |
| `source` | ja | `loader`, `component`, `router`, `api`, `rmt`, `fabric`, `app` |
| `phase` | ja | z.B. `load`, `mount`, `hydrate`, `render`, `event`, `disconnect`, `report` |
| `componentRef` | nein | Component Tag, ID oder RMT Component Ref |
| `fiberId` | nein | Bezug auf UI-Fiber |
| `lane` | nein | geplante oder beobachtete Lane |
| `correlationId` | nein | route-, component- oder request-nahe Korrelation |
| `metadata` | nein | redigierte Zusatzdaten |
| `cause` | nein | normalisierte Fehlerdaten ohne ungefilterte Payloads |

Diagnostic Codes muessen namespaced sein:

- `xtend.fabric.*`
- `xtend.loader.*`
- `xtend.component.*`
- `xtend.router.*`
- `xtend.api.*`
- `xtend.rmt.*`

## Error-Boundary-Pflichten

Fabric muss Fehler in diesen Phasen modellieren koennen:

- Loader: Manifest, Core Modules, Preload, API Init
- Component: `connectedCallback`, `attributeChangedCallback`, `render`, `hydrate`, Event Handler, `disconnectedCallback`
- Router: Navigation, Route Render, Route Hydration
- API: Overlay-, Feedback-, Theme- und State-nahe Fassade
- RMT Bridge: Adapter Results, Schedule Endpoint Signals, Diagnostics

`ER-WP-08` stellt dafuer nur das Runtime Skeleton bereit. `ER-WP-09` haertet die Component Lifecycle Boundary produktiv.

## Reporter Boundary

Reporter sind opt-in. Der Default sendet nichts extern.

Erlaubte Reporter-Klassen:

| Reporter | Zweck | Default |
|----------|-------|---------|
| `noop` | keine Ausgabe, deterministische Tests | ja |
| `console` | lokale Entwicklung | nein |
| `test` | Test- und Fixture-Assertions | nein |
| `enterprise` | spaetere QS-/Monitoring-Anbindung | nein |

Reporter Contract:

```js
{
  id: 'console',
  schema: 'xtend.fabric.reporter.v1',
  publish(event, context) {},
  flush(reason) {},
  dispose() {}
}
```

Reporter duerfen nur redigierte Diagnostic Events erhalten. Rohfehler, DOM-Knoten, Nutzdaten aus Forms, URL-Queries oder Template-Markup duerfen nicht ungefiltert weitergegeben werden.

## Privacy, Sampling und Redaction

Fabric muss von Anfang an Enterprise- und Datenschutzgrenzen respektieren.

Pflichten:

- externe Reporter sind opt-in
- Sampling ist konfigurierbar
- Redaction laeuft vor Reporter-Ausgabe
- sensible Felder werden standardmaessig entfernt
- Raw DOM Nodes werden nie serialisiert
- Error `stack` ist lokal erlaubt, aber fuer Reporter redigierbar
- User-, Form-, Token-, Cookie-, Query- und Header-Daten duerfen nicht ungeprueft in Metadata landen

Redaction Contract:

```text
xtend.fabric.redaction.v1
```

## RMT Boundary

Fabric darf XTendRMT Signale konsumieren:

- Adapter Results aus `createRmtStateSchedulerDiagnosticsBridge`
- Diagnostics aus `rmt.state-scheduler-diagnostics`
- Schedule Endpoint Signals
- Performance- und Backpressure-Snapshots

Fabric darf nicht:

- den XTendRMT Kernel importieren oder veraendern
- RMT Scheduler Policies in XTend-only Sonderfaelle umschreiben
- XTend als Pflicht-Host in RMT etablieren
- RMT-Dokumente parsen, normalisieren oder validieren

Die Kopplung bleibt:

```text
RMT Kernel -> Adapter/Bridge Results -> XTend-Fabric -> XTend UI / Reporter
```

Nicht erlaubt:

```text
RMT Kernel -> XTend-Fabric -> XTend UI
```

## Fiber- und Lane-Vorbereitung

`ER-WP-07` definiert noch nicht den vollstaendigen Fiber-/Lane-Contract. Das bleibt `ER-WP-12`.

Fabric muss aber folgende Felder als reservierte Runtime-Kontexte akzeptieren:

- `fiberId`
- `fiberKind`
- `lane`
- `budgetClass`
- `correlationId`
- `componentRef`
- `routeRef`
- `scheduleRef`

Damit kann `ER-WP-08` das Runtime Skeleton ohne spaeteren API-Bruch bauen.

## Handoff an ER-WP-08

`ER-WP-08` darf jetzt starten und muss mindestens bereitstellen:

- `fabric/xtend-fabric.js`
- `createXtendFabric(options)`
- Instanzmethoden `wrapComponent`, `runFiber`, `emitDiagnostic`, `registerReporter`, `createBoundary`, `captureError`
- Noop Reporter
- lokaler Diagnostic Store
- Tests fuer API Shape, Noop-Default und Reporter-Opt-in

## Nicht Teil dieser Entscheidung

Nicht Teil von `ER-WP-07`:

- produktive Fabric Runtime
- konkrete Component Lifecycle Patches
- vollstaendiger Fiber-/Lane-Contract
- Performance Budget Gate
- externe Reporter-Implementierung
- Package Publishing

Diese Punkte starten in `ER-WP-08`, `ER-WP-09`, `ER-WP-10`, `ER-WP-11`, `ER-WP-12` und `ER-WP-16`.

## Ergebnis

Die Entscheidung ist akzeptiert. `XTend-Fabric` ist die offizielle Host-Schicht fuer Safety, Telemetry, Error Boundaries, Reporter und spaetere UI-Scheduler-Anbindung. `@xtend-fabric` ist die kanonische API-Bezeichnung, `window.XTendFabric` die browsernahe Fassade, `xtend.fabric.api.v1` der API Contract. `ER-WP-08` kann das Runtime Skeleton implementieren.
