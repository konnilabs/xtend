# XTend Component Lab

Contract: `xtend.docs.component-lab.v1`

Starting with `WP-E10-12`, the Component Lab is the local preview and inspection path for TypeScript-first XTend components. It brings together Component Contract v2, RMT metadata, Fabric/Lane context, lifecycle telemetry, accessibility profiles and performance profiles in a shell-first RMT pilot.

## Pilot Artifacts

- Plan module: `xtend-builder/preview/component-lab.js`
- RMT fixture: `tests/fixtures/rmt-component-lab-pilot.rmt`
- Contract: `development/XTend-Component-Lab-und-RMT-Inspector-Pilot.md`
- Gate: `node scripts/run_xtend_tests.js component-lab-rmt-inspector --json`

## Preview Targets

The lab starts with the nine `enterprise-ready` components from Epic 10:

- `x-select`
- `x-checkbox`
- `x-radio`
- `x-textarea`
- `x-status`
- `x-progress`
- `x-tooltip`
- `x-popover`
- `x-drawer`

Each target entry points to runtime, TypeScript source, RMT metadata, contract, accessibility, performance, fixture data, browser fixture, docs, public types and component suite.

## RMT Inspector

In the pilot, the RMT Inspector exposes these domains:

- `manifest`
- `adapters`
- `components`
- `routes`
- `schedules`
- `templates`
- `diagnostics`

RMT remains host-neutral. The kernel imports no XTend classes and no XTend types. Execution, DOM materialization, XRouter registration and the Fabric runtime remain adapter responsibilities.

## Panels

| Panel | Purpose |
|-------|---------|
| `component-preview` | Show preview target, fixture and component contract |
| `rmt-inspector` | Inspect the RMT document, routes, schedules and templates |
| `telemetry` | Make component lifecycle records and Fabric snapshots visible |
| `a11y` | Show roles, keyboard behavior, screen-reader signals and required assertions |
| `performance` | Show budget class, lane, hydration policy and measurement points |
| `source-links` | Link runtime, TS, RMT, docs, types and suite paths |

## Local Gate

```bash
node scripts/run_xtend_tests.js component-lab-rmt-inspector --json
```

The gate validates the plan, the RMT fixture, the nine preview targets, all panels, inspector domains, package metadata, runner registration and reference paths.

## Epic 11 UX Inspector

Starting with `WP-E11-13`, the UX Inspector `xtend.epic11.component-lab-ux-inspector.v1` is available as an additional layer.

Artifacts:

- Plan module: `xtend-builder/preview/component-lab-ux-inspector.js`
- RMT fixture: `tests/fixtures/rmt-component-lab-ux-inspector.rmt`
- Contract: `development/XTend-Component-Lab-UX-Inspector.md`
- Gate: `node scripts/run_xtend_tests.js component-lab-ux-inspector --json`

The UX Inspector covers 31 `enterprise-ready` components from the five Epic 11 families:

- Form Controls
- Feedback and Status
- Navigation and Routing
- Overlay and Interaction
- Layout, Display and Media

The panels extend the earlier pilot with `ux-family-matrix`, `state`, `styling` and `component-network`. The inspector domains are `shell`, `style`, `a11y`, `performance`, `state`, `componentNetwork`, `rmtAuthoring`, `fabricTelemetry`, `diagnostics` and `sourceLinks`.

```bash
node scripts/run_xtend_tests.js component-lab-ux-inspector --json
```

This layer is also shell-first, local and host-neutral. RMT describes shell, routes, templates and schedules; XTend components run through adapters outside the kernel.

## SurfaceManager Component Lab

Starting with `WP-SM-09`, there is a Surface-specific lab fixture:

- Docs: [SurfaceManager Component Lab](./surface-manager-component-lab.md)
- Fixture: `tests/fixtures/rmt-surface-manager-component-lab.rmt`
- Contract: `xtend.surface.component-lab-fixture.v1`
- Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`

The panels `surface-preview`, `native-rmt-inspector`, `migration-diff`, `quality-gates` and `source-links` present the SurfaceManager line as an app-shell lab: native `surfaces[*]`, compatible `components[*].metadata.surface` records, `x-surface-manager`, windows, side panels and the overlay bridge remain testable together without claiming a production `xtend.surface` runtime.

## Handoff

The lab is not a production browser lab server yet. It is the gateable pilot for `WP-E10-13`, where the RMT-first demo app is built without manual shell-specific logic.
