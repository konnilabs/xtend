# XTend Fabric Runtime

XTend Fabric ist die Koordinationsschicht für Runtime-Arbeit. Sie ordnet RMT Scheduling-Absicht in Lanes und Fibers ein, trifft Hydration-Entscheidungen und stellt Telemetrie sowie Diagnostics bereit.

## Was diese Schicht ist

Fabric ist die Brücke zwischen Kernel-Absicht und Host-Ausführung. Der Kernel beschreibt, welche Arbeit existiert; Fabric hilft dem Host zu entscheiden, wann und mit welcher Priorität diese Arbeit ausgeführt wird.

## Was diese Schicht weiß

Fabric kennt Fabric-Lanes, RMT-Lane-Mapping, Schedule Records, Fiber-Kontext, Hydration Policies, Backpressure, Completion-Signale, Diagnostics und Telemetrie-Snapshots.

Fabric kann erkennen, ob Arbeit sichtbar, idle, diagnostisch oder user-blocking ist. Dadurch kann die App Repaints, Reflows und unnötige Hydration-Arbeit besser kontrollieren.

## Was sie nicht weiß

Fabric parst kein RMT, rendert keine UI, besitzt keine Framework-Komponenten und führt keine Geschäftslogik aus.

Fabric entscheidet nicht, ob eine React-, Vue- oder XTend-Komponente fachlich korrekt ist. Es bewertet nur Runtime-Absicht, Priorität, Hydration und Diagnoseinformationen.

## Schnittstellen

```js
import { createXtendFabric } from '@ccslabs/xtend/fabric';
import { resolveRmtScheduleForFiber } from '@ccslabs/xtend/fabric/rmt-lane-mapping';

const fabric = createXtendFabric();
const schedule = resolveRmtScheduleForFiber({
  lane: 'visible',
  scheduleRef: 'component.visible.hydrate',
  kind: 'component.hydrate'
});
```

Die wichtigsten öffentlichen Einstiege sind `createXtendFabric`, Hydration Policy Helpers, RMT Lane Mapping, Diagnostics und Telemetrie-Snapshots.

## Kommunikation mit anderen Schichten

Der RMT Kernel liefert Schedule-Intent, Lane-Namen und Diagnostics. Fabric normalisiert diese Informationen und gibt Host Adaptern konkrete Ausführungs- und Hydration-Hinweise.

XTend UI und andere Framework-Adapter können Fabric-Kontext nutzen, um sichtbare Arbeit vor Idle-Arbeit zu priorisieren, Diagnostics zu sammeln und Component-Hydration nachvollziehbar zu machen.

## Nächste Schritte

- [XTend DEV API](./xtend-dev-api.md)
- [RMT Stack-Topographie](./rmt-stack-topography.md)
- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [XTend Fabric](./xtend-fabric.md)
- [Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)
