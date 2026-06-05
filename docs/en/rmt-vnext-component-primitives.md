# RMT Component Primitives and XTend UI

RMT component primitives describe XTend-owned UI surfaces without binding the RMT kernel to XTend component classes. The record tells the host which component adapter, parts, slots, templates and scheduler signals are needed; the host keeps the actual DOM implementation behind the adapter boundary.

## Public Surface

The current public surface covers three component-oriented record families:

| Family | Records | Purpose |
| --- | --- | --- |
| Display foundation | `components`, `templates`, `slots`, `sourceMap` | render XTend-owned section, card, summary, status, progress and alert surfaces through DOM descriptors |
| Data display | `dataSources`, `resources`, `selectors`, `collectionViews` | render data-bound collections with key, selection, sorting and state templates |
| Command/search | `surfaces`, `commandSources`, `searchSources`, `actions`, `effects` | render command popovers and query-bound result lists with registered actions |

The RMT kernel stays neutral: it records IDs, tags, adapter names, attributes, props and source-map entries, but it does not import XTend component types or browser-specific host types.

## Component Records

A component record is a public adapter contract, not a generated DOM promise. The host may render `x-section`, `x-cards`, `x-summary`, `x-status`, `x-progress`, `x-alert`, `x-button`, `x-popover`, `x-input`, `x-menu` and `x-icon`, while RMT only describes the adapter-facing shape.

```json
{
  "components": [
    {
      "id": "component.collection.cards",
      "tag": "x-cards",
      "adapter": "xtend.component",
      "parts": ["root", "grid", "item"]
    }
  ],
  "templates": [
    {
      "id": "template.order-card",
      "renderMode": "dom_descriptor",
      "root": {
        "type": "component",
        "component": "component.collection.cards",
        "props": {
          "title": "$record.title",
          "status": "$record.status",
          "selected": "$selection.current"
        }
      }
    }
  ]
}
```

Template output must remain DOM descriptor output. String-based HTML row renderers and manual command renderers are blocked.

## Collection Views

Use `collectionViews` when component primitives need record iteration. The collection view binds a selector to an item template, empty/loading/error templates, selection and sorting state. It also exposes budget-sensitive values such as `maxItemsPerFrame`.

```json
{
  "resources": [
    {
      "id": "resource.orders",
      "dataSource": "datasource.orders",
      "lifecycle": "query",
      "cachePolicy": "owner-scoped"
    }
  ],
  "collectionViews": [
    {
      "id": "collection.orders",
      "source": "selector.visibleOrders",
      "key": "$record.id",
      "itemTemplate": "template.order-card",
      "selection": "state.orders.selection",
      "sorting": "state.orders.sort"
    }
  ]
}
```

This is an owned data-display surface, not a full datagrid compatibility layer. `x-table`, `x-tree` and `x-virtual-list` are reserved for later runtime proof; authors should keep virtualized or hierarchical claims explicit until evidence exists.

## Command And Search Primitives

Command/search primitives use a surface plus registered command and search records. The component layer may render a trigger, popover, search input and result menu; RMT records still own the command contract.

```json
{
  "surfaces": [
    {
      "id": "surface.command-search",
      "kind": "popover",
      "focusPolicy": "restore-on-close",
      "escape": "event.command.close"
    }
  ],
  "commandSources": [
    {
      "id": "command.global",
      "surface": "surface.command-search",
      "shortcut": "Mod+K",
      "actionRefRequired": true
    }
  ]
}
```

`x-command-palette`, `x-autocomplete` and `x-combobox` remain bounded physical component claims. Public RMT records already describe command source, search source, focus and action/effect policy; full rich-widget parity waits for runtime and browser evidence.

## Authoring Workflow

1. Start with a component record and a DOM descriptor template.
2. Add a data source, resource and selector before adding `collectionViews`.
3. Add a popover surface before adding `commandSources` or `searchSources`.
4. Route events through actions and effects; do not attach free host command execution.
5. Add source-map entries for records that must be traceable in diagnostics.

## Public Contract

RMT Component Primitives and XTend UI is the public runtime contract for `docs/en/rmt-vnext-component-primitives.md`. An external host should be able to verify the named records and checks without private project knowledge.

Sources:

- `tests/fixtures/rmt-owned-data-display-primitives.rmt`
- `tests/fixtures/rmt-owned-command-search-primitives.rmt`
- `tests/fixtures/rmt-owned-recipe-extension.rmt`
- `tests/fixtures/native-first/rmt-owned-data-display-primitives-fixtures.json`
- `tests/fixtures/native-first/rmt-owned-command-search-primitives-fixtures.json`
- `tests/fixtures/native-first/rmt-owned-release-handoff-fixtures.json`

Checks:

```bash
node scripts/run_xtend_tests.js rmt-owned-data-display-primitives rmt-owned-command-search-primitives rmt-owned-recipe-extension --json
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-linter-cli rmt-language-server --json
```

Expected signal: component primitives stay adapter-bound, source-map-capable, dependency-light and free of manual HTML sinks.

Read next:

- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [RMT Event Routing Runtime](./rmt-event-routing-runtime.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
