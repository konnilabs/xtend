# x-input

Text, search and numeric input.

## When to use it

x-input is part of the public XTend component library. Use it when you need a local, themeable Web Component without a framework binding.

## Basic example

```html
<x-input></x-input>
```

## Integration

Load the component through `xtend-loader.js` and `components/manifest.json`. For RMT hosts, a component descriptor describes attributes, slots and events; the host adapter materializes the Custom Element.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## Public Runtime Contract

- UX profile: `xtend.component.form-control-ux-profile.v1`.
- State key: `xinput-value-<id>`.
- Purpose: expose the Form control UX profile to RMT hosts, Fabric lanes and browser-facing tests.
