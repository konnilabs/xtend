# x-textarea

Multi-line input.

## When to use it

x-textarea is part of the public XTend component library. Use it when you need a local, themeable Web Component without a framework binding.

## Basic example

```html
<x-textarea></x-textarea>
```

## RMT Editor With Highlighting

For code input, `x-textarea` can use Prism.js. Its token colors match `x-code`, so editable and read-only code surfaces look consistent inside the Dev Center.

```html
<x-textarea syntax-highlight lang="rmt" rows="18">
template demo.playground {
  surface preview.card kind card component x-status {
    lane visible weight 80 {
      hydrate preview-card
    }
  }
}
</x-textarea>
```

## Integration

Load the component through `xtend-loader.js` and `components/manifest.json`. For RMT hosts, a component descriptor describes attributes, slots and events; the host adapter materializes the Custom Element.

## Next steps

- [Component development](../components.md)
- [Public Component Types](../public-component-types.md)
- [RMT Component Primitives](../rmt-vnext-component-primitives.md)

## Public Runtime Contract

- UX profile: `xtend.component.form-control-ux-profile.v1`.
- State key: `xtextarea-value-<id>`.
- Purpose: expose the Form control UX profile to RMT hosts, Fabric lanes and browser-facing tests.
