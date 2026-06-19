# RMT Kernel Runtime

Die RMT Kernel Runtime ist der host-neutrale Kern von XTendRMT. Sie verarbeitet kompilierte RMT Records, plant Runtime-Arbeit und hält App-Logik von konkreten UI-Frameworks getrennt.

## Was diese Schicht ist

Der Kernel ist kein Renderer. Er ist die Schicht, die State, Selectors, Actions, Events, Resources, Surfaces und Scheduling-Absicht zusammenführt. Dadurch kann RMT als orchestrierender Scheduler in XTend Apps, MFE-Shells oder bestehenden React-, Vue- und VanillaJS-Anwendungen laufen.

## Was diese Schicht weiß

Der Kernel kennt RMT Core Records, Runtime-State, Selector-Ausgaben, Action- und Event-Verträge, Resource-Lebenszyklen, Surface-Records, Schedule-Refs, Lanes, Diagnostics und Host-Adapter-Fähigkeiten.

Er kennt außerdem Policy-, Panic-, Recovery- und Backpressure-Signale, soweit sie als Runtime-Daten oder Diagnostics vorliegen.

## Was sie nicht weiß

Der Kernel kennt keine konkreten DOM-Komponenten, kein CSS, keine Framework-Komponenten, keine React- oder Vue-Interna und keine App-spezifischen Security-Entscheidungen.

Er führt keine fremde Remote-UI aus. Remote Surfaces und Framework-Module werden über Adapter, Allowlists und Host-Policies angebunden.

## Schnittstellen

```js
import {
  createRmtRuntime,
  createRmtCore,
  createRmtProductSurface,
  createRmtBrowserRuntime,
  createRmtServerRuntime,
  createRmtWorkerRuntime,
  createRmtBrowserHostAdapter
} from '@ccslabs/xtend/rmt';

const hostAdapter = createRmtBrowserHostAdapter({
  windowTarget: window,
  documentTarget: document
});

const runtime = createRmtRuntime({ hostAdapter });
```

Die wichtigsten öffentlichen Einstiege sind `createRmtRuntime`, `createRmtCore`, `createRmtProductSurface`, `createRmtBrowserRuntime`, `createRmtServerRuntime`, `createRmtWorkerRuntime`, Host Adapter und Diagnostics Hub.

## Kommunikation mit anderen Schichten

Der Compiler liefert Core Records. Der Kernel verarbeitet sie und gibt Scheduling-, State- und Diagnostics-Signale an Fabric oder Host Adapter weiter.

Fabric liest Schedule Records und Lane-Absicht. UI Adapter übersetzen Surface- und Component-Records in konkrete DOM- oder Framework-Aufrufe. Diese Trennung macht den Kernel als Scheduler in gemischten App-Landschaften nutzbar.

## Nächste Schritte

- [RMT Kernel Topography Map](./rmt-kernel-topography-map.md)
- [RMT Kernel Feature Adoption Evaluation](./rmt-kernel-feature-adoption-evaluation.md)
- [RMT Stack-Topographie](./rmt-stack-topography.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)
- [RMT State Selector Runtime](./rmt-state-selector-runtime.md)
