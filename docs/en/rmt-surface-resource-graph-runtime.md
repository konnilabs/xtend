# RMT Surface Resource Graph Runtime

RMT surfaces and resources form a traceable ownership graph. A surface names where UI appears, a resource names what data it owns, and lifecycle rules define when that data loads, reports errors and releases.

## Public Building Blocks

| Record | Role |
| --- | --- |
| `surfaces` | region, popover, overlay or portal ownership plus template, focus and stack policy |
| `routes` | route lifecycle to surface entry |
| `dataSources` | adapter-owned input data |
| `resources` | query lifecycle, cache policy, loading/error state and release behavior |
| `selectors` | derived visible data for collections or search results |
| `sourceMap` | traceability from RMT source paths to runtime IDs |

Surface and resource ownership is shared by dashboard flows, command/search popovers and browser-lab evidence.

Compatibility anchors for older runtime checks:

```txt
runtime contract: xtend.epic18.rmt-surface-resource-graph-runtime.v1
Keyed Surface Repeater: surface instances are keyed before resource ownership is resolved
Portal Layer Stack: portal, overlay and surface owners share cleanup diagnostics
next workpackage: WP-E18-11
```

## Region And Popover Surfaces

A complete app recipe can combine a region surface for the dashboard with a popover surface for command/search.

```json
{
  "surfaces": [
    {
      "id": "surface.dashboard",
      "kind": "region",
      "template": "template.dashboard.shell",
      "owner": "rmt-ui-authoring-owner"
    },
    {
      "id": "surface.command-search",
      "kind": "popover",
      "template": "template.command.shell",
      "focusPolicy": "restore-on-close",
      "escape": "event.command.close",
      "stackPolicy": "topmost"
    }
  ]
}
```

The popover surface carries the focus and Escape contract. It does not need a framework overlay runtime by default.

## Resource Ownership

Resources connect data sources to UI state. Owner-scoped resources make loading and error states visible and keep cleanup auditable.

```json
{
  "resources": [
    {
      "id": "resource.commands",
      "dataSource": "datasource.commands",
      "lifecycle": "query",
      "cachePolicy": "owner-scoped",
      "loadingState": "state.command.loading",
      "errorState": "state.command.error",
      "release": "on-surface-close"
    }
  ]
}
```

Use `release: "on-surface-close"` for resources owned by transient overlays such as command/search. Long-lived dashboard resources can remain owner-scoped to the region surface and refresh through actions.

## Graph Flow

A typical graph for a dashboard with command/search looks like this:

1. `route.dashboard` enters `surface.dashboard`.
2. `resource.orders` queries `datasource.orders`.
3. `selector.visibleOrders` feeds `collection.orders`.
4. `surface.command-search` opens as a popover.
5. `resource.commands` queries `datasource.commands`.
6. `selector.visibleCommands` feeds `search.commands`.
7. Closing the popover releases `resource.commands` and restores focus.

This graph is public documentation for ownership. It should remain visible in source maps and diagnostics.

## Browser Evidence Boundary

Surface Browser Lab checks can prove DOM shape, focus behavior and visual baselines for owned app flows. Public release claims should stay bounded when:

- a physical component still needs runtime evidence;
- a visual baseline is owner-run only;
- a browser pixel artifact is conditional;
- a docs quality gate still carries known legacy findings.

The release state for the owned RMT surface is accepted with remaining release items. That means the record contracts are usable, but physical parity claims such as `x-table`, `x-tree`, `x-virtual-list`, `x-command-palette`, `x-autocomplete` and `x-combobox` still need their own proof before they become broad product promises.

## Public Contract

RMT Surface Resource Graph Runtime is the public runtime contract for `docs/en/rmt-surface-resource-graph-runtime.md`. A host should be able to verify surface ownership, resource cleanup and traceability without private project knowledge.

Sources:

- `tests/fixtures/rmt-owned-recipe-extension.rmt`
- `tests/fixtures/rmt-owned-command-search-primitives.rmt`
- `tests/fixtures/native-first/rmt-owned-surface-browser-lab-fixtures.json`
- `tests/browser/fixtures/rmt-owned-surface-browser-lab.html`
- `tests/browser/visual-baselines/rmt-owned-surface-browser-lab.dom-baseline.json`
- `tests/fixtures/native-first/rmt-owned-release-handoff-fixtures.json`

Checks:

```bash
node scripts/run_xtend_tests.js rmt-surface-resource-graph-runtime --json
node scripts/run_xtend_tests.js rmt-owned-surface-browser-lab rmt-owned-release-handoff --json
node scripts/run_xtend_tests.js rmt-owned-recipe-extension references --json
```

Expected signal: surfaces, resources and cleanup stay owner-scoped, source-map-capable and clear about browser-evidence boundaries.

Read next:

- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [RMT Action Effect Runtime](./rmt-action-effect-runtime.md)
- [RMT Component Primitives and XTend UI](./rmt-vnext-component-primitives.md)
