# SurfaceManager Authoring Guide

- Contract: `xtend.surface.release-handoff.v1`
- Workpackage: `WP-SM-09`
- Fixture: `tests/fixtures/rmt-surface-manager-component-lab.rmt`
- Local gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`

## Goal

This guide describes the recommended authoring path for XTend app shells with SurfaceManager. It connects the early component-metadata path from `WP-SM-01` with the native RMT `surfaces` domain from `WP-SM-08`.

## Authoring Modes

| Mode | When to use | Source |
|------|-------------|--------|
| `component-metadata-mvp` | small shells, existing component records, fast migration | `components[*].metadata.surface` |
| `dual-record-handoff` | transition, tooling comparison, regression against existing runtime | `components[*].metadata.surface` plus `surfaces[*]` |
| `native-surfaces-preferred` | complex app shells, multi-window, panels, overlay stack | `surfaces[*]` as domain surface source |

## Component Metadata Remains Valid

Existing RMT component records remain compatible:

```json
{
  "id": "workbench.inspector",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-surface-window",
  "schedule": "surface.user-blocking.open",
  "metadata": {
    "surface": {
      "schema": "xtend.surface.record.v1",
      "id": "surface.inspector",
      "type": "window",
      "manager": "workbench.manager",
      "stateKey": "xtend.surface.inspector.state"
    }
  }
}
```

This mode is enough when an app shell already runs correctly through `x-surface-manager` and does not need the native RMT surface domain for tooling, migration or cross-record validation.

## Prefer Native Surfaces

For new complex shells, `surfaces[*]` is the target state:

```json
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
```

Authoring rules:

- `manager` references the `x-surface-manager` component record.
- `component` references the visible surface component.
- `route` binds the surface to the app-shell context.
- `schedule` binds open, layout, persistence or diagnostics to RMT scheduling.
- `stateKey` remains stable between component metadata and native domain.
- Historically, `xtend.surface` stayed an adapter handoff until `WP-SM-19`; since the runtime handoff, the productive adapter claim is gateable while the visible UI continues to materialize through the SurfaceManager component family.

## Release Handoff

After `WP-SM-09`, the historical authoring handoff stated:

- component metadata is the stable compatibility path.
- native `surfaces[*]` is the preferred authoring path for new app shells.
- dual records are the safe migration mode.
- the RMT kernel remains host-neutral.
- the productive `xtend.surface` adapter runtime was follow-up work and has been implemented since `WP-SM-19`.

## WP-SM-19 Runtime Authoring

As of `WP-SM-19`, the productive `xtend.surface` adapter runtime is implemented and gateable through `xtend.surface.runtime-release-handoff.v1`. For new complex app shells, `native-surfaces-preferred` remains the default: `surfaces[*]` describes domain surfaces, while component records provide the visible XTend UI bindings.

Productive authoring rules:

- `surfaces[*]` is the source for new multi-surface app shells.
- `components[*].metadata.surface` remains compatible for existing shells and dual-record migrations.
- `x-surface-manager` and the SurfaceController remain the runtime registry.
- Fabric, XRouter, `xstate` and the RMT kernel remain independent layers.
- `node scripts/run_xtend_tests.js surface-runtime-release-handoff --json` checks the final runtime handoff.

Details are in [SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md).
