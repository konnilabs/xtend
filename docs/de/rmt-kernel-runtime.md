# RMT Kernel Runtime

XTend 0.8.0 trennt den hostneutralen Microkernel von den darauf aufbauenden Runtime-Services. `createRmtKernelScheduler()` besitzt die gemeinsame Scheduler-Queue; die RMT Runtime verarbeitet kompilierte Records über injizierte Model-, Surface- und Host-Ports.

## Was diese Schicht ist

Der Microkernel besitzt Priorisierung, Jobs, kooperative Fortsetzungen, Cancellation und Host-Dispatch. State, Selectors, Actions, Events, Resources und Surfaces gehören zu den komponierten Runtime-Services. Dadurch bleibt derselbe Scheduler in XTend Apps, MFE-Shells und React-, Vue- oder VanillaJS-Integrationen nutzbar.

## Was diese Schicht weiß

Die Runtime kennt RMT Core Records, Runtime-State, Selector-Ausgaben, Action- und Event-Verträge, Resource-Lebenszyklen und Surface-Records. Der Microkernel erhält daraus Work-Intents mit Scope, Lane, Priorität und Abort-Vertrag; er benötigt kein Wissen über DOM oder fachliche Modelle.

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

Der Compiler liefert Core Records. Der Orchestration Controller verbindet ihre Runtime-Services mit genau einer Scheduler-Instanz und den Host-Adaptern.

Fabric liefert Work-Intents, Backpressure und Telemetrie an diese Instanz und besitzt keine zweite Queue. UI Adapter übersetzen Surface- und Component-Records in DOM- oder Framework-Aufrufe. Product Surface und Prewarm Worker bleiben explizite Opt-ins; ein ESM-Import bootet keine Runtime.

## Nächste Schritte

- [XTend DEV API](./xtend-dev-api.md)
- [RMT Kernel Topography Map](./rmt-kernel-topography-map.md)
- [RMT Kernel Feature Adoption Evaluation](./rmt-kernel-feature-adoption-evaluation.md)
- [RMT Stack-Topographie](./rmt-stack-topography.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)
- [RMT State Selector Runtime](./rmt-state-selector-runtime.md)

## Host-Warten in 0.8.0

Warten auf Paint, Idle oder `postTask` belegt keinen aktiven Ausführungsslot. Ein Host-Callback meldet den Job bereit; die gemeinsame Prioritätsauswahl entscheidet über die Ausführung. Kooperative Fortsetzungen setzen am bestehenden Zustand fort. Cancellation, Timeout und Dispose entfernen Host-Handles; `postTask` erhält auch das `AbortSignal`. Synchrones JavaScript bleibt kooperativ aufzuteilen.

Siehe [0.8-Migration](./rmt-kernel-0-8-migration.md) für `RmtJobHandle`, die sechs öffentlichen Lanes und entfernte Queue-Bypässe; [FastPass](./maraca-fastpass-abort-boundary.md) ergänzt darauf dringende Shell-Aktionen.
