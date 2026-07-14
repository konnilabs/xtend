# Quick Start Guide

Start locally with XTend Classic, load components, and choose Maraca only when the delivery requirements call for a compiled RMT app.

## What it covers

This article is written for developers who want to use XTend productively without internal project knowledge.

## Public building blocks

- Local development without a CDN.
- Bilingual documentation.
- Stable public entry points.
- XTend Classic as the supported HTML-/JavaScript-first delivery path.
- Maraca as the parallel compiled path for RMT, SSR/hydration, PWA output, and build evidence.
## Minimal HTML

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

## Recommended workflow

Run the local server with `npm run dev:local` and open a small XTend Classic HTML page. Classic does not require an XTend application build, but it can coexist with a host bundler, TypeScript, a local server, or optional CLI tooling. Choose [XTend Maraca](./xtend-maraca.md) when `.rmt` source should become an optimized ESM bundle with SSR/hydration, PWA policy, or auditable build evidence—not merely because the page grows.

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
- [XTend Classic](./xtend-classic.md)
- [XTend Maraca](./xtend-maraca.md)
- [Maraca Orchestration](./xtend-maraca-orchestration.md)
- [Enterprise Adoption](./enterprise-adoption.md)
