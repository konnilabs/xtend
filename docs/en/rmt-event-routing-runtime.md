# RMT Event Routing Runtime

Declarative event routes connect UI events, RMT-source events and route lifecycle signals to actions. They are the bridge between Native-First component records and the action/effect runtime.

## Public Building Blocks

- `events` name a source, event type and action target.
- Payload contracts define which values the action may read from the event.
- Event governance keeps `preventDefault`, propagation, capture, passive, once and retargeting declarative.
- `sourceMap` entries connect event and action records to diagnostics.
- Scheduler lanes keep feedback, resource and visible work accountable.

The same event model handles browser component events, route enter events, collection selection and command/search selection.

Compatibility anchors for older runtime checks:

```txt
runtime contract: xtend.epic18.rmt-event-routing-runtime.v2
next workpackage: WP-E18-10
```

## Payload Contracts

Every action event needs a payload contract when it forwards host data to an action. The contract describes required fields, simple types and the payload source, such as `event.target.value`, `detail`, `dataset`, `$event.key`, `$event.sort`, `$event.value`, `$event.index` or `$event.commandId`.

Keep payloads small. Actions should receive the key, query, sort descriptor or command ID they need, not the full browser event object.

## Collection Events

Collection events come from `collectionViews`. They route selection and sorting into state-update actions.

```json
{
  "events": [
    {
      "id": "event.collection.select",
      "source": "collection.orders",
      "type": "select",
      "action": "action.orders.select"
    },
    {
      "id": "event.collection.sort",
      "source": "collection.orders",
      "type": "sort",
      "action": "action.orders.sort"
    }
  ],
  "actions": [
    {
      "id": "action.orders.select",
      "kind": "state-update",
      "target": "state.orders.selection",
      "payload": "$event.key"
    }
  ]
}
```

This keeps data display declarative: the component host can render cards or rows, but selection state and sorting state stay visible in RMT.

## Command/Search Events

Command/search events come from a trigger component, a popover surface or a `searchSources` record. Query, active index and selection are separate routes.

```json
{
  "events": [
    {
      "id": "event.command.query",
      "source": "component.command.search",
      "type": "input",
      "action": "action.command.query"
    },
    {
      "id": "event.command.execute",
      "source": "search.commands",
      "type": "select",
      "action": "action.command.execute"
    }
  ],
  "actions": [
    {
      "id": "action.command.execute",
      "kind": "effect",
      "effect": "effect.command.route",
      "payload": "$event.commandId",
      "policy": "registered-command-required"
    }
  ]
}
```

The execute route must not jump directly to a host callback. It reaches a policy-bound effect, and the effect applies the registered-command allow-list.

## Event Governance

Event governance keeps browser events declarative. Use record policies for:

- `preventDefault`
- `stopPropagation`
- `stopImmediatePropagation`
- `capture`
- `passive`
- `once`
- `retarget`

A host can apply these policies without adding a product event framework or global event bus.

## Authoring Workflow

1. Name the event source: component, route, collection, surface or search source.
2. Name the event type with the smallest useful payload.
3. Route to an action, not to host code.
4. Put host work behind an effect with policy and adapter refs.
5. Add source-map entries for event and action records used by diagnostics.

## Public Contract

RMT Event Routing Runtime is the public runtime contract for `docs/en/rmt-event-routing-runtime.md`. A host should be able to verify event routes, payloads and governance without private project knowledge.

Sources:

- `tests/fixtures/rmt-owned-data-display-primitives.rmt`
- `tests/fixtures/rmt-owned-command-search-primitives.rmt`
- `tests/fixtures/rmt-owned-recipe-extension.rmt`
- `xtendrmt/rmt-event-routing-runtime.js`

Checks:

```bash
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-owned-data-display-primitives rmt-owned-command-search-primitives rmt-owned-recipe-extension --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server references --json
```

Expected signal: event routes remain declarative, payload-limited, source-map-capable and policy-bound before reaching host effects.

Read next:

- [RMT Action Effect Runtime](./rmt-action-effect-runtime.md)
- [RMT Component Primitives and XTend UI](./rmt-vnext-component-primitives.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
