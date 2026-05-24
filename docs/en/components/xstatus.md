# x-status

Status lines and system signals.

## When to use it

x-status is part of the public XTend component library. Use it when you need a local, themeable Web Component without a framework binding.

## Basic example

```html
<x-status></x-status>
```

## Integration

Load the component through `xtend-loader.js` and `components/manifest.json`. For RMT hosts, a component descriptor describes attributes, slots and events; the host adapter materializes the Custom Element.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## Public Runtime Contract

- UX profile: `xtend.component.feedback-status-ux-profile.v1`.
- State key: `xstatus-state-<id>`.
- Purpose: expose the Feedback and status UX profile to RMT hosts, Fabric lanes and browser-facing tests.
