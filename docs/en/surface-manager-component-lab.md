# SurfaceManager Component Lab

- Contract: `xtend.surface.component-lab-fixture.v1`
- Release contract: `xtend.surface.release-handoff.v1`
- Fixture: `tests/fixtures/rmt-surface-manager-component-lab.rmt`
- Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`

## Purpose

The SurfaceManager Component Lab is the static lab fixture for the SurfaceManager line. It shows how an app shell is described with `x-surface-manager`, `x-surface-window`, `x-side-panel`, a compatible dialog and native `surfaces[*]` records.

The fixture is not a new lab server. It extends the existing Component Lab idea with a surface-specific authoring and migration view.

## Panels

| Panel | Task |
|-------|------|
| `surface-preview` | check the visible surface shell with WindowManager and SidePanel components |
| `native-rmt-inspector` | inspect `surfaces[*]`, `adapters`, `components`, `routes` and `schedules` |
| `migration-diff` | compare `components[*].metadata.surface` with native surface records |
| `quality-gates` | make the gate chain from `surface-manager-quality` to `surface-native-rmt` visible |
| `source-links` | link docs, catalog, fixture, runtime and suite paths |

## Fixture Model

`tests/fixtures/rmt-surface-manager-component-lab.rmt` contains:

- four adapters: `xtend.component`, `xtend.xrouter`, `rmt.state-scheduler-diagnostics`, `xtend.surface`
- one SurfaceManager component `surface.lab.manager`
- two windows: `surface.lab.preview` and `surface.lab.rmtInspector`
- two side panels: `surface.lab.migrationPanel` and `surface.lab.qualityPanel`
- one dialog: `surface.lab.commandDialog`
- native `surfaces[*]` records plus matching `components[*].metadata.surface` dual records

The fixture checks the authoring boundary. It does not claim a productive `xtend.surface` runtime.

## Local Flow

```bash
node scripts/run_xtend_tests.js surface-release-handoff --json
```

The gate validates the fixture through RMT normalization and semantic graph. Surface IDs, component refs, manager refs, routes and schedules therefore remain visible and machine-checkable.
