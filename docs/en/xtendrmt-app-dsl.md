# XTendRMT App DSL Reference

- Status: current after Epic 05 completion, updated vNext-first
- Contract: `xtend.docs.xtendrmt-app-dsl.v1`
- Schema source: `xtendrmt/rmt.schema.json`
- Normalizer: `createRmtFormat().normalizeDocument(...)`

## Purpose

The App DSL describes a renderable application as an RMT document. New
authoring work uses RMT vNext; legacy/App-DSL JSON remains the normalized core
output, runtime registry, and compatibility surface. XTend UI, XRouter, Vanilla
JS, and other hosts are connected through adapter records without the kernel
importing host runtime.

Since `WP-E13-09`, [RMT Production Readiness](./rmt-production-readiness.md)
bundles this App DSL under `xtend.epic13.rmt-production-readiness.v1` as the
RC1 boundary for shell-first app shell, native routes, components, Fabric/lanes,
lifecycle telemetry, diagnostics, and artifact parity.

## Minimal vNext Document

```rmt
template app.shell {
  state app.ready type boolean initial true

  portal surface.root root "#app-root" layer surface

  surface app.home kind page component x-section {
    source state app.ready
    portal surface.root

    lane visible weight 80 {
      hydrate app-shell from state app.ready
    }
  }
}
```

The compiler lowers this source into core domains such as `adapters`,
`components`, `routes`, `schedules`, `surfaces`, and `templates`. These domains
are stable for runtime adapters, but they are no longer the preferred writing
surface.

## Native Domains as Compiler Output

| Domain | Responsibility |
|--------|----------------|
| `adapters` | host capabilities, runtime surface, capability negotiation |
| `components` | domain component records, host adapter, hydration hints |
| `routes` | navigation, route targets, query/params, schedule references |
| `schedules` | reusable scheduler policies |
| `templates` | `dom_descriptor`, props, slots, bindings, hydration contracts |
| `surfaces` | SurfaceManager, window, panel, and overlay handoffs |

`manifest.metadata` remains valid for descriptions, handoff, history, and demo
notes. New operational routes, components, and schedules belong in vNext source
and are projected from there into the registry.

## Adapter Records

In vNext, adapters become visible implicitly through surface, route, and
endpoint usage. The registry then contains stable adapter records for hosts:

- `xtend.xrouter`
- `xtend.component`
- `xtend.surface`
- `rmt.state-scheduler-diagnostics`
- `vanilla.component`

`kernelVisible: false` is the default for host-specific adapter data. The
kernel may index these records, but it must not load host runtime.

## Component Records

A vNext surface describes the domain host element:

```rmt
template settings.components {
  portal surface.root root "#settings-root" layer surface

  surface settings.card kind card component x-card {
    portal surface.root

    lane visible weight 80 {
      mount x-card
      hydrate settings-card from endpoint xtendrmt.component.hydrate
    }
  }
}
```

The normalizer turns this into runtime registry entries that can be consumed
through `componentRegistry.byAdapter["xtend.component"]` and
`componentRegistry.byTag["x-card"]`.

## Route Records

Route metadata remains declarative and can be tied to surfaces:

```rmt
template settings.routes {
  state settings.tab type string initial "profile"

  portal surface.root root "#app-root" layer surface

  surface settings.page kind page component x-section {
    source state settings.tab
    portal surface.root

    lane visible weight 80 {
      hydrate route-view from endpoint xtendrmt.route.render
      hydrate settings-shell from state settings.tab
    }
  }
}
```

The normalizer creates route and schedule indexes for
`routeRegistry.byRouter["xtend.xrouter"]`, `routeRegistry.byId[...]`, and
`routeRegistry.byPath[...]`. `title`, `documentTitle`, `titleTemplate`,
`metaDescription`, and `metaKeywords` remain declarative route metadata:
XRouter writes `document.title` and `description`/`keywords` from them without
RMT importing XTend or XRouter.

## Schedule Records

Schedules are `lane` and lifecycle clauses in vNext:

```rmt
template scheduler.page {
  portal surface.root root "#app-root" layer surface

  surface app.shell kind page component x-section {
    portal surface.root

    lane visible weight 80 {
      hydrate route-shell from endpoint xtendrmt.route.render
    }

    lane idle weight 20 {
      hydrate help-panel from endpoint xtendrmt.component.hydrate
    }
  }
}
```

Proven endpoint names remain:

- `xtendrmt.route.render`
- `xtendrmt.component.mount`
- `xtendrmt.component.hydrate`
- `xtendrmt.vanilla.mount`
- `xtendrmt.diagnostics.snapshot`
- `xtendrmt.template.inspect`

## Template Records and Trusted DOM

New templates are lowered from vNext surfaces and slots into
`dom_descriptor` output:

```rmt
template settings.template {
  portal surface.root root "#settings-root" layer surface

  surface settings.shell kind page component x-card {
    portal surface.root

    lane visible weight 80 {
      hydrate settings-card from endpoint xtendrmt.component.hydrate {
        slot header hydrate settings-header
        slot body hydrate settings-body
      }
    }
  }
}
```

`html_fragment` remains compatible, but requires an explicit Trusted DOM
boundary:

```rmt
template settings.legacyHtml {
  surface settings.legacy kind card component x-card {
    lane visible weight 60 {
      hydrate legacy-fragment from endpoint docs.parse {
        trust boundary "xtend.security.sanitizing-boundary.v1"
        sanitize html_fragment
      }
    }
  }
}
```

The kernel may normalize and schedule such records. Sanitizing, Trusted DOM,
and concrete DOM sinks remain host adapter work. See
[Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md).

## Shell-First Host Apps

The Docs App uses this path productively as a shell-first pilot.
`docs/xtendrmt-parsedown-docs.rmt` describes `docs.app.shell` as a
`dom_descriptor`, `docs.header.search` as the header search slot template, and
`docs.media.lazy` as a future-ready slot for XPlayer tutorials.
`docs/utils/pageloader.js` renders the RMT shell first and then inserts
Parsedown HTML only into the `data-rmt-slot="content"` slot.

Important: RMT remains framework-agnostic in this mode too. Parsedown,
rich-HTML sinks, XPlayer lazy loading, and concrete DOM events are executed by
the host adapter. RMT provides shell records, slots, schedules, and diagnostics.

## RMT-First XTend Apps

Since Epic 10, app authoring for complete XTend apps is described by contract
`xtend.rmt.first-class-app-authoring.v1`. The goal is an app whose shell,
routes, components, templates, events, commands, hydration policies, Fabric
lanes, and diagnostics all live in RMT.

The reference path is `tests/fixtures/rmt-first-class-xtend-app.rmt`. The gate
is:

```bash
node scripts/run_xtend_tests.js rmt-first-class-app --json
```

The contract intentionally stays host-neutral. RMT knows `xtend.component`,
`xtend.xrouter`, and `rmt.state-scheduler-diagnostics` as adapter records, but
it imports no XTend components and no XRouter module into the kernel. Details
live in `development/XTend-RMT-First-Class-App-Authoring.md`.

The canonical developer guide for complete XTend apps is
[RMT-First XTend Apps](./rmt-first-xtend-apps.md). The Epic 10 completion and
release gates are documented in
[Epic 10 Release Handoff](./epic10-release-handoff.md).

## Component Fabric Context

XTend Components can receive Fabric hints from vNext lanes and legacy metadata:

```rmt
template pages.settings {
  portal surface.root root "#app-root" layer surface

  surface pages.settings kind page component x-form {
    portal surface.root

    lane idle weight 40 {
      hydrate settings-form from endpoint xtendrmt.component.hydrate
    }
  }
}
```

The productive adapter resolves this data through
`xtend.component.fabric-lane-ingestion.v2`. RMT schedule records take priority
over component metadata, runtime overrides, static contracts, and scaffold
defaults. The gate is
`node scripts/run_xtend_tests.js rmt-component-fabric-ingestion --json`.

## Component Lifecycle Telemetry

Starting with `xtend.component.lifecycle-telemetry.v1`, the adapter creates
lifecycle records for component work. RMT documents do not need to import XTend
code for this; they only provide component, route, schedule, and Fabric context.
The host can pass `telemetryCollector`, `recordTelemetry`, or a Fabric instance.

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

## Runtime Registry

The registry is the consumable boundary between DSL and adapter. Adapters read
registry entries, not raw demo metadata:

```js
const format = createRmtFormat();
const normalizedDocument = format.normalizeDocument(document);
const registry = format.createRuntimeRegistries(normalizedDocument, {
  requiredRoutes: ["settings", "/settings"],
  requiredComponents: ["settings.card", "x-card"]
});
```

## Diagnostics

The App DSL normalizer creates diagnostics instead of forcing host execution.
Important groups:

- `rmt.dsl.reference.*` for missing or invalid references
- `rmt.runtime.registry.*` for registry conflicts or missing required refs
- `rmt.xrouter.*` for route mapping and navigation
- `rmt.xtend.component.*` for component mapping, mounting, and hydration
- `rmt.bridge.*` for the state, scheduler, and diagnostics bridge

## Review Checklist

- App shell examples are `rmt` and vNext-first.
- Runtime registry JSON is classified as generated output or compatibility
  surface.
- Routes reference components and schedules only by ID.
- Components reference host adapters only by ID.
- Schedule policies are central and reusable.
- XTend-specific data stays outside the kernel.
- Non-XTend hosts receive their own adapters instead of XTend fallbacks.
- `node scripts/run_xtend_tests.js rmt-compatibility --json` passes.
