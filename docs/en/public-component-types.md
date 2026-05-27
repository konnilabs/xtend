# Public Component Types

TypeScript surfaces for attributes, events and component contracts.

## What it covers

Public Component Types documents the core path through local modules, public TypeScript surfaces and verifiable host wiring.
The page is the public handrail for teams that consume XTend from TypeScript, Lit, React wrappers or plain Web Component hosts.

```txt
docs contract: xtend.docs.public-component-types.v1
type contract: xtend.enterprise.er-wp-34.public-component-types.v1
shared helper: components/xtend-public-types.d.ts
local gate: npm run test:component-public-types
runner id: component-public-types
```

## Public building blocks

- Component `.d.ts` files next to each runtime module.
- Shared helper types from `components/xtend-public-types.d.ts`.
- Typed event detail maps for emitted DOM events.
- Attribute and property contracts that wrappers should pass through.

Use the component-local declarations first, then fall back to the shared helper types when a host needs generic event or metadata handling. Utility modules such as `x-utils` expose an exported API instead of an element instance, while visual components expose HTMLElement-compatible types.

## Recommended workflow

Read the declaration beside the component source, import the event detail type you need and keep wrappers aligned with the documented attributes, events and methods. Run `npm run test:component-public-types` before publishing a host integration so missing declarations are caught before docs and examples drift apart.

```ts
import type { XButtonElement, XButtonClickDetail } from '../components/xbutton';

const button = document.querySelector<XButtonElement>('x-button');
button?.addEventListener('x-button-click', (event: CustomEvent<XButtonClickDetail>) => {
  console.log(event.detail.variant);
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

## Public contract

Public Component Types is the public reference contract for `docs/en/public-component-types.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: public files, package exports, manifest keys, attributes and host wiring.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/public-component-types.md`
- `docs/menu.json`
- `package.json`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `design-tokens/xtend-design-tokens.js`

Names:
- `components/xtend-public-types.d.ts`
- `docs/en/public-component-types.md`
- `docs/menu.json`
- `components/manifest.json`
- `design-tokens/xtend-design-tokens.js`
- `docs/dev-router.php`
- `.d.ts`
- `package.json`
- `xtend-loader.js`
- `api.js`

Commands:
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If a host loads nothing, check the manifest path, export name, attribute spelling and local file reachability.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
