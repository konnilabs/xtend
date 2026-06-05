# Native-First RMT Recipes

RMT recipes describe complete XTend UIs without a manual host shell. The current recipe surface covers route shells, surfaces, slots, data display, command/search, actions, effects, resources, event routing, scheduler lanes and DOM descriptor rendering.

This guide shows which records to use when an app author wants a dashboard, command palette or mixed app flow to stay Native-First.

## Recipe Principle

A Native-First recipe is valid when it meets these rules:

- The UI comes from RMT records rather than imperative host rendering.
- DOM output goes through DOM descriptor records and XTend-owned component adapters.
- Events are connected through declarative routes, actions, commands or search records.
- Data sources and resources have lifecycle, owner and cleanup rules.
- Surface overlays keep focus, Escape and stack behavior declarative.
- Product claims stay bounded when browser evidence or runtime parity is still open.

Relevant contracts:

- `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- `xtend.native-first.rmt-action-effect-data-resource-primitives.v1`
- `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- `xtend.native-first.docs-authoring-guides.v1`
- `xtend.rmt-ui-maximality-owned-data-display-primitives.v1`
- `xtend.rmt-ui-maximality-owned-command-search-primitives.v1`
- `xtend.rmt-ui-maximality-owned-recipe-extension.v1`
- `xtend.rmt-ui-maximality-owned-release-handoff.v1`

## Recipe Types

| UI | RMT building blocks | Native-First expectation |
| --- | --- | --- |
| App shell | Routes, surfaces, regions, slots | no manual host shell, clear focus and scheduler rules |
| Dashboard | `dataSources`, `resources`, `selectors`, `collectionViews`, templates | owned data display before external grid runtime |
| Command/search | `commandSources`, `searchSources`, popover surface, effects | registered commands, action refs and effect policy |
| Form | Form binding, validation, submit action, error state | browser form APIs first, declarative actions instead of inline code |
| Overlay | Surface, portal, dialog, popover, focus policy | owned overlay and focus primitives, Escape and cleanup rules |
| Media | Resource query, preview, fallback, caption | safe URLs, clear loading and error states |

## Dashboard And Data Display

Use `collectionViews` when a recipe renders data-bound cards, lists or table-like surfaces. A collection view names the selector that provides records, the stable key, the item template, empty/loading/error templates, selection state, sorting state and a scheduler budget.

```json
{
  "collectionViews": [
    {
      "id": "collection.orders",
      "source": "selector.visibleOrders",
      "layoutMode": "list-grid",
      "key": "$record.id",
      "itemTemplate": "template.order-card",
      "emptyTemplate": "template.collection.empty",
      "loadingTemplate": "template.collection.loading",
      "errorTemplate": "template.collection.error",
      "selection": "state.orders.selection",
      "sorting": "state.orders.sort",
      "maxItemsPerFrame": 50
    }
  ]
}
```

The owned data-display package currently proves display foundation and collection-view records. Full datagrid parity, framework table API copying and default virtualization remain outside the public claim until matching browser and runtime evidence exists.

## Command And Search

Use `commandSources` for registered commands and `searchSources` for query-bound result lists. A command/search recipe should expose the surface, trigger, shortcut, registered action references, query state, resource, selector, active index, selection state and accessible result semantics.

```json
{
  "commandSources": [
    {
      "id": "command.global",
      "surface": "surface.command-search",
      "shortcut": "Mod+K",
      "actionRefRequired": true
    }
  ],
  "searchSources": [
    {
      "id": "search.commands",
      "queryState": "state.command.query",
      "resource": "resource.commands",
      "selector": "selector.visibleCommands",
      "minQueryLength": 1,
      "debounceMs": 120,
      "activeIndexState": "state.command.activeIndex",
      "selectionState": "state.command.selection"
    }
  ]
}
```

Commands do not execute free strings. Selection routes through `action.command.execute`, the action requires a registered command, and the effect names an adapter plus an allow-list.

## Complete App Flow

The complete recipe extension combines a route, a dashboard region and a command-search popover:

- `route.dashboard` enters `surface.dashboard`.
- `resource.orders` feeds `selector.visibleOrders`, which feeds `collection.orders`.
- `surface.command-search` owns `resource.commands` and releases it on surface close.
- `event.command.execute` reaches `action.command.execute`, which reaches `effect.command.route`.
- Scheduler lanes remain explicit: visible render, resource query and accessibility feedback.

This lets a dashboard use data display and command/search without introducing a second UI framework or a manual HTML row renderer.

## Public Boundaries

These claims are intentionally not made by the current public recipes:

- complete datagrid parity
- framework table or command API compatibility
- default virtualized list behavior without browser evidence
- unregistered command execution
- command execution without an action reference
- manual HTML renderers for rows or commands

## Checks

```bash
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-owned-data-display-primitives rmt-owned-command-search-primitives rmt-owned-recipe-extension --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs native-first-docs-authoring references --json
```

Expected signal: recipe records remain tied to RMT core records, DOM descriptor rendering, Trusted DOM rules, action/effect policy and budget duties.

Read next:

- [RMT Component Primitives and XTend UI](./rmt-vnext-component-primitives.md)
- [RMT Action Effect Runtime](./rmt-action-effect-runtime.md)
- [RMT Surface Resource Graph Runtime](./rmt-surface-resource-graph-runtime.md)
