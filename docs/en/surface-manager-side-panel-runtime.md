# SurfaceManager Side Panel Runtime

Contract: `xtend.surface.side-panel-runtime.v1`

`x-side-panel` is the owned Surface component for docked, overlay, pinned, collapsed, fullscreen and floating panel modes.

Gate:

```bash
node scripts/run_xtend_tests.js surface-side-panel --json
```

## Runtime Contract

`x-side-panel` is the surface for tasks that can live beside or above a primary surface. The modes `docked`, `overlay`, `pinned`, `collapsed`, `fullscreen` and `floating` describe interaction, not just styling. A docked panel shares space with content, an overlay panel needs stack and focus rules, a pinned panel stays visible across navigation, and a collapsed panel must report its state clearly to assistive technology and host logic.

The `xtend.surface.side-panel-runtime.v1` contract keeps these modes from drifting into arbitrary CSS variants. The host passes a panel record to the runtime, and the runtime reflects state, events and visibility back. RMT can declare a panel, but it does not import a panel class or XTend-specific types. The DSL stays descriptive while the host owns DOM, focus and accessibility.

Panel chrome is configurable through `collapsible`, `closable` and `pinnable`. The component reflects those flags into both header controls and generated Surface record capabilities, so a product shell can expose only collapse/expand while rejecting close or pin actions at the SurfaceManager boundary.

## Authoring Rules

A side panel needs a purpose. Good examples are filters, inspectors, detail previews, properties, logs or secondary navigation. Weak examples are generic containers that merely fill layout gaps. The panel record should describe title, mode, initial visibility, preferred width and allowed actions. Actions such as `open`, `close`, `pin`, `collapse` and `resize` are treated as events and must update runtime state.

For `overlay` and `fullscreen`, the panel must cooperate with the Stack Policy. It should not set `aria-hidden`, scroll lock or global Escape behavior on its own. For `docked` and `pinned`, the host must provide stable layout slots so content does not jump. For `collapsed`, the visible trigger must remain unambiguous. These rules keep panel behavior predictable even when windows, modals and overlays are active at the same time.

## Evidence And Review

The `surface-side-panel` gate checks the modes as a runtime contract. Reviewers look at state transitions, event names, focus paths and snapshot compatibility. A failure is critical when a visible panel reacts differently than its record, when a mode exists only as CSS, or when an action is not written back to manager state. An accepted fix makes that chain more explicit.

New panel capabilities need their own evidence. A new mode label without a fixture is not a release signal. A layout or animation change must still respect reduced motion, keyboard navigation and clear host boundaries. That keeps `x-side-panel` an owned surface component rather than a hidden framework drawer.

## Related reading

The controller contract defines how a side panel registers, focuses, collapses, and closes. [Related article](./surface-manager-controller.md)
