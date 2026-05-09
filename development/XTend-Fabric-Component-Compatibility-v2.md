# XTend Fabric Component Compatibility v2

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.component.fabric-lane-ingestion.v2`
- Report Contract: `xtend.component.fabric-lane-ingestion-report.v1`
- Workpackage: `WP-E10-05`
- Bezug:
  - `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-RMT-First-Class-App-Authoring.md`
  - `development/XTend-Fabric-RMT-Lane-Mapping.md`
  - `development/XTend-Component-Fiber-Instrumentierung.md`
  - `xtendrmt/rmt-runtime.esm.js`
  - `xtendrmt/rmt-runtime.browser.js`
  - `tests/rmt/rmt_component_fabric_lane_ingestion_suite.js`

## Zweck

Dieser Contract definiert, wie der produktive XTend Component Adapter Fabric-, Fiber- und Lane-Hints aus RMT und Component Metadata aufnimmt. Ziel ist nicht, den RMT Kernel XTend-spezifisch zu machen. Ziel ist, dass der Adapter beim Mounting und bei Hydration einen deterministischen Fabric Context erzeugt.

## Boundary

Verbindliche Boundary:

```text
no-rmt-kernel-import-of-xtend-types
```

Der RMT Kernel sieht weiterhin nur `adapters`, `components`, `routes`, `schedules`, `templates` und Registry Records. XTend-spezifische DOM-Arbeit, Custom Elements, Fabric Context, Event Bridge, Hydration und Diagnostics bleiben Aufgabe von `xtend.component`.

## Adapter Surface

Der produktive Adapter `createRmtXtendComponentAdapter(...)` stellt ab diesem Contract zusaetzlich bereit:

| Operation | Zweck |
|-----------|-------|
| `resolveFabricContext(componentRef, operation, model, options)` | Lane/Fiber/Schedule-Kontext deterministisch berechnen |
| `mountComponent(...)` | Component mounten und Fabric Context in Result-Metadaten sowie DOM-Attribute schreiben |
| `hydrateComponent(...)` | Component hydrieren und Fabric Context in Result-Metadaten sowie DOM-Attribute schreiben |

Die Adapter-Capabilities enthalten `fabricContext`, `laneIngestion` und `fiberHints`.

## Precedence

Lane- und Fiber-Hints werden in dieser Reihenfolge ausgewertet:

| Rang | Quelle | Beispiel |
|------|--------|----------|
| 1 | `rmt.schedule-record` | `schedules[].id === component.schedule` |
| 2 | `rmt.component-metadata` | `component.metadata.fabric.lane` |
| 3 | `fabric.runtime-override` | `options.fabric.lane` oder `options.lane` |
| 4 | `component.static-contract` | `xtend.component.contract.v2.fabric.defaultLane` |
| 5 | `scaffold.blueprint-default` | Operation Defaults fuer `mountComponent` und `hydrateComponent` |

Konflikte werden nicht still geschluckt. Der Adapter erzeugt Diagnostics mit `rmt.xtend.component.fabric_lane.conflict`, wenn eine niedrigere Quelle eine andere Lane liefert als die gewinnende Quelle.

## Result Shape

`resolveFabricContext(...)` liefert:

```json
{
  "schema": "xtend.component.fabric-lane-ingestion.v2",
  "status": "resolved",
  "operation": "hydrateComponent",
  "componentId": "pages.settings",
  "scheduleRef": "component.idle.hydrate",
  "fabricLane": "idle",
  "rmtLane": "idle",
  "fiberKind": "component.hydrate",
  "endpointNameHint": "xtendrmt.component.hydrate",
  "source": "rmt.schedule-record"
}
```

Der Context wird in `result.metadata.fabric` gespiegelt. DOM-Hosts erhalten zusaetzlich:

- `data-xtend-fabric-lane`
- `data-xtend-rmt-lane`
- `data-xtend-fabric-fiber`
- `data-xtend-fabric-source`
- `data-rmt-endpoint`

## Defaults

| Operation | Default Schedule | Default Lane | Fiber |
|-----------|------------------|--------------|-------|
| `mountComponent` | `component.visible.mount` | `visible` | `component.mount` |
| `hydrateComponent` | `component.idle.hydrate` | `idle` | `component.hydrate` |
| `registerComponent` | `diagnostics.snapshot` | `diagnostics` | `diagnostics.snapshot` |

## Diagnostics

Neue Diagnosecodes:

| Code | Level | Bedeutung |
|------|-------|-----------|
| `rmt.xtend.component.fabric_lane.conflict` | `info` | niedrigere Quelle wurde durch hoehere Precedence ueberschrieben |
| `rmt.xtend.component.fabric_lane.defaulted` | `info` | keine Quelle lieferte Lane, Scaffold Default wurde genutzt |

## Handoff

`WP-E10-06` kann auf diesem Context Telemetry-Events fuer `mount`, `hydrate`, `render`, `update`, `event`, `error` und `unmount` aufbauen. `WP-E10-13` kann die RMT-first Demo-App ohne eigene Lane-Aufloesung an den Adapter anschliessen.
