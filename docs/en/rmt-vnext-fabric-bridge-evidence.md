# RMT vNext Fabric Bridge Evidence

- Contract: `xtend.rmt.vnext.fabric-bridge-evidence.v1`
- Workpackage: `RMT-VNEXT-PRIM-05`
- Status: `completed`
- Source: Media Manager downstream transfer, `2026-05-19`

## Goal

`RMT-VNEXT-PRIM-05` proves that vNext-authored primitives reach the Fabric runtime space without pulling Fabric or XTend host imports into the RMT kernel.

The gate is intentionally available as its own slice beside the source-to-sea gate. Source-to-sea checks the full object lifecycle into the browser; this gate checks the Fabric bridge itself:

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

The evidence is created by `createRmtVNextFabricBridgeEvidence(...)` and embedded into the fullstack report through `createRmtVNextSourceToSeaEvidence(...)`.

The PRIM-05 contract includes:

- `xtend.fabric.rmt-lane-mapping.v1` for translating RMT lanes into Fabric schedules;
- a primary `xtend.fabric.fiber.v1` from the PRIM-04 kernel fiber;
- a lane matrix for `user-blocking`, `transition`, `idle`, `background` and `diagnostics`;
- `xtend.component.lifecycle-telemetry.v1` from the XTend component host adapter;
- `component.mount`, `component.hydrate`, `route.navigate` and `route.render` from the productive Fabric fiber instrumentations;
- an `xtend.fabric.telemetry-snapshot.v1` that contains all expected schedule refs;
- browser markers for Fabric lane, Fabric fiber, Fabric schedule and host-adapter telemetry.

## Gate Rules

The gate fails when:

- the Fabric/RMT lane resolution provides no mapping;
- the primary Fabric fiber is not completed;
- kernel schedule, kernel fiber and source pointer are not preserved in fiber metadata;
- one of the matrix lanes is missing or writes no telemetry schedule;
- host-adapter telemetry does not appear in the Fabric snapshot;
- route or component fiber does not come from the productive instrumentations;
- browser markers for lane, fiber, schedule or host telemetry are missing;
- the RMT kernel contains host or Fabric imports.

## Local Gates

```bash
node --check tools/rmt-language/vnext-source-to-sea.js
node --check tests/rmt-language/rmt_vnext_fabric_bridge_suite.js
node scripts/run_xtend_tests.js rmt-vnext-fabric-bridge --json
node scripts/run_xtend_tests.js rmt-vnext-source-to-sea --json
npm run test:rmt-vnext-primitives:report
```

## Handoff

`RMT-VNEXT-PRIM-05` is complete once this gate is green together with the source-to-sea gate. The remaining expansion then sits in `RMT-VNEXT-PRIM-06`: make browser execution mandatory in a CI environment and write the browser execution evidence as a release artifact.
