# ER-WP-07 - XTend-Fabric ADR und API Surface definieren

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-07.fabric-api-surface.v1`
- ADR: `development/ADR-XTend-Fabric.md`
- API Contract: `xtend.fabric.api.v1`
- Bezug:
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/WP-E05-12-State-Scheduler-und-Diagnostics-Bridge-anbinden.md`
  - `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `tests/references/reference_path_suite.js`

## Ziel

`ER-WP-07` legt `XTend-Fabric` als globale Sicherheits-, Telemetry-, Error-Boundary- und Enterprise-Hook-Schicht fest.

Das Paket implementiert noch keine Runtime. Es friert API Surface, Browser Namespace, Reporter Boundary, Privacy-/Redaction-Grundregeln und RMT-Grenzen ein, damit `ER-WP-08` das Runtime Skeleton ohne spaetere API-Umkehr bauen kann.

## Entscheidung

Die Architekturentscheidung liegt in `development/ADR-XTend-Fabric.md`.

Kernentscheidungen:

- API-Name: `@xtend-fabric`
- Browser Namespace: `window.XTendFabric`
- Contract Namespace: `xtend.fabric.*`
- erster Runtime-Pfad fuer `ER-WP-08`: `fabric/xtend-fabric.js`
- API Contract: `xtend.fabric.api.v1`
- Diagnostic Contract: `xtend.fabric.diagnostic.v1`
- Reporter Contract: `xtend.fabric.reporter.v1`
- Redaction Contract: `xtend.fabric.redaction.v1`

## API Surface

`ER-WP-08` muss mindestens diese API umsetzen:

| API | Zweck |
|-----|-------|
| `createXtendFabric(options)` | Fabric Instanz mit Noop-Default erzeugen |
| `fabric.wrapComponent(componentClassOrInstance, options)` | Component Lifecycle Boundary vorbereiten |
| `fabric.runFiber(fiberInput, callback)` | UI-Arbeitseinheit mit Kontext ausfuehren |
| `fabric.emitDiagnostic(event)` | strukturiertes Diagnostic Event publizieren |
| `fabric.registerReporter(reporter)` | opt-in Reporter registrieren |
| `fabric.createBoundary(scope, options)` | Boundary fuer Loader, Component, Router, API oder RMT erzeugen |
| `fabric.captureError(error, context)` | Fehler in Diagnostics normalisieren |
| `fabric.connectRmtDiagnostics(source, options)` | RMT Adapter-/Bridge-Signale konsumieren |

## Diagnostic Event Mindestform

Diagnostics muessen mindestens diese Felder modellieren:

- `schema`
- `id`
- `timestamp`
- `level`
- `code`
- `message`
- `source`
- `phase`
- `componentRef`
- `fiberId`
- `lane`
- `correlationId`
- `metadata`
- `cause`

Nicht jedes Feld ist immer Pflicht, aber `schema`, `id`, `timestamp`, `level`, `code`, `message`, `source` und `phase` muessen immer vorhanden sein.

## Reporter Boundary

Reporter sind opt-in. Der Default-Reporter ist `noop`.

Erlaubte Reporter-Klassen fuer die naechste Implementierung:

- `noop`
- `console`
- `test`
- spaeter `enterprise`

Reporter duerfen nur redigierte Diagnostic Events erhalten. Externe Reporter duerfen nicht automatisch aktiv sein.

## Privacy und Redaction

Fabric muss diese Regeln ab dem ersten Runtime Skeleton respektieren:

- keine externe Uebertragung im Default
- Sampling konfigurierbar
- Redaction vor Reporter-Ausgabe
- keine Serialisierung von DOM Nodes
- keine ungeprueften User-, Form-, Token-, Cookie-, Query- oder Headerdaten
- `stack` lokal erlaubt, aber fuer Reporter redigierbar

## RMT Boundary

Fabric konsumiert XTendRMT-Signale nur ueber Adapter- und Bridge-Outputs.

Erlaubt:

- Adapter Results
- `rmt.state-scheduler-diagnostics`
- Schedule Endpoint Signals
- Diagnostics
- Performance-/Backpressure-Snapshots

Nicht erlaubt:

- RMT Kernel importieren
- RMT Scheduler Policies in XTend-only Sonderfaelle umschreiben
- XTend als Pflicht-Host im RMT Kernel etablieren
- `.rmt` Dokumente in Fabric parsen oder validieren

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-07 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-08` | ready | Fabric Runtime Skeleton kann implementiert werden |
| `ER-WP-09` | next | Component Lifecycle Error Boundary wartet auf Runtime Skeleton |
| `ER-WP-10` | blocked | Reporter Adapter Contract wartet auf Runtime Skeleton |
| `ER-WP-11` | blocked | Fabric Bridge zu `xstate`, API und XTendRMT Diagnostics wartet auf Runtime und Reporter |
| `ER-WP-12` | ready | Fiber-/Lane-Contract kann parallel fortfahren |

## Betroffene Pfade fuer Folgearbeit

| Pfad | Erwartete Folgearbeit |
|------|-----------------------|
| `fabric/xtend-fabric.js` | Runtime Skeleton in `ER-WP-08` |
| `tests/fabric/` | Fabric API-, Reporter- und Diagnostics-Tests |
| `xtend-loader.js` | spaeter Loader-Fehler an Fabric melden |
| `api.js` | spaeter API-Diagnostics an Fabric melden |
| `components/*` | spaeter Lifecycle Boundaries ueber Fabric |
| `xtendrmt/*` | nur Adapter-/Bridge-Signale konsumieren, kein Kernel-Import |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Fabric ist klar von XTendRMT Kernel getrennt | erfuellt: RMT Boundary dokumentiert |
| Fabric ist klar von App-Code getrennt | erfuellt: Host-Schicht und Browser Namespace definiert |
| API Surface ist fuer ER-WP-08 ausreichend | erfuellt: Mindest-API und Runtime-Pfad definiert |
| Reporter Boundary ist opt-in | erfuellt: Noop Default und Reporter-Klassen definiert |
| Privacy/Sampling/Redaction sind vorbereitet | erfuellt: Redaction- und Default-Regeln dokumentiert |
| `ER-WP-08` kann Runtime Skeleton implementieren | erfuellt |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-07` ist abgeschlossen. `XTend-Fabric` ist als Host-Schicht fuer Safety, Telemetry, Error Boundaries, Reporter und spaetere UI-Scheduler-Anbindung festgelegt. `ER-WP-08` ist startbereit.
