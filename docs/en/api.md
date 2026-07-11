# API

The public XTend APIs for loaders, components and host integration.

## What it covers

`api.js` initializes XTend browser feedback and theme APIs. The public entry point is `initXTendAPI(manifest)`; after successful setup, `xtend-api-ready` reports which sub-APIs are available.

## Public building blocks

- `api.js` contains runtime code and writes to `window.XTend`.
- `api.d.ts` types theme, toast, alert, dialog, and modal APIs.
- `components/xstate.js` stores shared UI state.

## Recommended workflow

Import the API explicitly and wait for its ready event:

```js
import { initXTendAPI } from "/api.js";

window.addEventListener("xtend-api-ready", ({ detail }) => {
  if (detail.toast) window.XTend.toast.success("Ready");
}, { once: true });

await initXTendAPI({ "x-toast": "./components/xtoast.js" });
```

A missing module rejects initialization. Inspect the manifest and browser console instead of treating an uninitialized namespace as a successful API.

## Next steps

- [Manifest](./manifest.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
