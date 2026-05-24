# Quick Start Guide

Start locally, load components and grow the page into an RMT app shell.

## What it covers

This article is written for developers who want to use XTend productively without internal project knowledge.

## Public building blocks

- Local development without a CDN.
- Bilingual documentation.
- Stable public entry points.
## Minimal HTML

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

## Recommended workflow

Run the local server with `npm run dev:local`, open a small HTML page and move recurring app structure into RMT later.

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
- [Enterprise Adoption](./enterprise-adoption.md)
