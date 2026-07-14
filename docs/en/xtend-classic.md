# XTend Classic

XTend Classic is the productive HTML- and JavaScript-first delivery path for XTend Web Components. A host keeps its authored HTML, loads the local `components/manifest.json` through `xtend-loader.js`, and lets the browser register components without an XTend application build.

“No application build required” means that XTend does not require Maraca, the compiler, or the CLI to deliver the page. A host may still use its own bundler, TypeScript, local server, or optional XTend tooling. Classic is not a legacy mode: only `xtend-dev.js` and the `./legacy-loader` export are legacy compatibility surfaces.

## Choose Classic or Maraca

| XTend Classic | XTend Maraca |
| --- | --- |
| HTML- and JavaScript-first | RMT- and build-first |
| Runtime manifest with `xtend-loader.js` | Static inline registry in a generated ESM bundle |
| No XTend application build required | Plan, build, tune, and evidence pipeline |
| Dynamic catalogs and progressive enhancement | Optimized app graphs, SSR/hydration, PWA, and production reports |

Both paths use the same public Web Component contracts. Choose Classic for directly authored sites, documentation, progressive enhancement, dynamic component catalogs, or hosts that deliberately own their runtime composition. Choose [XTend Maraca](./xtend-maraca.md) when an RMT document should become a compiler-selected application bundle with build evidence.

## Minimal Classic host

Preload only the components required in the first viewport. The loader discovers deeper manifest-backed elements and loads them as they approach the viewport.

```html
<meta name="xtend-preload" content="xstate,x-theme,x-header,x-hero">
<script type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json"></script>

<x-hero>
  <h1>Hello XTend Classic</h1>
</x-hero>
<x-section label="Loaded near the viewport"></x-section>
```

The manifest remains the host-controlled allowlist. Unknown tags stay undefined, while refused protocols, origins, paths, or extensions produce explicit loader diagnostics instead of a remote fallback.

## JavaScript and dynamic content

`window.__XTendLoaderBootPromise` exposes initial boot completion. Use the public loader API when JavaScript adds a known component after boot:

```js
await window.__XTendLoaderBootPromise;

const region = document.querySelector('[data-dynamic-region]');
const button = document.createElement('x-button');
button.setAttribute('label', 'Continue');
region.append(button);
await window.XTendLoader.hydrateTree(region);
await customElements.whenDefined('x-button');
```

Prefer structured DOM operations for untrusted or variable content. Free HTML strings still require the documented Trusted DOM and sanitizing boundaries; Classic does not weaken security policy.

## Optional DEV API

Development hosts can ask the same loader to install the read-only Classic diagnostics adapter:

```html
<script type="module"
  src="/xtend-loader.js"
  data-manifest="/components/manifest.json"
  data-dev-api="true"></script>
```

This exposes `window.__XTEND_DEV_API__` without another script tag or monkeypatching. Loader and browser performance measurements are real; Fabric, RMT Kernel, and SSR hydration report `supported: false` when those runtimes are not active.

## Production checklist

- Keep the loader, manifest, component modules, styles, and image assets same-origin or explicitly host-approved.
- Preload the complete first-viewport component set and leave below-the-fold components lazy.
- Wait for public readiness promises before calling component methods.
- Test keyboard behavior, reduced motion, layout stability, import refusal, and missing optional capabilities.
- Enable the DEV API only for hosts that should expose local diagnostics.
- Use documented attributes, events, slots, CSS parts, types, and globals; private shadow DOM remains internal.

## Technical references

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader Types](./xtend-loader-types.md)
- [XTend DEV API](./xtend-dev-api.md)
- [Design Tokens](./design-tokens.md)
