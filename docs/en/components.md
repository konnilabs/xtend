# Component Development

XTend Web Components as stable UI building blocks for HTML and RMT hosts.

## What it covers

XTend components are Custom Elements with stable attributes, events, slots and CSS parts. They can be used directly in HTML or through RMT descriptors.

## Public building blocks

- Custom Elements.
- Attributes, events, slots and CSS parts.
- RMT Component Descriptoren.

## Recommended workflow

Use components directly in HTML for simple hosts. As an app grows, let RMT descriptors materialize components and keep events typed.

## Next steps

- [Public Component Types](./public-component-types.md)
- [TypeScript Components](./typescript-components.md)

## Public contract

Component Development is the public reference contract for `docs/en/components.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: public files, package exports, manifest keys, attributes and host wiring.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/components.md`
- `docs/menu.json`
- `package.json`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `design-tokens/xtend-design-tokens.js`

Names:
- `docs/en/components.md`
- `docs/menu.json`
- `components/manifest.json`
- `design-tokens/xtend-design-tokens.js`
- `docs/dev-router.php`
- `package.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `x-theme`

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
