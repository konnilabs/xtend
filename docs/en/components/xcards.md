# x-cards

Compact content groups and lists.

## When to use it

x-cards is part of the public XTend component library. Use it when you need a local, themeable Web Component without a framework binding.

## Basic example

```html
<x-cards></x-cards>
```

## Integration

Load the component through `xtend-loader.js` and `components/manifest.json`. For RMT hosts, a component descriptor describes attributes, slots and events; the host adapter materializes the Custom Element.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## Public Runtime Contract

- UX profile: `xtend.component.layout-display-media-ux-profile.v1`.
- State key: `xcards-state-<id>`.
- Purpose: expose the Layout, display and media UX profile to RMT hosts, Fabric lanes and browser-facing tests.
