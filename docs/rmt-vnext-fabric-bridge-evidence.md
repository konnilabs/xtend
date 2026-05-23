# RMT vNext Fabric Bridge Evidence

- Contract: `xtend.rmt.vnext.fabric-bridge-evidence.v1`
- Workpackage: `RMT-VNEXT-PRIM-05`
- Status: `completed`
- Quelle: Media-Manager-Downstream-Transfer, `2026-05-19`

## Ziel

`RMT-VNEXT-PRIM-05` beweist, dass vNext-authorierte Primitives den Fabric-
Runtime-Raum erreichen, ohne Fabric- oder XTend-Host-Imports in den RMT-Kernel
zu ziehen.

Das Gate ist absichtlich als eigene Scheibe neben dem Source-to-Sea-Gate
verfuegbar. Source-to-Sea prueft den gesamten Objekt-Lifecycle bis Browser;
dieses Gate prueft die Fabric-Bruecke selbst:

```text
vNext source
  -> PRIM-04 kernel schedule/fiber
  -> Fabric/RMT lane mapping
  -> xtend.fabric.fiber.v1
  -> xtend.fabric.telemetry-snapshot.v1
  -> host adapter telemetry
  -> route/component fiber instrumentation
  -> browser-visible Fabric markers
```

## Evidence

Die Evidence wird von `createRmtVNextFabricBridgeEvidence(...)` erzeugt und
ueber `createRmtVNextSourceToSeaEvidence(...)` in den Fullstack-Report
eingebettet.

Der PRIM-05-Contract umfasst:

- `xtend.fabric.rmt-lane-mapping.v1` fuer die Uebersetzung von RMT-Lanes in
  Fabric-Schedules;
- eine primaere `xtend.fabric.fiber.v1` aus dem PRIM-04 Kernel-Fiber;
- eine Lane-Matrix fuer `user-blocking`, `transition`, `idle`, `background`
  und `diagnostics`;
- `xtend.component.lifecycle-telemetry.v1` aus dem XTend Component Host-
  Adapter;
- `component.mount`, `component.hydrate`, `route.navigate` und `route.render`
  aus den produktiven Fabric-Fiber-Instrumentations;
- einen `xtend.fabric.telemetry-snapshot.v1`, der alle erwarteten Schedule Refs
  enthaelt;
- Browser-Marker fuer Fabric Lane, Fabric Fiber, Fabric Schedule und Host-
  Adapter-Telemetrie.

## Gate-Regeln

Das Gate schlaegt fehl, wenn:

- die Fabric/RMT-Lane-Aufloesung kein Mapping liefert;
- die primaere Fabric-Fiber nicht abgeschlossen ist;
- Kernel-Schedule, Kernel-Fiber und Source-Pointer nicht in Fiber-Metadaten
  erhalten bleiben;
- eine der Matrix-Lanes fehlt oder keinen Telemetry-Schedule schreibt;
- Host-Adapter-Telemetrie nicht im Fabric-Snapshot erscheint;
- Route- oder Component-Fiber nicht aus den produktiven Instrumentations
  stammen;
- Browser-Marker fuer Lane, Fiber, Schedule oder Host-Telemetrie fehlen;
- der RMT-Kernel Host- oder Fabric-Imports enthaelt.

## Lokale Gates

```bash
node --check tools/rmt-language/vnext-source-to-sea.js
node --check tests/rmt-language/rmt_vnext_fabric_bridge_suite.js
node scripts/run_xtend_tests.js rmt-vnext-fabric-bridge --json
node scripts/run_xtend_tests.js rmt-vnext-source-to-sea --json
npm run test:rmt-vnext-primitives:report
```

## Handoff

`RMT-VNEXT-PRIM-05` ist abgeschlossen, sobald dieses Gate gruen ist.
`RMT-VNEXT-PRIM-06` fuehrt Source-to-Sea als optionale Browser-Evidence weiter:
Browser-Execution kann lokal oder per manuellem CI-Dispatch laufen und die
Browser-Execution-Evidence als Release-Artefakt schreiben.
