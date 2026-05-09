# ER-WP-08 - Fabric Runtime Skeleton implementieren

- Status: `completed`
- Datum: 5. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-08.fabric-runtime-skeleton.v1`
- API Contract: `xtend.fabric.api.v1`
- Diagnostic Contract: `xtend.fabric.diagnostic.v1`
- Runtime Entry: `fabric/xtend-fabric.js`
- Bezug:
  - `development/ADR-XTend-Fabric.md`
  - `development/ER-WP-07-XTend-Fabric-ADR-und-API-Surface-definieren.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/ADR-XTend-Security-Trust-Boundaries.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `docs/xtend-fabric.md`
  - `fabric/xtend-fabric.js`
  - `tests/fabric/fabric_runtime_suite.js`
  - `package.json`

## Ziel

`ER-WP-08` stellt den minimalen produktiven Runtime-Kern fuer `XTend-Fabric` bereit.

Das Paket bleibt bewusst klein: keine automatische globale Component-Patch-Magie, kein externes Error Reporting, kein XTendRMT Kernel Import und kein Packaging-Vorgriff. Der Runtime-Kern schafft die stabile Host-Schicht, auf der `ER-WP-09`, `ER-WP-10`, `ER-WP-11`, `ER-WP-14`, `ER-WP-15` und `ER-WP-16` aufbauen koennen.

## Ergebnisartefakte

| Artefakt | Status | Rolle |
|----------|--------|-------|
| `fabric/xtend-fabric.js` | produktiv | Runtime Skeleton fuer `XTend-Fabric` |
| `tests/fabric/fabric_runtime_suite.js` | produktiv | API-, Diagnostic-, Reporter-, Redaction-, Fiber- und Boundary-Gate |
| `docs/xtend-fabric.md` | produktiv | offizieller Entwicklerguide unter `xtend.docs.xtend-fabric.v1` |
| `npm run test:fabric` | produktiv | lokaler Fabric-Einzelgate |
| `node scripts/run_xtend_tests.js fabric --json` | produktiv | maschinenlesbarer Fabric-Gate |

## Runtime Surface

Der Runtime-Kern exportiert:

```js
createXtendFabric(options)
createNoopReporter()
normalizeDiagnostic(event, defaults, clock)
normalizeFiber(fiberInput, defaults, clock)
redactDiagnostic(event)
redactValue(value)
```

Eine Fabric-Instanz stellt bereit:

```js
fabric.wrapComponent(componentClassOrInstance, options)
fabric.runFiber(fiberInput, callback)
fabric.emitDiagnostic(event)
fabric.registerReporter(reporter)
fabric.createBoundary(scope, options)
fabric.captureError(error, context)
fabric.connectRmtDiagnostics(source, options)
fabric.getDiagnostics()
fabric.getFibers()
fabric.getReporters()
fabric.clearDiagnostics()
fabric.clearFibers()
fabric.dispose()
```

## Contract-Abdeckung

| Contract | Umsetzung |
|----------|-----------|
| `xtend.fabric.api.v1` | `createXtendFabric`, Instanzmethoden, Browser Namespace |
| `xtend.fabric.diagnostic.v1` | normalisierte lokale Diagnostics mit ID, Timestamp, Level, Code, Source und Phase |
| `xtend.fabric.reporter.v1` | opt-in Reporter mit `publish`, `flush`, `dispose` |
| `xtend.fabric.redaction.v1` | Redaction fuer sensitive Metadaten und DOM Nodes |
| `xtend.fabric.fiber.v1` | `runFiber` normalisiert und speichert UI-Arbeit |
| `xtend.fabric.lane.v1` | kanonische Lane Records fuer `user-blocking`, `a11y`, `visible`, `transition`, `idle`, `background`, `diagnostics` |

## Sicherheits- und Privacy-Grenzen

- Default Reporter ist `noop`; ohne `registerReporter` gibt es keine externe Uebertragung.
- Reporter erhalten nur redigierte Diagnostics.
- DOM Nodes werden nicht serialisiert.
- Sensitive Felder wie `token`, `password`, `cookie`, `authorization`, `header`, `query`, `form`, `session` und `secret` werden redigiert.
- `connectRmtDiagnostics` konsumiert Adapter-/Bridge-Outputs und importiert keinen XTendRMT Kernel.

## Handoff an Folgepakete

| Folgepaket | Aktueller Status nach ER-WP-11 | Handoff |
|------------|--------------------------------|---------|
| `ER-WP-09` | completed | Component Lifecycle Error Boundary ist produktiv gehaertet |
| `ER-WP-10` | completed | Reporter Adapter Contract setzt auf Runtime-Reporter auf |
| `ER-WP-11` | completed | Runtime Diagnostics Bridge nutzt Reporter Adapter fuer `xstate`, API und XTendRMT Diagnostics |
| `ER-WP-14` | completed | Lane Mapping aus `ER-WP-13` ist in Component-Fiber-Instrumentierung genutzt |
| `ER-WP-15` | completed | Route-Fiber-Korrelation steht fuer Navigation und Route Render bereit |
| `ER-WP-16` | completed | fuehrt Runtime-Bridges aus `ER-WP-11`, `ER-WP-14` und `ER-WP-15` als Telemetry Snapshot zusammen |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `fabric/xtend-fabric.js` existiert | erfuellt |
| `createXtendFabric(options)` existiert | erfuellt |
| `wrapComponent`, `runFiber`, `emitDiagnostic`, `registerReporter`, `createBoundary`, `captureError` existieren | erfuellt |
| Noop Reporter ist Default | erfuellt |
| lokaler Diagnostic Store ist vorhanden | erfuellt |
| Reporter sind opt-in | erfuellt |
| Redaction laeuft vor Reporter-Ausgabe | erfuellt |
| RMT Kernel wird nicht importiert | erfuellt |
| Tests fuer API Shape, Noop-Default und Reporter-Opt-in existieren | erfuellt |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check fabric/xtend-fabric.js
node --check tests/fabric/fabric_runtime_suite.js
node scripts/run_xtend_tests.js fabric --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

`ER-WP-08` ist abgeschlossen. XTend besitzt jetzt einen produktiven `XTend-Fabric` Runtime-Kern fuer lokale Diagnostics, Error Capture, opt-in Reporter, Fibers, Lanes, Redaction und RMT-Diagnostic-Consumption. `ER-WP-09`, `ER-WP-10` und `ER-WP-11` sind inzwischen abgeschlossen.
