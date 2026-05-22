# RMT vNext Authoring Guide

- Contract: `xtend.rmt.vnext-release-handoff.v1`
- Syntax Contract: `xtend.rmt.vnext.grammar.v1`
- Core Output: `xtend.rmt.core-format.vnext.v1`

RMT vNext is the human-friendly syntax for XTend apps. You can write a complete UI shell in RMT: state, selectors, data sources, actions, events, portals, overlays, resources, surfaces, and Fabric lanes live in a single `.rmt` source and compile deterministically into Core and kernel records.

## Basic Shape

```rmt
template media.manager {
  state selectedItem type object initial null

  selector visibleItems from datasource library {
    output card-list
  }

  datasource library from fixture records.media-items {
    contract "media.item.v1[]"
  }

  action select-item {
    input id string
    reduce state.selectedItem = input.id
    emit media.item.selected with action select-item
  }

  portal app root "#app-root" layer surface

  surface library kind workspace component x-cards {
    repeat from selector visibleItems
    key item.id
    portal app

    lane visible weight 80 {
      hydrate x-cards from selector visibleItems
    }

    on card-click target item -> action select-item {
      payload id from item.id
    }
  }
}
```

## App Shell Only in RMT

A vNext app should not split itself across RMT, App Platform JSON, and host code. RMT is the authoring place for route and shell structure, visible surfaces, overlay portals, state, selectors, actions, event payloads, resource ownership, cleanup, and Fabric lanes.

The host provides components, router, browser APIs, and external data. This boundary keeps the kernel framework-neutral while still making the app fully describable.

## XTend UI Compatibility

RMT vNext Component Primitives target the existing XTend component stack. A
surface such as `component x-select` lowers to a DOM descriptor and is then
resolved through the Component Capability Registry, not through a product-
specific renderer. The registry reads `components/manifest.json`,
`xtendComponentContract`, `xtendRmtMetadata`, public events,
`observedAttributes`, slots, parts, form association, accessibility profiles,
and performance profiles.

That gives RMT access to all 42 public manifest entries while keeping 38
renderable UI components on their normal Web Component lifecycle. Infrastructure
modules such as `x-theme` and `xstate` remain host services, not normal surface
elements. Product code should bind through public attributes, properties,
events, parts, slots, and state bridges instead of patching `shadowRoot` or
private component maps.

See [RMT vNext Component Primitives and XTend UI](./rmt-vnext-component-primitives.md).

## Editor DX

The Language Server understands vNext primitives directly:

- completions for primitive keywords and clause-aware suggestions
- hover with Core pointer and primitive information
- document symbols for `states`, `selectors`, `actions`, `surfaces`, `portals`, `overlays`, and `resources`
- code actions for safe repairs
- safe fix-all for `source.fixAll.rmt.vnext.primitives`
- manual handoffs for kernel and host boundaries

The `rmt-vnext-primitive-shell` snippet creates a small app shell with state, selector, action, portal, surface, lane, and event payload contract.

## Local Checks

```bash
node scripts/run_xtend_tests.js rmt-vnext-parser rmt-vnext-compiler rmt-vnext-tooling --json
node scripts/run_xtend_tests.js rmt-vnext-compatibility --json
node scripts/run_xtend_tests.js rmt-vnext-component-primitives --json
node scripts/run_xtend_tests.js rmt-vnext-release --json
```

## Boundaries

- RMT vNext does not execute host runtime inside the kernel.
- Conditions are declarative and allow no function calls.
- Imports are static and stay package-root-bound.
- Legacy JSON remains compatible, but it is not the preferred authoring path.
- XTend, XRouter, DOM, and browser details belong in adapters.
- XTend Component integration goes through public contracts and the Component
  Capability Registry, not direct kernel imports or Shadow-DOM monkeypatching.
