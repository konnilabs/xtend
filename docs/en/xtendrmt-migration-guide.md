# XTendRMT Native Migration Guide

- Status: production after Epic 05 completion
- Contract: `xtend.rmt.native-migration-guide.v1`
- Minimum gates:
  - `node scripts/run_xtend_tests.js rmt-compatibility --json`
  - `node scripts/run_xtend_tests.js references --json`
  - `npm test`

## Purpose

This guide describes the migration from early XTendRMT metadata paths to native RMT top-level domains and onward to RMT vNext. The migration is additive and opt-in: existing XTend, React, Vue, Vanilla JS and custom apps may keep running while new app shells are written in RMT vNext. `adapters`, `components`, `routes`, `schedules` and `templates` remain runtime registry, compiler output and compatibility mirror.

The current product overview is in [XTendRMT Developer Overview](./xtendrmt-overview.md). App DSL details are in [XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md), and production adapter/bridge wiring is in [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md).

## Target State

New documents should use these sources:

| Area | Target Source |
|------|---------------|
| Host Adapter | vNext surface/endpoint usage, output: `adapters` |
| XTend Components | `surface ... component x-*`, output: `components` with `adapter: "xtend.component"` |
| XRouter Routes | vNext shell/route surface, output: `routes` with `router: "xtend.xrouter"` |
| Scheduler Policies | `lane` and lifecycle operations, output: `schedules` |
| Markup or Fragments | `surface`, `slot`, `trust boundary`, output: `templates` |
| Description, Handoff, History | `manifest.metadata` |

`manifest.metadata` remains valid for product descriptions, handoff notes, demo history and deliberately historical pilot data. Operative routes, components and schedules should not be created there anymore. Template-only documents remain compatible.

## vNext Target Shape

```rmt
template settings.migration {
  state settings.tab type string initial "profile"

  portal surface.root root "#settings-root" layer surface

  surface settings.card kind card component x-card {
    source state settings.tab
    portal surface.root

    lane visible weight 80 {
      hydrate settings-card from state settings.tab
    }
  }
}
```

The JSON examples in the following steps are intentionally marked as legacy input or runtime-registry output. They show migration evidence, not the new writing style.

## Migration Matrix

| Starting Point | Migration |
|----------------|-----------|
| Template-only `.rmt` document | remains valid; add native domains only when App DSL requires them |
| `manifest.metadata.routes` | move to `routes` |
| `manifest.metadata.components` | move to `components` |
| `manifest.metadata.schedules` | move to `schedules` |
| XRouter-specific demo initialization | replace with `createRmtXRouterAdapter` |
| XTend-specific demo mount logic | replace with `createRmtXtendComponentAdapter` |
| manual scheduler/state bridge | replace with `createRmtStateSchedulerDiagnosticsBridge` |
| non-XTend host | declare a custom adapter such as `vanilla.component` |

## Step 1: Make Adapters Explicit in Registry Output

Old demo metadata often contains implicit knowledge such as "this route uses XRouter" or "this component is XTend". The first migration step is an explicit adapter record.

```json
{
  "id": "xtend.component",
  "kind": "component_adapter",
  "runtimeSurface": ["esm", "browser_classic"],
  "providedCapabilities": ["components", "customElements", "hydration", "scheduleRefs"],
  "kernelVisible": false
}
```

`kernelVisible: false` is mandatory for host-specific adapter data. It means the kernel may validate and index the record, but must not import the XTend runtime.

## Step 2: Lift Components out of Legacy Metadata

Before: legacy `manifest.metadata`

```json
{
  "manifest": {
    "metadata": {
      "components": [
        {
          "id": "settings.card",
          "tag": "x-card"
        }
      ]
    }
  }
}
```

After: compatibility/registry output

```json
{
  "components": [
    {
      "id": "settings.card",
      "kind": "custom_element",
      "adapter": "xtend.component",
      "tag": "x-card",
      "schedule": "component.idle.hydrate"
    }
  ]
}
```

This lets `createRmtFormat().createRuntimeRegistries(...)` expose the component through `componentRegistry.byAdapter["xtend.component"]`.

## Step 3: Lift Routes out of Legacy Metadata

Before: legacy `manifest.metadata`

```json
{
  "manifest": {
    "metadata": {
      "routes": [
        {
          "path": "/settings",
          "component": "settings.card"
        }
      ]
    }
  }
}
```

After: compatibility/registry output

```json
{
  "routes": [
    {
      "id": "settings",
      "path": "/settings",
      "router": "xtend.xrouter",
      "component": "settings.card",
      "template": "settings.shell",
      "schedule": "route.visible.render"
    }
  ]
}
```

This lets `createRmtXRouterAdapter` map the route through `routeRegistry.byRouter["xtend.xrouter"]` and pass it to XRouter with `registerRoutes`.

## Step 4: Centralize Schedules

Endpoint hints often used to live in route, component or template metadata. After migration, the policy lives centrally in `schedules`.

```json
{
  "schedules": [
    {
      "id": "route.visible.render",
      "endpointName": "xtendrmt.route.render",
      "lane": "visible",
      "priority": 80,
      "preferIdle": false
    },
    {
      "id": "component.idle.hydrate",
      "endpointName": "xtendrmt.component.hydrate",
      "lane": "idle",
      "priority": 40,
      "preferIdle": true
    }
  ]
}
```

Routes and components now only reference `schedule`. Execution runs through `createRmtStateSchedulerDiagnosticsBridge`.

## Step 5: Remove Demo Bridge Logic

Permanent demo bridge logic should no longer carry new product logic. A migrated host start uses the production factories:

```js
const format = createRmtFormat();
const normalizedDocument = format.normalizeDocument(document);
const registry = format.createRuntimeRegistries(normalizedDocument);

const routes = createRmtXRouterAdapter({ routerElement }).registerRoutes(registry);
const components = createRmtXtendComponentAdapter({ document, manifest }).mapComponents(registry);
const bridge = createRmtStateSchedulerDiagnosticsBridge({ schedules: normalizedDocument.schedules });

bridge.recordAdapterResult(routes, { scheduleRef: 'route.visible.render' });
```

If special logic is still necessary, it belongs in an adapter or in upstream RMT source, not in a demo file.

## Best-Case Reference

`xtendrmt/xtendrmt-bestcase-demo.rmt` is the production authoring reference for RMT vNext:

- the `.rmt` file uses `template`, `surface`, `lane`, lifecycle operations, slots and event actions instead of JSON
- `xtendrmt/xtendrmt-bestcase-demo.core.json` is the byte-stable vNext Core output
- the browser demo projects vNext Core to `adapters`, `components`, `routes` and `schedules` at runtime
- `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter` and `createRmtStateSchedulerDiagnosticsBridge` remain the production adapter paths
- `nativeDemoMigration` is retained in the runtime projection as handoff metadata

`tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` is the browser-near regression for the migrated path. It additionally verifies `vanilla.component` so the target state remains framework-agnostic.

For the official Docs App, Parsedown remains the active Markdown parser, but the visible app shell is rendered shell-first from `docs.app.shell` in the RMT document. The RMT scheduling and shell path for Parsedown, search and future-ready media slots is documented through [XTendRMT Parsedown Scheduling Pilot](./xtendrmt-parsedown-scheduling.md) and remains host-neutral.

## SurfaceManager Migration

Starting with `WP-SM-09`, the SurfaceManager has its own migration guide: [SurfaceManager Migration Guide](./surface-manager-migration-guide.md) (`docs/surface-manager-migration-guide.md`).

The Surface path is additive:

- existing `components[*].metadata.surface` records remain valid
- native `surfaces[*]` records are preferred for complex app shells
- dual records keep `id`, `type`, `manager`, `component`, `route`, `schedule` and `stateKey` synchronized
- `xtend.surface` remains a `surface_adapter` handoff until a production adapter runtime is implemented

## What Does Not Need Migration

Not every file immediately needs native domains.

Do not migrate:

- pure template-only documents without routing or component needs
- historical demos with `manual-legacy` status
- metadata that only contains product descriptions or handoff notes
- React, Vue, Vanilla or custom hosts that do not yet use RMT as scheduler

Migrate:

- new `.rmt` App DSL documents
- demo code with operative route/component bridges
- production route or component flows
- host paths that need scheduler endpoint policies

## Review Checklist

Before closing a migration, verify that:

- `manifest.metadata.routes -> routes` has been completed
- `manifest.metadata.components -> components` has been completed
- `manifest.metadata.schedules -> schedules` has been completed
- `xtend.xrouter` and `xtend.component` are adapter records, not kernel knowledge
- `route.visible.render` and `component.idle.hydrate` are central policies
- `createRmtXRouterAdapter`, `createRmtXtendComponentAdapter` and `createRmtStateSchedulerDiagnosticsBridge` replace demo bridge logic
- template-only compatibility remains intact
- React, Vue, Vanilla JS and custom hosts are not forced into the XTend migration
- `node scripts/run_xtend_tests.js rmt-compatibility --json` and `node scripts/run_xtend_tests.js references --json` run
