# XTendRMT Native Authoring Guide

- Status: productive after Epic 05 completion, updated vNext-first
- Contract: `xtend.rmt.native-authoring-guide.v1`
- Minimum gates:
  - `node scripts/run_xtend_tests.js rmt-compatibility --json`
  - `node scripts/run_xtend_tests.js browser --json`
  - `node scripts/run_xtend_tests.js references --json`

## Purpose

This guide describes the productive authoring model for native `.rmt` documents
with XTend UI and XRouter. The recommended path for new apps is RMT vNext: app
shell, surfaces, routes, state, events, hydration, and Fabric lanes live in a
readable RMT source. Legacy and App-DSL JSON remain compatibility layer,
runtime registry, and compiler target, but they are not the normal authoring
path.

`.rmt` is the canonical file type. Servers should serve it as
`application/vnd.xtendrmt.rmt+json` or compatibly as text; the runtime loader
reads RMT documents as text and parses them through
`createRmtFormat().parseDocument(...)`. JSON extensions are intended only for
edge-case hosts without native MIME support.

For a compact product overview, see
[XTendRMT Developer Overview](./xtendrmt-overview.md). The reference-style DSL
description lives in [XTendRMT App DSL Reference](./xtendrmt-app-dsl.md);
runtime factories and bridge wiring live in
[XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md).

The product boundary remains:

- XTend UI is the UI builder and Web Component product.
- XTendRMT is the scheduler, runtime kernel, and templating engine.
- XRouter is the first productive router adapter.
- XTend Components are first-class RMT components through `xtend.component`.
- Non-XTend hosts remain equal through their own adapters.
- The RMT kernel imports no XTend, XRouter, DOM, or browser types.

Starting with `WP-E13-09`,
[RMT Production Readiness](./rmt-production-readiness.md) is the RC1 boundary
for this path. The contract `xtend.epic13.rmt-production-readiness.v1` is
checked locally through
`node scripts/run_xtend_tests.js epic13-rmt-production-readiness --json` and
bundles the existing RMT, component, Fabric, and telemetry gates.

Starting with Epic 14, the native authoring path is tool-supported as well:

- [RMT Linter and AI-Agent Repair Report](./rmt-linter.md) describes
  `xt rmt lint`, JSON reports, `--fail-on`, and `--agent`.
- [RMT Language Server and Editor Setup](./rmt-language-server.md) describes
  LSP, snippets, and editor integration for VS Code, JetBrains, Neovim, and
  Helix.
- `node scripts/run_xtend_tests.js rmt-language-regression --json` checks
  valid, broken, legacy, and larger RMT documents across parser, linter, CLI,
  LSP, and agent report.

## Minimal vNext Structure

New app shells start with a vNext source:

```rmt
template settings.app {
  state settings.tab type string initial "profile"

  selector settings.view from state settings.tab {
    output SettingsView
  }

  action settings.save {
    input tab string
    reduce state.settings.tab = input.tab
    emit settings.saved with action settings.save
  }

  portal surface.root root "#app-root" layer surface

  surface settings.card kind page component x-card {
    source selector settings.view
    portal surface.root

    lane visible weight 80 {
      mount x-card
      hydrate settings-card from selector settings.view
    }

    on submit target settings-form -> action settings.save {
      payload tab from target.dataset.tab
    }
  }
}
```

The compiler creates core and kernel records for `adapters`, `components`,
`routes`, `schedules`, `surfaces`, and `templates`. These records are runtime
registry and mirror; app authors work in vNext.

## Adapter and Host Boundary

Adapters describe host capabilities. They are data in the RMT document, not
kernel imports. The current product path knows these stable adapter IDs:

- `xtend.xrouter` for native XRouter routes.
- `xtend.component` for XTend Custom Elements.
- `xtend.surface` for SurfaceManager, SidePanel, and overlay handoffs.
- `rmt.state-scheduler-diagnostics` for adapter results, scheduler endpoints,
  and diagnostics.
- `vanilla.component` as an example for a non-XTend component host.

`kernelVisible: false` remains the default for host-specific adapter data. The
kernel may normalize, index, and schedule records, but it must not load host
runtime.

## Components, Routes, and Schedules in vNext

Components become visible through `surface ... component ...`. Route and
schedule information stays declarative in the RMT source and is executed by the
host through adapters:

```rmt
template settings.routes {
  portal surface.root root "#app-root" layer surface

  surface settings.page kind page component x-section {
    portal surface.root

    lane visible weight 80 {
      hydrate settings-shell from endpoint xtendrmt.route.render
      hydrate settings-form from endpoint xtendrmt.component.hydrate
    }

    lane idle weight 20 {
      hydrate settings-help from endpoint xtendrmt.component.hydrate
    }
  }
}
```

The normalizer turns this into runtime registry entries consumed by adapters
through `componentRegistry.byAdapter["xtend.component"]`,
`componentRegistry.byTag[...]`, and route/schedule indexes. XRouter mapping,
`registerRoutes`, Custom Element registration, DOM creation, and hydration
remain host work.

## Surfaces and Templates

Complex app shells are described in vNext as surfaces and portals:

```rmt
template workbench.app {
  state workbench.selection type object initial null

  portal surface.root root "#workbench-root" layer surface

  surface workbench.manager kind workspace component x-surface-manager {
    portal surface.root

    lane visible weight 90 {
      hydrate surface-manager from endpoint xtendrmt.component.mount
    }
  }

  surface workbench.inspector kind window component x-surface-window {
    source state workbench.selection
    portal surface.root

    lane user-blocking weight 95 {
      hydrate inspector-window from state workbench.selection
    }
  }
}
```

Lowering can still create `dom_descriptor` template records and native
`surfaces` records from this. `html_fragment` remains compatible, but it is
DOM-untrusted and requires `xtend.security.sanitizing-boundary.v1`. The kernel
does not sanitize HTML; host adapters own the Trusted DOM sink. See
[Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md).

The completed surface authoring path lives in
[SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md)
(`docs/surface-manager-authoring-guide.md`).

## Runtime Wiring

The productive browser/ESM path remains stable:

1. `createRmtFormat().normalizeDocument(document)`
2. `createRmtFormat().createRuntimeRegistries(normalizedDocument)`
3. `createRmtXRouterAdapter(...).registerRoutes(registry)`
4. `createRmtXtendComponentAdapter(...).mountComponent(...)` and
   `hydrateComponent(...)`

Adapter results can then be mirrored to `xstate`, scheduler, and diagnostics
hub through
`createRmtStateSchedulerDiagnosticsBridge(...).recordAdapterResult(...)`.

The stable factory names for adapter documentation and tooling remain
`createRmtXRouterAdapter`, `createRmtXtendComponentAdapter`, and
`createRmtStateSchedulerDiagnosticsBridge`. The default policies remain
`route.visible.render` for visible routing and `component.idle.hydrate` for
downstream component hydration.

## Authoring Tooling

Recommended local flow:

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
```

IDE integration starts the same language core through:

```bash
node tools/rmt-language-server/server.js
```

Important: linter, LSP, code actions, and agent report share the same
diagnostic core. Editor packages and AI agents should not implement their own
RMT rules.

New app shells can start from the snippet prefix `rmt-app`. Other prefixes are
`rmt-component`, `rmt-route`, `rmt-schedule`, `rmt-template-dom`,
`rmt-template-html`, and `rmt-vnext-primitive-shell`.

## Fabric/Lane Ingestion in the Component Adapter

Starting with `xtend.component.fabric-lane-ingestion.v2`, the XTend Component
Adapter evaluates Fabric and lane hints directly during mounting and hydration.
Precedence remains:

1. `rmt.schedule-record`
2. `rmt.component-metadata`
3. `fabric.runtime-override`
4. `component.static-contract`
5. `scaffold.blueprint-default`

In vNext, the preferred source is `lane` and lifecycle clauses. The adapter
provides `resolveFabricContext(componentRef, operation, model, options)` for
that. `mountComponent(...)` and `hydrateComponent(...)` mirror the context into
`result.metadata.fabric` and set DOM attributes for lane, RMT lane, fiber,
source, and endpoint. Conflicts produce
`rmt.xtend.component.fabric_lane.conflict`.

The local gate is:

```bash
node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json
```

## Component Lifecycle Telemetry

Starting with `xtend.component.lifecycle-telemetry.v1`, the same adapter
creates standardized component lifecycle telemetry. RMT documents do not need
to import XTend code for this; they only provide component, route, schedule,
and Fabric context. The host can pass `telemetryCollector`, `recordTelemetry`,
or a Fabric instance.

```js
const records = [];
adapter.mountComponent(root, 'pages.settings', model, {
  mapping,
  telemetryCollector: records
});

const snapshot = fabric.createTelemetrySnapshot({
  componentTelemetry: records
});
```

`snapshot.componentTelemetry` aggregates `mount`, `hydrate`, `render`,
`update`, `event`, `unmount`, and `error` by operation, component, and lane.
Component errors, deadline misses, and explicit `backpressureSignal` metadata
can create backpressure. The gate is
`node scripts/run_xtend_tests.js rmt-component-lifecycle-telemetry --json`.

Hosts can pass Fabric snapshots directly to the productive RMT bridge:

```js
bridge.recordTelemetrySnapshot(snapshot, {
  scheduleRef: "diagnostics.snapshot"
});
```

The bridge mirrors `rmt.telemetry.lastSnapshot` and `rmt.backpressure.*` from
that and schedules the diagnostics snapshot endpoint when needed.

## Multi-Host Rule

Native RMT components must not implicitly mean XTend. A non-XTend host uses the
same vNext structure with its own adapter ID and host execution:

```rmt
template vanilla.app {
  portal surface.root root "#vanilla-root" layer surface

  surface vanilla.panel kind card component vanilla-panel {
    portal surface.root

    lane visible weight 60 {
      hydrate vanilla-panel from endpoint xtendrmt.vanilla.mount
    }
  }
}
```

The browser smoke `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` checks
exactly this path. Framework agnosticism is therefore not only an architecture
goal, but a regression.

## Kernel Boundary

The RMT kernel must not import or assume:

- `x-router`
- concrete `x-*` components
- XTend manifest structures
- `window.XTend`
- `xstate`
- browser DOM APIs

The kernel may normalize, index, validate, and describe schedule policies. Host
execution remains adapter work.

## Review Checklist

Before a new native `.rmt` document, check:

- does the source describe app shell, surfaces, lanes, and events in RMT vNext?
- are legacy/App-DSL JSON only compiler output, mirror, or migration?
- do XTend-specific data stay outside the kernel?
- do lifecycle operations reference stable endpoints and adapter boundaries?
- does each non-XTend host have its own adapter instead of an XTend fallback?
- do the `rmt-compatibility`, `browser`, and `references` gates pass?
