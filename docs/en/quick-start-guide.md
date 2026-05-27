# Quick Start Guide

Start locally, load components and grow the page into an RMT app shell.

## What it covers

This article is written for developers who want to use XTend productively without internal project knowledge.

## Public building blocks

- Local development without a CDN.
- Bilingual documentation.
- Stable public entry points.
- Maraca as the later bundle and orchestration path for real RMT apps.
## Minimal HTML

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

## Recommended workflow

Run the local server with `npm run dev:local`, open a small HTML page and move recurring app structure into RMT later. Once state, actions or surface changes become part of the product, [XTend Maraca](./xtend-maraca.md) is the next production path: `app.rmt` becomes an ESM bundle instead of a page assembled only by the runtime loader.

## Check RMT

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
node tools/rmt-language-server/server.js
```

Use the `rmt-app` snippet when you start a new shell file in your editor.
After that, [RMT Linter](./rmt-linter.md) and
[RMT Language Server](./rmt-language-server.md) provide diagnostics,
completion and Code Actions.

For server-side rendering, use the [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md)
or the [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md).

## Next steps

- [About XTend](./about.md)
- [XTend Maraca](./xtend-maraca.md)
- [Maraca Orchestration](./xtend-maraca-orchestration.md)
- [Enterprise Adoption](./enterprise-adoption.md)

## Public contract

Quick Start Guide is the public orientation contract for `docs/en/quick-start-guide.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: entry routes, local docs navigation and the smallest runnable commands.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/quick-start-guide.md`
- `docs/menu.json`
- `package.json`
- `README.md`
- `docs/de/quick-start-guide.md`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`

Names:
- `docs/en/quick-start-guide.md`
- `docs/menu.json`
- `docs/de/quick-start-guide.md`
- `components/manifest.json`
- `docs/dev-router.php`
- `docs/en/xtend-maraca.md`
- `docs/en/xtend-maraca-orchestration.md`
- `package.json`
- `README.md`
- `xtend-loader.js`
- `api.js`
- `npm run dev:local`

Commands:
- `xt rmt lint app.rmt`
- `xt rmt lint app.rmt --json`
- `xt rmt lint app.rmt --agent`
- `node tools/rmt-language-server/server.js`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
node tools/rmt-language-server/server.js
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If entry paths drift, check `docs/menu.json`, local links and the command in the verification block first.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
