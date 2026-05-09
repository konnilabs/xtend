# XTend Telemetry Snapshot und Backpressure Contract

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.fabric.telemetry-snapshot.v1`
- Backpressure Contract: `xtend.fabric.backpressure-signal.v1`
- Performance Measurement Contract: `xtend.performance.measurement.v1`
- Runtime: `fabric/xtend-fabric.js`
- Test-Gate: `tests/fabric/fabric_telemetry_snapshot_suite.js`
- Runner: `node scripts/run_xtend_tests.js fabric-telemetry-snapshot --json`

## Zweck

XTend-Fabric fuehrt ab ER-WP-16 lokale Telemetry Snapshots zusammen. Ein Snapshot aggregiert Fibers, Diagnostics, Performance-Runtime-Eintraege, Runtime-Bridge-Snapshots und Backpressure-Signale. Damit kann XTend Scheduler-Entscheidungen vorbereiten, ohne einen konkreten Scheduler oder ein externes Telemetry-Backend vorauszusetzen.

Der RMT Kernel wird nicht importiert. Fabric erzeugt nur host-nahe, redigierte Records, die XTendRMT, ein anderer Scheduler oder ein Enterprise Reporter optional konsumieren kann.

## Runtime API

```js
const snapshot = fabric.createTelemetrySnapshot({
  runtimeBridge,
  performance: window.performance,
  correlationId: 'route.settings'
});

fabric.publishTelemetrySnapshot(snapshot);
```

| API | Zweck |
|-----|-------|
| `createTelemetrySnapshot(options)` | aggregiert Fibers, Diagnostics, Lanes, Performance und Backpressure |
| `publishTelemetrySnapshot(snapshotOrOptions, options)` | publiziert einen Snapshot als lokale Diagnostic an opt-in Reporter |
| `exportTelemetrySnapshot(snapshotOrOptions, options)` | Alias fuer Reporter-/QS-Schichten |
| `createBackpressureSignal(signal, defaults)` | erzeugt redigierte Backpressure-Signale |

## Snapshot Mindestform

```js
{
  schema: 'xtend.fabric.telemetry-snapshot.v1',
  id: 'xtend.fabric.telemetry.1',
  timestamp: '2026-05-06T14:00:00.000Z',
  fiberCount: 12,
  diagnosticCount: 3,
  totals: {
    completedCount: 10,
    failedCount: 1,
    budgetMissCount: 2,
    averageDurationMs: 42
  },
  lanes: {
    visible: { fiberCount: 4, budgetMissCount: 1 },
    transition: { failedCount: 1 }
  },
  backpressure: {
    schema: 'xtend.fabric.backpressure-signal.v1',
    level: 'medium',
    action: 'coalesce-idle-work'
  },
  performance: {
    supported: true,
    entryCount: 4,
    measurementSchema: 'xtend.performance.measurement.v1',
    measurementCount: 4,
    phaseSummary: {
      hydrate: { measurementCount: 1 }
    }
  }
}
```

## Backpressure Profil

Backpressure wird nicht als globale Sperre verstanden. Fabric berechnet einen lokalen Hinweis fuer Host- oder Scheduler-Schichten.

| Level | Score | Aktion |
|-------|-------|--------|
| `none` | `0` | `continue` |
| `low` | `>= 1` | `observe` |
| `medium` | `>= 3` | `coalesce-idle-work` |
| `high` | `>= 7` | `defer-background-work` |
| `critical` | `>= 12` | `protect-user-blocking-work` |

Quellen:

- Fiber-Fehler
- Deadline-/Budget-Ueberschreitungen
- `metadata.backpressureSignal` aus Component- oder Route-Fibers
- Diagnostic-Metadaten mit `backpressureSignal`
- explizite `backpressureSignals` in `createTelemetrySnapshot(options)`

## Performance Runtime Anschluss

Snapshots lesen optional eine Performance Runtime:

- `options.performance`
- `options.performanceTarget`
- `window.performance`
- `globalThis.performance`
- `options.performanceEntries`

Standardmaessig werden `mark` und `measure` Eintraege mit Prefix `xtend.` beruecksichtigt. Der Prefix ist ueber `performancePrefix` anpassbar.

Ab `ER-WP-18` normalisiert Fabric diese Eintraege zusaetzlich als `xtend.performance.measurement.v1`:

- `performance.measurements`
- `performance.measurementSchema`
- `performance.measurementCount`
- `performance.phaseSummary`

Loader-, Hydration-, Render- und Route-Phasen sind dadurch im selben Snapshot sichtbar wie Fibers, Lanes und Backpressure.

## Reporter Export

`publishTelemetrySnapshot` erzeugt eine redigierte Diagnostic:

| Feld | Wert |
|------|------|
| `code` | `xtend.fabric.telemetry.snapshot` |
| `lane` | `diagnostics` |
| `source` | `fabric` |
| `phase` | `telemetry` |

Reporter bleiben opt-in. Der Default `noop` sendet nichts extern.

## RMT Boundary

Erlaubt:

- `scheduleRef`, `routeRef`, `componentRef`, `fiberId`, `lane` und `correlationId` in Snapshots halten
- Backpressure-Aktionen als Host-/Scheduler-Hinweise bereitstellen
- Runtime-Bridge-Snapshots von ER-WP-11 einbetten
- Performance-Eintraege redigiert referenzieren

Nicht erlaubt:

- RMT Kernel importieren
- Scheduler-Entscheidungen hart in Fabric erzwingen
- externe Telemetry ohne opt-in Reporter senden
- unredigierte Secrets in Snapshot oder Reporter Export uebertragen

## Abnahme

| Kriterium | Status |
|-----------|--------|
| `createTelemetrySnapshot` aggregiert Fibers nach Lane | erfuellt |
| `createBackpressureSignal` erzeugt redigierte Signale | erfuellt |
| Fiber-Fehler und Budget-Misses erhoehen Backpressure | erfuellt |
| Performance Runtime wird optional gelesen | erfuellt |
| Performance Entries werden als `xtend.performance.measurement.v1` normalisiert | erfuellt |
| Loader- und Hydration-Phasen erscheinen in `phaseSummary` | erfuellt |
| `publishTelemetrySnapshot` erreicht opt-in Reporter | erfuellt |
| RMT Kernel wird nicht importiert | erfuellt |

## Verifikation

```bash
node --check fabric/xtend-fabric.js
node --check tests/fabric/fabric_telemetry_snapshot_suite.js
node --check tests/fabric/fabric_performance_measurement_suite.js
node scripts/run_xtend_tests.js fabric-telemetry-snapshot --json
node scripts/run_xtend_tests.js fabric-performance-measurements --json
npm run test:fabric-telemetry
npm run test:fabric-performance
```

## Handoff

| Paket | Status | Handoff |
|-------|--------|---------|
| `ER-WP-18` | completed | Loader- und Hydration-Messpunkte fuellen Snapshot-Performance-Eintraege |
| `ER-WP-19` | completed | baut Budget-Auswertung gegen `xtend.performance.measurement.v1` und `phaseSummary` |
| `ER-WP-20` | completed | koppelt Lazy/Idle/Visible Hydration Policies an Backpressure-Aktionen |
| `ER-WP-21` | completed | Autorenregeln sind aus Snapshot-, Hydration- und Backpressure-Daten abgeleitet |
