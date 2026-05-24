# XTend

XTend is a local-first Web Component and RMT toolkit for building framework-neutral web applications. It gives you a manifest-based component loader, a library of XTend UI custom elements, XTendRMT for declarative app shells, and Fabric for coordinated runtime work.

Use XTend when you want browser-native UI primitives, local module loading, typed component contracts and a path from simple HTML pages to RMT-driven app shells without depending on a CDN.

## Packages

| Package | Use it for |
| --- | --- |
| `@ccslabs/xtend` | The complete XTend stack: loader, UI components, RMT, Fabric, CLI, compiler and docs. |
| `@ccslabs/xtend-rmt` | XTendRMT runtime, browser bundle, core types and schema. |
| `@ccslabs/xtend-fabric` | Runtime lanes, hydration policy helpers and RMT lane mapping. |
| `@ccslabs/xtend-cli` | Scaffold and builder commands. |
| `@ccslabs/xtend-compiler` | RMT compiler, parser, linter and language-server tooling. |

## Install

```bash
npm install @ccslabs/xtend
```

For a local checkout, install dependencies and start the development server:

```bash
npm install
npm run dev:local
```

## Minimal Browser Host

```html
<script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>

<x-section label="Quick Start">
  <h1>Hello XTend</h1>
  <x-button variant="primary">Start</x-button>
</x-section>
```

The loader reads `components/manifest.json`, loads the requested custom elements and keeps the default path local.

## RMT App Shells

XTendRMT lets you describe an app shell in a readable `.rmt` source: state, selectors, actions, events, resources, surfaces and scheduling live in one document. Host adapters connect the compiled records to XTend UI, XRouter, Fabric and browser APIs.

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
node tools/rmt-language-server/server.js
```

## Documentation

The Developer Center is bilingual and lives in `docs/de` and `docs/en`:

- German start page: `docs/de/README.md`
- English start page: `docs/en/README.md`
- Quick Start: `docs/en/quick-start-guide.md`
- RMT overview: `docs/en/xtendrmt-overview.md`
- Component reference: `docs/en/components.md`

## Local Checks

```bash
npm run test:docs-public-quality
npm run test:docs-rmt-pilot
npm run test:docs-php-ssr-prehydration
npm run test:rmt-tooling-docs
```

## License

XTend is licensed under the Apache License 2.0. See `LICENSE` for details.
