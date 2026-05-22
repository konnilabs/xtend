# XTend Component Platform

Contract: `xtend.docs.component-platform.v1`

This page describes the current Epic 10 state for new XTend components. New
components are planned TypeScript-first, shipped locally as ESM artifacts, and
prepared as RMT-first authoring targets. RMT remains framework-agnostic: XTend
components are `xtend.component` records, but the RMT kernel imports no XTend
classes or types.

Since `WP-E10-16`, Epic 10 is complete. The release handoff is documented in
[Epic 10 Release Handoff](./epic10-release-handoff.md), and complete app
authoring rules live in [RMT-first XTend Apps](./rmt-first-xtend-apps.md).
Since `WP-E11-17`, the visible UX rules have been consolidated in
[Component UX Authoring](./component-ux-authoring.md),
[Component UX App Authoring](./component-ux-app-authoring.md),
[Component UX Gates](./component-ux-gates.md), and
[Component Long-Tail Migration](./component-long-tail-migration.md).

## Platform Layers

- TypeScript source lives under `src/components/<tag>/`
- Runtime artifacts remain local ESM files under `components/`
- Public types remain `.d.ts` artifacts under `components/`
- RMT metadata exists as a separate `ts-rmt` artifact
- Fabric, telemetry, lanes, a11y, and performance are required domains in
  `xtend.component.contract.v2`
- The builder creates contract, source, RMT, a11y, performance, and fixture
  artifacts as a dry run

## RMT vNext Component Capability Registry

The current RMT vNext line extends this platform with
`xtend.rmt.component-capability-registry.v1`. The registry is the generic RMT
interface for XTend UI: it reads `components/manifest.json`,
`xtend.component.contract.v2`, `xtendRmtMetadata`, `observedAttributes`,
events, slots, parts, form association, accessibility profiles, and performance
profiles.

The result is one matrix for all 42 public manifest entries and 38 renderable UI
components. RMT can build DOM descriptors from it, bind events and state
bridges, and lazy import components through manifest paths. The RMT kernel stays
framework-neutral and imports no XTend classes or types.

See [RMT vNext Component Primitives and XTend UI](./rmt-vnext-component-primitives.md).

## P0 Component Wave

WP-E10-08 defines the first P0 component wave as
`xtend.epic10.p0-component-wave.v1`.

| Component | Package | Focus |
|-----------|---------|-------|
| `x-select` | `WP-E10-09` | select control, option slots, value events |
| `x-checkbox` | `WP-E10-09` | binary input, checked/indeterminate state |
| `x-radio` | `WP-E10-09` | radio group coordination and keyboard navigation |
| `x-textarea` | `WP-E10-10` | long-form input, validation, counter |
| `x-status` | `WP-E10-10` | live region, validation feedback, scheduler status |
| `x-progress` | `WP-E10-10` | async progress, hydration/task feedback |
| `x-tooltip` | `WP-E10-11` | lightweight overlay help and describedby mapping |
| `x-popover` | `WP-E10-11` | interactive anchored overlay |
| `x-drawer` | `WP-E10-11` | app shell navigation and side panels |

`x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-status`, `x-progress`,
`x-tooltip`, `x-popover`, and `x-drawer` are implemented as the TypeScript-first
reference line and form the first P0 wave with `enterprise-ready` catalog
status.

## Component Lab and RMT Inspector

`WP-E10-12` introduces the Component Lab as a shell-first RMT pilot. The lab
uses `tests/fixtures/rmt-component-lab-pilot.rmt` and the plan module
`xtend-builder/preview/component-lab.js` to make all nine `enterprise-ready`
components locally inspectable.

The pilot surface contains:

- component preview for fixture, docs, types, and contract paths
- RMT Inspector for `manifest`, `adapters`, `components`, `routes`,
  `schedules`, `templates`, and `diagnostics`
- telemetry panel for `snapshot.componentTelemetry`
- a11y and performance notes from Component Contract v2
- source links to runtime, TS source, RMT metadata, fixture, docs, and suite

The local gate is:

```bash
node scripts/run_xtend_tests.js component-lab-rmt-inspector --json
```

## RMT-First Demo App

`WP-E10-13` provides the first productive RMT-first demo app without a manual
shell through `xtendrmt-rmt-first-demo.html` and
`xtendrmt/rmt-first-demo-app.rmt`. The host page provides only a
`data-rmt-host="rmt-first-demo"` root, the local XTend Loader, the local
manifest, and the RMT runtime.

The app shell, navigation, routes, page templates, component records,
schedules, Fabric lanes, and diagnostics are rendered from the RMT document.
The demo uses the full Epic 10 P0 wave: `x-select`, `x-checkbox`, `x-radio`,
`x-textarea`, `x-status`, `x-progress`, `x-tooltip`, `x-popover`, and
`x-drawer`.

The local gate is:

```bash
node scripts/run_xtend_tests.js rmt-first-demo-app --json
```

## Existing Component Metadata

`WP-E10-14` brings existing prioritized components into the RMT/Fabric line as
a `js-legacy` contract overlay. The machine-readable catalog lives in
`catalog/epic10-existing-component-metadata.js` and uses the migration strategy
`js-legacy-contract-overlay-no-runtime-rewrite`.

The target components are `x-router`, `x-link`, `x-input`, `x-form`, `x-modal`,
`x-dialog`, `x-tabs`, `x-toast`, and `x-alert`. Each component receives
Contract v2, RMT, Fabric, telemetry, lane, a11y, and performance metadata
without requiring this package to rewrite the runtime.

The local gate is:

```bash
node scripts/run_xtend_tests.js existing-component-metadata --json
```

## Epic 10 Platform Gates

`WP-E10-15` bundles the platform rules as `xtend.epic10.platform-gates.v1`.
The machine-readable plan lives in `catalog/epic10-platform-gates.js` and
connects Component Contract v2, Existing Component Metadata, the RMT-first demo
app, browser smokes, a11y, performance, and visual regression.

The fast PR path contains `component-contract-v2`, `epic10-p0-component-wave`,
`component-lab-rmt-inspector`, `rmt-first-demo-app`,
`existing-component-metadata`, `browser`, `a11y-hydration`,
`screenreader-signals`, `motion-contrast`, `regression-priority`, and
`references`. Release-only performance stays separate through
`fabric-performance-measurements`, `performance-regression`, and
`hydration-policy`.

The local gate is:

```bash
node scripts/run_xtend_tests.js epic10-platform-gates --json
```

## Epic 10 Release Handoff

`WP-E10-16` finalizes the canonical guide structure and the completion contract
`xtend.epic10.release-handoff.v1`. The machine-readable plan lives in
`catalog/epic10-release-handoff.js`.

The canonical Component/Fabric boundary is
`adapter-injection-via-xtend-component-resolveFabricContext`.
`window.XTendFabric` remains a host convenience and enterprise integration
surface, but components receive Fabric, lane, and fiber context through the
`xtend.component` adapter.

The local gate is:

```bash
node scripts/run_xtend_tests.js epic10-release-handoff --json
```

## Epic 11 Enterprise UX Handoff

`WP-E11-18` finalizes visible Component UX maturity as
`xtend.epic11.enterprise-ux-handoff.v1`. The machine-readable plan lives in
`catalog/epic11-enterprise-ux-handoff.js`.

The completion mode is `completed-with-accepted-long-tail-handoff`: shell,
styling, runtime a11y, performance, component network, RMT shell authoring,
component lab, browser smokes, theme matrix, and authoring guides are accepted
as a product line. After `WP-E12-09`, `x-tabs`, `x-theme`, `x-button`, and
`x-menu` are runtime-closed; `xstate` has suite, fixture, types, and adapter
boundary probe; `x-utils` has utility contract, import policy, fixture, and
types. Since `WP-E13-05`, `xstate` is closed as a runtime boundary and
`x-utils` as a utility boundary for RC1.

The local gate is:

```bash
node scripts/run_xtend_tests.js epic11-enterprise-ux-handoff --json
```

## RMT First-Class Support

Every new component must be authorable as an RMT component record:

- Adapter: `xtend.component`
- Template mode: `dom_descriptor`
- Event binding: `dom-event-to-rmt-command`
- Required schedules: `component.visible.mount`, hydration schedule, and
  `diagnostics.snapshot`
- Kernel boundary: `no-rmt-kernel-import-of-xtend-types`

RMT therefore describes the component, props, attributes, slots, events,
hydration, and schedule. XTend executes the Custom Elements locally.

## Fabric, Telemetry, and Lanes

New components must be able to receive Fabric context. This includes:

- `@xtend-fabric` boundary
- lifecycle operations `mount`, `hydrate`, `render`, `update`, `event`,
  `error`, `unmount`
- telemetry snapshot `xtend.fabric.telemetry-snapshot.v1`
- backpressure-capable measurement points
- deterministic lane precedence from RMT, component metadata, Fabric override,
  and blueprint default

## A11y and Performance

A11y is not a downstream test. Form controls need labels, error regions,
keyboard behavior, and screen reader signals. Feedback components need live
regions and non-color status signals. Overlays need Escape, focus return, and
reduced motion.

Performance is also part of the contract. Every component must declare budget
class, lane, hydration policy, and critical measurement points.

## Local Gates

```bash
node scripts/run_xtend_tests.js component-ux-authoring-docs --json
node scripts/run_xtend_tests.js rmt-vnext-component-primitives --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
node scripts/run_xtend_tests.js epic11-enterprise-ux-handoff --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
node scripts/run_xtend_tests.js epic10-p0-component-wave --json
node scripts/run_xtend_tests.js component-lab-rmt-inspector --json
node scripts/run_xtend_tests.js rmt-first-demo-app --json
node scripts/run_xtend_tests.js existing-component-metadata --json
node scripts/run_xtend_tests.js epic10-platform-gates --json
node scripts/run_xtend_tests.js epic10-release-handoff --json
node scripts/run_xtend_tests.js builder-typescript-blueprint --json
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js references --json
```
