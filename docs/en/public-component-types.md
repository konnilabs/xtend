# Public Component Types

TypeScript surfaces for attributes, events and component contracts.

## What it covers

Every public component has a declaration next to its browser runtime. These types mirror attributes, properties, methods, and event-detail maps so wrappers can preserve the Web Component contract without shadow-DOM knowledge.

## Public building blocks

- `components/xtend-public-types.d.ts` contains shared event and contract helpers.
- `components/<name>.d.ts` describes each concrete element.
- `components/manifest.json` connects the same tag to its runtime file.

## Recommended workflow

Read the component-local declaration first and import only the required element or event type. Verify wrappers with `npm run test:component-public-types`; a type must not promise a method absent from emitted runtime.

```ts
import type { XToggleElement, XToggleEventMap } from '../components/xtoggle';

const toggle = document.querySelector<XToggleElement>('x-toggle');
toggle?.addEventListener('toggle-changed', (event: XToggleEventMap['toggle-changed']) => {
  console.log(event.detail.checked);
});
```

## Troubleshooting

- If TypeScript cannot find a component type, check that the component has a sibling `.d.ts` file and that the package export points at the local module.
- If an event detail is `unknown`, use the component-specific event map or the shared helper from `components/xtend-public-types.d.ts`.
- If a wrapper hides attributes, mirror the public HTML attribute names rather than inventing private prop names.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
