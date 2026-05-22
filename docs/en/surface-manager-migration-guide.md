# SurfaceManager Migration Guide

- Contract: `xtend.surface.release-handoff.v1`
- Native Domain: `xtend.rmt.surfaces-domain.v1`
- Adapter Handoff: `xtend.surface.adapter.v1`
- Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`

## Goal

This guide describes the additive migration from surface metadata in component records to native RMT surface records. The migration intentionally avoids a big bang: existing `components[*].metadata.surface` records remain valid while new app shells are authored in RMT vNext. `surfaces[*]` is the runtime and compatibility output, not the new manual authoring surface.

## Migration Steps

| Step | Result |
|------|--------|
| `inventory-component-metadata-surfaces` | capture all existing `metadata.surface` records and state keys |
| `stabilize-surface-ids-and-state-keys` | freeze IDs, `type`, `manager` and `stateKey` |
| `add-native-surfaces-records` | add parallel `surfaces[*]` records with the same identity |
| `keep-dual-records-during-handoff` | compare component metadata and native records in the gate |
| `switch-authoring-default-to-vnext-surfaces` | write new complex shells as `surface ... component ...` in RMT vNext |
| `close-xtend-surface-runtime-after-adapter-implementation` | close the historical adapter handoff from `WP-SM-09` through `WP-SM-19` runtime gates |

## vNext Target Shape

```rmt
template workbench.surfaceMigration {
  state workbench.properties type object initial null

  portal surface.root root "#workbench-root" layer surface

  surface surface.properties kind side-panel component x-side-panel {
    source state workbench.properties
    portal surface.root

    lane visible weight 70 {
      hydrate properties-panel from state workbench.properties
    }
  }
}
```

## Before: Legacy Component Metadata

```json
{
  "id": "workbench.properties",
  "tag": "x-side-panel",
  "metadata": {
    "surface": {
      "schema": "xtend.surface.record.v1",
      "id": "surface.properties",
      "type": "side-panel",
      "manager": "workbench.manager",
      "stateKey": "xtend.surface.properties.state"
    }
  }
}
```

## After: Dual Record as Runtime Output

```json
{
  "surfaces": [
    {
      "id": "surface.properties",
      "schema": "xtend.surface.record.v1",
      "type": "side-panel",
      "adapter": "xtend.surface",
      "manager": "workbench.manager",
      "component": "workbench.properties",
      "route": "workbench",
      "schedule": "surface.visible.render",
      "stateKey": "xtend.surface.properties.state"
    }
  ]
}
```

During the handoff, the component metadata remains in the component record and can optionally point to the native record with `nativeRecord`. New examples should show the vNext target shape; dual records serve as migration evidence.

## Review Checklist

- Every native surface has a stable `id`.
- `component` points to exactly one component record.
- `manager` points to the `x-surface-manager` record.
- `route` and `schedule` resolve to native RMT records.
- `stateKey` is identical between `components[*].metadata.surface` and `surfaces[*]`.
- `xtend.surface` is declared as `surface_adapter` and has been promoted for production through the runtime gates since `WP-SM-19`.
- The gates `surface-native-rmt`, `surface-release-handoff` and `surface-runtime-release-handoff` are green.

Details for the generic RMT migration are in [XTendRMT Native Migration Guide](./xtendrmt-migration-guide.md). Surface authoring details are in [SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md).

## WP-SM-19 Runtime Migration Notes

`WP-SM-19` accepts `xtend.surface.runtime-migration-notes.v1` as the final migration line for the production Surface Runtime.

Extended gate order for migrations:

```bash
node scripts/run_xtend_tests.js surface-adapter-runtime --json
node scripts/run_xtend_tests.js surface-native-materialization --json
node scripts/run_xtend_tests.js surface-persistence --json
node scripts/run_xtend_tests.js surface-lazy-hydration --json
node scripts/run_xtend_tests.js surface-route-lifecycle --json
node scripts/run_xtend_tests.js surface-stack-policy --json
node scripts/run_xtend_tests.js surface-layout-engines --json
node scripts/run_xtend_tests.js surface-remote-policy --json
node scripts/run_xtend_tests.js surface-browser-lab --json
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
```

Existing `components[*].metadata.surface` records remain allowed. The target state for new shells is still RMT vNext; `surfaces[*]` remains the verifiable output because tooling, materialization, persistence, routing, remote policy and browser-lab stability can be verified together there.
