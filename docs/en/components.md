# Component Development

XTend components are local custom elements for classic HTML pages and RMT hosts. Every stable component has a runtime file under `components/`, a TypeScript declaration, and an entry in `components/manifest.json`.

## Choose a component

Start with the user problem, not the tag name. Form controls such as `x-input` and `x-toggle` expose validation and form-association contracts. Navigation elements such as `x-menu` and `x-tabs` define keyboard and current-state behavior. Surface components coordinate windows, panels, or overlays through a controller.

Individual references document attributes, events, methods, slots, CSS parts, and custom properties from source. Shadow DOM structures not listed there are private.

## Use a component in HTML

The loader registers only components present in the local manifest:

```html
<script type="module" src="/xtend-loader.js"
  data-manifest="/components/manifest.json"></script>

<x-button variant="primary" label="Save"></x-button>
```

For dynamic loading, wait for `customElements.whenDefined('x-button')` before calling methods. Subscribe to events on the custom element, not on generated internal controls.

## Use a component from RMT

RMT materializes components through DOM descriptors. Attributes become properties or attributes, and public DOM events become declarative commands. The `xtend.rmt.component-contract.v1` contract keeps this boundary framework-neutral; the RMT kernel does not import component classes.

## Styling and accessibility

Change design tokens first, then documented CSS custom properties and parts. Preserve accessible names, focus management, live regions, and error messages. Each component reference identifies keyboard and validation behavior; a wrapper must pass those signals through.

## Continue learning

- [Public Component Types](./public-component-types.md) explains shared event and element types.
- [TypeScript Components](./typescript-components.md) covers the TypeScript-first build path.
- [Design Tokens](./design-tokens.md) describes the stable theme boundary.
- [RMT Component Primitives](./rmt-vnext-component-primitives.md) connects components to declarative surfaces.
