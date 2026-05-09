# XTend SurfaceManager Native RMT Surfaces Domain Contract

Schema: `xtend.rmt.surfaces-domain.v1`
Adapter: `xtend.surface.adapter.v1`
Workpackage: `WP-SM-08`
Status: accepted-native-surfaces-domain-contract

## Ziel

`WP-SM-08` macht Surface Records als native RMT Top-Level-Domain sichtbar. Die Domain heisst `surfaces` und beschreibt Windows, SidePanels und Overlay Surfaces deklarativ, ohne eine produktive `xtend.surface` Runtime in den RMT Kernel zu ziehen.

Der Contract ist ein Handoff: RMT darf `surfaces[*]` parsen, normalisieren, serialisieren, indexieren und referenzieren. Das Oeffnen, Schliessen, Fokussieren, Verschieben, Resizen, Docken, Snapshotting, xstate Mirroring, Fabric Diagnostics und DOM-Materialisieren bleiben Adapter- und Komponentenarbeit.

## Native Domain Shape

```json
{
  "surfaces": [
    {
      "id": "surface.inspector",
      "schema": "xtend.surface.record.v1",
      "type": "window",
      "adapter": "xtend.surface",
      "manager": "workbench.manager",
      "component": "workbench.inspector",
      "route": "workbench",
      "schedule": "surface.user-blocking.open",
      "stateKey": "xtend.surface.inspector.state"
    }
  ]
}
```

Pflichtfelder sind `id`, `type`, `manager` und `component`. Der Adapter-Record `xtend.surface` ist als `surface_adapter` modelliert und bleibt `kernelVisible: false`.

## Referenzen

- `surfaces[*].adapter -> adapters[*].id`
- `surfaces[*].manager -> components[*].id`
- `surfaces[*].component -> components[*].id`
- `surfaces[*].route -> routes[*].id`
- `surfaces[*].schedule -> schedules[*].id|endpointName`

Die referenzierte `manager` Komponente ist weiter ein normales `x-surface-manager` Component Record. Dadurch bleibt TreeShaking ueber `xtend.component` und Manifest-Lookup erhalten.

## Adapter Handoff

`xtend.surface.adapter.v1` konsumiert:

- `surfaces[*]`
- `components[*]`
- `routes[*]`
- `schedules[*]`
- `components[*].metadata.surface` als Migrationsquelle
- `xtend.surface.controller.v1`
- `xtend.surface.snapshot.v1`

Operationen:

- `registerSurface`
- `openSurface`
- `closeSurface`
- `focusSurface`
- `moveSurface`
- `resizeSurface`
- `dockSurface`
- `undockSurface`
- `snapshotSurfaces`
- `emitDiagnostic`

`runtimeImplemented: false` ist Teil des Contracts. WP-SM-08 behauptet nur Schema, Typen, Normalisierung, Semantic Graph, Completion Provider und Linter-Faehigkeit.

## Compatibility

`components[*].metadata.surface` bleibt gueltig. Die Fixture `tests/fixtures/rmt-surface-native-domain.rmt` fuehrt bewusst Dual Records:

- native `surfaces[*]` als neues Zielbild
- bestehende Component Records mit `metadata.surface` als Kompatibilitaets- und Migrationsquelle

Beide Records muessen `id`, `type`, `manager` und `stateKey` stabil zusammenhalten. Die sichtbare Oberflaeche bleibt gegen `WP-SM-07` Quality Gates reproduzierbar.

## RMT Tooling

`xtendrmt/rmt.schema.json` enthaelt:

- Top-Level-Property `surfaces`
- `#/$defs/surface`, `#/$defs/surfaces`, `#/$defs/surfaceType`, `#/$defs/surfaceBounds`
- `x-xtendrmt.nativeDomainContracts` mit `xtend.rmt.surfaces-domain.v1`
- `x-xtendrmt.surfaceAdapterContracts` mit `xtend.surface.adapter.v1`

`xtendrmt/rmt-core.d.ts` enthaelt `RmtSurfaceDomainRecord`, `RmtSurfaceType`, `RmtSurfaceBounds`, `RmtSurfaceA11y`, `surfaces?: RmtSurfaceDomainRecord[]` und den Adapterkind `surface_adapter`.

`createRmtFormat().normalizeDocument()` erhaelt native Surface Records, `serializeDocument()` schreibt sie wieder aus, und `tools/rmt-language/semantic-graph.js` indexiert sie fuer Definitionen, Referenzen und Completions.

## Kernel Boundary

`no-rmt-kernel-import-of-xtend-types`

RMT owns surface intent, component refs, routes, schedules and metadata only. XTend surface execution, xstate access, Fabric execution and DOM materialization stay in host adapters.

## Gate

```bash
node scripts/run_xtend_tests.js surface-native-rmt --json
```

