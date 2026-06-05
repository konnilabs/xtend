# RMT Action Effect Runtime

RMT actions and effects connect declarative UI records to state changes, resource queries and host effects. The runtime surface is intentionally narrow: actions name what may happen, effects name which adapter may perform it, and policies block free execution.

## Public Building Blocks

| Record | Role |
| --- | --- |
| `dataSources` | declare fixture, injected, REST, SSR or host-backed data inputs with owner and adapter policy |
| `resources` | bind data sources to lifecycle, cache, loading, error and release state |
| `actions` | update state, run a resource query or invoke an effect through a named policy |
| `effects` | describe host operations with adapter refs, allow-lists and result state |
| `events` | route browser or RMT-source events to actions |
| `schedules` | assign visible, resource, accessibility or diagnostics work to budgets |

The same contract is used by data display and command/search recipes. A dashboard can refresh a resource; a command palette can execute a registered command; neither needs imperative host glue in the RMT source.

Compatibility anchors for older runtime checks:

```txt
runtime contract: xtend.epic18.rmt-action-effect-runtime.v1
DataSources: fixture, rest, ssr, host
Resource Ownership: resources release by action owner or scope
next workpackage: WP-E18-09
```

## State And Resource Actions

State updates should name a target and a typed payload source. Resource queries should name the resource and require an owner policy.

```json
{
  "actions": [
    {
      "id": "action.orders.refresh",
      "kind": "resource-query",
      "resource": "resource.orders",
      "policy": "resource-owner-required"
    },
    {
      "id": "action.orders.select",
      "kind": "state-update",
      "target": "state.orders.selection",
      "payload": "$event.key"
    }
  ]
}
```

Resources carry their own loading and error state, so templates can render loading, empty and error surfaces without host-side conditionals.

## Effect Policy

Effects are host boundaries. A command effect must name the host adapter, the required policy, the allowed command IDs and where the result lands.

```json
{
  "actions": [
    {
      "id": "action.command.execute",
      "kind": "effect",
      "effect": "effect.command.route",
      "payload": "$event.commandId",
      "policy": "registered-command-required"
    }
  ],
  "effects": [
    {
      "id": "effect.command.route",
      "kind": "host-command",
      "adapterRef": "adapter.commandRouter",
      "policy": "effect-policy-required",
      "allowedCommands": ["cmd-open-audit", "cmd-run-gate"],
      "resultState": "state.command.result"
    }
  ]
}
```

The runtime must reject unregistered command execution and command execution without an action reference. This is part of the public security contract, not an optional host preference.

## Command/Search Safety

Command/search recipes add two extra constraints:

- `commandSources` must set `actionRefRequired: true` when they expose registered commands.
- Search selection must route through an action such as `action.command.execute`, not directly to a host callback.
- Host command effects must keep an allow-list in `allowedCommands`.
- Focus recovery effects, such as `effect.command.focusRestore`, must name a target and a policy.

These rules keep the command surface auditable even when the UI uses a popover, shortcut and async search resource.

## Data Display Safety

Data-display recipes use actions for selection and sorting:

- `event.collection.select` updates `state.orders.selection`.
- `event.collection.sort` updates `state.orders.sort`.
- Resource query work stays on the `resource` scheduler lane.
- Render work stays on the `visible` scheduler lane.

Large data claims should also expose frame budgets such as `maxItemsPerFrame` on `collectionViews`.

## Public Contract

RMT Action Effect Runtime is the public runtime contract for `docs/en/rmt-action-effect-runtime.md`. Stable behavior is the ability to verify records, policies and negative claims through local fixtures.

Sources:

- `tests/fixtures/rmt-owned-data-display-primitives.rmt`
- `tests/fixtures/rmt-owned-command-search-primitives.rmt`
- `tests/fixtures/rmt-owned-recipe-extension.rmt`
- `tests/fixtures/native-first/rmt-owned-contract-budget-runtime-parity-fixtures.json`

Checks:

```bash
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-owned-command-search-primitives rmt-owned-recipe-extension --json
node scripts/run_xtend_tests.js rmt-owned-contract-budget-runtime-parity references --json
```

Expected signal: actions and effects remain policy-bound, source-map-capable and free of unregistered host execution.

Read next:

- [RMT Event Routing Runtime](./rmt-event-routing-runtime.md)
- [RMT Surface Resource Graph Runtime](./rmt-surface-resource-graph-runtime.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
