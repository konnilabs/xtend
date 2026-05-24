# xstate

Small state store for XTend hosts.

## When to use it

xstate is part of the public XTend component library. Use it when you need a local, themeable Web Component without a framework binding.

## Basic example

```js
window.xstate.set('demo.count', 1);
const value = window.xstate.get('demo.count');
```

## Integration

Load the component through `xtend-loader.js` and `components/manifest.json`. For RMT hosts, a component descriptor describes attributes, slots and events; the host adapter materializes the Custom Element.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)
