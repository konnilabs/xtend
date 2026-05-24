# x-drawer

Side navigation and supporting panels.

## When to use it

x-drawer is part of the public XTend component library. Use it when you need a local, themeable Web Component without a framework binding.

## Basic example

```html
<x-drawer></x-drawer>
```

## Integration

Load the component through `xtend-loader.js` and `components/manifest.json`. For RMT hosts, a component descriptor describes attributes, slots and events; the host adapter materializes the Custom Element.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## Public Runtime Contract

- UX profile: `xtend.component.overlay-interaction-ux-profile.v1`.
- State key: `xdrawer-open-<id>`.
- Purpose: expose the Overlay and interaction UX profile to RMT hosts, Fabric lanes and browser-facing tests.
