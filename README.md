# XTend

XTend is a native-first Web Component, XTendRMT, Fabric and Maraca app orchestration toolkit.

It is built for teams that want browser-native primitives, owned UI components, auditable contracts and a path from small HTML hosts to declarative RMT-driven app shells without adopting a heavyweight UI framework.

## What Is Included

| Package | Use it for |
| --- | --- |
| `@ccslabs/xtend` | The complete XTend stack: loader, UI components, XTendRMT, Fabric, Maraca, CLI, compiler and docs. |
| `@ccslabs/xtend-rmt` | XTendRMT runtime, browser bundle, core types and schema. |
| `@ccslabs/xtend-fabric` | Runtime lanes, hydration policy helpers and RMT lane mapping. |
| `@ccslabs/xtend-maraca` | RMT-to-app planning, bundling, hydration, transitions and source-to-sea build orchestration. |
| `@ccslabs/xtend-cli` | Scaffold and builder commands. |
| `@ccslabs/xtend-compiler` | RMT compiler, parser, linter and language-server tooling. |

## Install

```bash
npm install @ccslabs/xtend
```

For a local checkout:

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

The loader reads `components/manifest.json`, loads the requested custom elements and keeps the default runtime path local.

## XTendRMT

XTendRMT describes an app shell in `.rmt` source. State, selectors, actions, events, resources, surfaces and scheduling live in one document, then compile into records that host adapters can connect to XTend UI, XRouter, Fabric and browser APIs.

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
node tools/rmt-language-server/server.js
```

Recent RMT gates cover action/effect/data/resource primitives, complete UI recipes, DOM descriptor proofs, owned data display primitives and command/search primitives.

## Maraca

Maraca turns RMT source into build plans and runtime bundles. It can plan, bundle, validate hydration policy, wire transitions and emit source-to-sea evidence for CI.

```bash
xt maraca plan app.rmt --json
xt maraca build app.rmt --out dist --profile production --lazy route --css inline --hydration auto --transitions auto --json
xt rmt build app.rmt --bundle maraca --hydration auto --transitions auto --out dist --json
```

## Native-First Mission

XTend prefers browser-native primitives, owned framework components and explicit contracts. The current 0.3.1 gate surface focuses on:

- native dialog, popover, focus, form, navigation and media behavior before framework abstraction
- owned component primitives for collection views, data display, command sources and search sources
- auditable contracts and runtime parity checks for component, RMT and package surfaces
- dependency-minimal CI evidence that can be reproduced locally

## Documentation

The Developer Center lives in `docs/de` and `docs/en`.

- German start page: `docs/de/README.md`
- English start page: `docs/en/README.md`
- Quick Start: `docs/en/quick-start-guide.md`
- RMT overview: `docs/en/xtendrmt-overview.md`
- RMT actions, events, data and resources: `docs/en/learn-rmt-actions-events-data-resources.md`
- Native-First RMT recipes: `docs/en/native-first-rmt-recipes.md`
- Component reference: `docs/en/components.md`

## Local Gates

Use these before opening or publishing a release candidate:

```bash
npm run test:native-first-rmt-owned-release:report
npm run test:pr:report
npm run test:release:full:report
npm run release:sync-versions:check
npm run pack:dry-run
```

The public docs quality audit is still tracked as an owner handoff through `rmt-ui-maximality-owned-surface-gate-hygiene` until the remaining legacy findings are closed.

Release metadata is anchored in `package.json#xtend`, including `xtend.epic13PackageExportLock` for the published package surface and TypeExports drift gates.

## Publishing

GitHub Releases can publish `@ccslabs/xtend` to npm with provenance. The publish workflow re-runs release evidence, package dry runs, conditional network evidence and the Native-First/RMT-Owned aggregate before `npm publish --tag latest --provenance --access public`.

## License

XTend is licensed under the Apache License 2.0. See `LICENSE` for details.
