# XTend Loader

The local ES module loader for manifest-based Web Components.

## What it covers

`xtend-loader.js` loads the local manifest, registers required custom elements, and records load and define measurements. Its API lives at `window.XTendLoader`; `window.__XTendLoaderBootPromise` exposes boot completion.

## Public building blocks

- `window.XTendLoader.ensureComponent(tag)` loads one known tag on demand.
- `window.XTendLoader.hydrateTree(root)` discovers undefined tags in a subtree.
- `xtend-loader.d.ts` documents loader, style-registry, and skeleton APIs.

## Recommended workflow

Include the loader once and set an explicit manifest path:

```html
<script src="/xtend-loader.js"
  data-manifest="/components/manifest.json"></script>
<x-button label="Continue"></x-button>
<script type="module">
  await window.__XTendLoaderBootPromise;
  await window.XTendLoader.ensureComponent("x-button");
</script>
```

A `xtend.loader.import.refused` diagnostic means protocol, origin, or extension was rejected. Change the manifest source; do not bypass policy with a second dynamic import.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [Design Tokens](./design-tokens.md)
