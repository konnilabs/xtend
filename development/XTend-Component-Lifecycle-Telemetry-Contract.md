# XTend Component Lifecycle Telemetry Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.component.lifecycle-telemetry.v1`
- Report Contract: `xtend.component.lifecycle-telemetry-report.v1`
- Workpackage: `WP-E10-06`
- Bezug:
  - `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-Fabric-Component-Compatibility-v2.md`
  - `development/XTend-Telemetry-Snapshot-und-Backpressure-Contract.md`
  - `fabric/xtend-fabric.js`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `tests/rmt/rmt_component_lifecycle_telemetry_suite.js`

## Zweck

Dieser Contract standardisiert Component Lifecycle Telemetry fuer XTend-Komponenten, die ueber RMT gemountet, hydriert oder durch Events aktiviert werden.

Das Ziel ist nicht, XTend in den RMT Kernel einzubetten. RMT stellt `xtend.component` als Adapter bereit, der Component-, Route-, Schedule- und Fabric-Kontext an die Host-Grenze liefert. Der Adapter erzeugt daraus Telemetry Records, die Fabric Snapshots aggregieren koennen.

Verbindliche Boundary:

```text
no-rmt-kernel-import-of-xtend-types
```

## Lifecycle Operationen

Der Contract deckt diese Operationen ab:

| Operation | Typischer Ursprung | Fiber Kind |
|-----------|--------------------|------------|
| `mount` | `mountComponent(...)` oder `connectedCallback` | `component.mount` |
| `hydrate` | `hydrateComponent(...)` oder `hydrate(...)` | `component.hydrate` |
| `render` | expliziter Render-Zyklus | `component.render` |
| `update` | Property-, Attribute- oder State-Update | `component.update` |
| `event` | DOM-Event, Command oder Action Binding | `event.handler` |
| `unmount` | Disconnect, Dispose oder Route-Wechsel | `component.disconnect` |
| `error` | Lifecycle Boundary oder Adapter-Fehler | `diagnostics.snapshot` |

## Record Shape

Ein normalisierter Record traegt:

```json
{
  "schema": "xtend.component.lifecycle-telemetry.v1",
  "operation": "hydrate",
  "status": "ok",
  "componentId": "pages.settings",
  "rmtComponentId": "pages.settings",
  "tag": "x-settings-page",
  "routeRef": "settings",
  "scheduleRef": "component.idle.hydrate",
  "fabricLane": "idle",
  "rmtLane": "idle",
  "fiberKind": "component.hydrate",
  "durationMs": 4.2,
  "diagnosticCount": 0,
  "backpressureSignal": null
}
```

Pflichtfelder fuer Gates:

- `schema`
- `operation`
- `status`
- `componentId`
- `rmtComponentId`
- `tag`
- `routeRef`
- `scheduleRef`
- `fabricLane`
- `rmtLane`
- `fiberKind`
- `durationMs`
- `diagnosticCount`

## Statusmodell

| Status | Bedeutung |
|--------|-----------|
| `ok` | Lifecycle-Operation wurde erfolgreich ausgefuehrt |
| `degraded` | Operation lief, hat aber Diagnostics oder Fallbacks erzeugt |
| `skipped` | Operation konnte bewusst nicht ausgefuehrt werden |
| `failed` | Operation oder Handler ist fehlgeschlagen |

`failed` und explizite `backpressureSignal` Records duerfen Backpressure erhoehen. Deadline-Ueberschreitungen aus `durationMs` und Lane Budget duerfen ebenfalls zu Backpressure-Signalen werden.

## Adapter Surface

`createRmtXtendComponentAdapter(...)` stellt bereit:

| Operation | Telemetry-Pfad |
|-----------|----------------|
| `mountComponent(...)` | schreibt `result.metadata.telemetry` und optional in `options.telemetryCollector` |
| `hydrateComponent(...)` | schreibt `result.metadata.telemetry` und optional in `options.telemetryCollector` |
| Event Bridge | erzeugt `event` Records bei DOM-Event-Ausfuehrung |
| `recordComponentTelemetry(record, options)` | manueller Adapter-Hook fuer `render`, `update`, `unmount` und `error` |

Die Adapter-Capabilities enthalten `componentTelemetry`.

## Fabric Snapshot

`fabric.recordComponentTelemetry(record)` oder `fabric.createTelemetrySnapshot({ componentTelemetry })` aggregieren Component Records in:

```text
snapshot.componentTelemetry
```

Ohne explizite Snapshot-Option liest Fabric den lokalen Component-Telemetry-Store. Die Sektion enthaelt:

- `recordCount`
- `operations`
- `components`
- `lanes`
- `statusCounts`
- `diagnosticCount`
- `backpressureSignalCount`
- `durationMs`, `maxDurationMs`, `averageDurationMs`
- die letzten normalisierten Records

Backpressure wird aus Component-Telemetry zusaetzlich erzeugt, wenn:

- `status === "failed"`
- `durationMs` das Lane-Budget ueberschreitet
- `backpressureSignal` gesetzt ist

## Kernel Boundary

Der RMT Kernel importiert weiterhin keine XTend-Komponenten, keine Fabric Runtime, keine DOM APIs und keine Telemetry-Collector. Die Adapter-Operation bekommt nur Host-Optionen wie `telemetryCollector`, `recordTelemetry` oder `fabric` und erzeugt daraus additive Metadaten.

## Gates

Der lokale Gate fuer diesen Contract ist:

```bash
node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json
```

Er prueft ESM- und Browser-Runtime, Fabric Snapshot Aggregation, Backpressure-Anschluss, Type Definitions, Schema-, Package- und Scaffold-Anker.
