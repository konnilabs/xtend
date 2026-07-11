# TypeScript Components

How XTend components are typed, documented and tested.

## What it covers

XTend develops stable components TypeScript-first. Editable source lives under `src/components/<tag>/`; `tsc` emits browser runtime and a sibling `.d.ts` file under `components/`.

## Public building blocks

- The main source implements the element, properties, and lifecycle.
- `*.contract.ts`, `*.rmt.ts`, `*.a11y.ts`, and `*.performance.ts` keep separate contracts.
- `components/manifest.json` registers the generated local runtime path only.

## Recommended workflow

A host consumes the emitted declaration rather than internal build types:

```ts
import type { XToggleElement } from "@ccslabs/xtend/components/xtoggle";

const toggle = document.querySelector<XToggleElement>("x-toggle");
toggle?.addEventListener("toggle-changed", (event) => {
  console.log(event.detail.checked);
});
```

Change source, declaration, fixture, and component article together. A manual patch to `components/*.js` alone is overwritten by the next build.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
