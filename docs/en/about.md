# About XTend

XTend is a local, framework-neutral application framework for Web Components, declarative RMT applications, and controlled extensions. It is intended for teams that do not want UI building blocks, scheduling, hydration, and diagnostics to become unrelated systems.

## The layers at a glance

The lowest public layer consists of custom elements registered in `components/manifest.json`. They work directly in HTML and expose attributes, events, slots, CSS parts, and TypeScript declarations. `xtend-loader.js` registers those components from a local manifest.

XTend Fabric schedules mount, hydration, interaction, and diagnostics work in lanes and fibers. RMT describes applications as compileable documents; its parser and compiler produce a core document consumed by browser and SSR adapters. Maraca builds on that contract to orchestrate a deployable application.

## What is stable

Public exports in `package.json`, declarations such as `api.d.ts`, component contracts, and documented schemas are integration surfaces. Private shadow DOM nodes, internal scheduler data structures, and generated intermediate artifacts are not.

XTensions extend hosts through explicit contracts. The [XTend Dev Surface](./xtend-dev-surface.md) reads diagnostics only from `window.__XTEND_DEV_API__`; it does not identify unrelated pages through heuristics or patch a framework runtime.

## Common entry points

- An existing HTML page starts with the [Quick Start](./quick-start-guide.md) and one component.
- A declarative application starts with [Learn RMT](./learn-rmt.md) and the playground.
- A reusable host plug-in starts with the [XTensions Authoring Guide](./xtensions-authoring-guide.md).
- A team responsible for releases uses [Release Verification](./release-verification.md) to interpret reports and gates.

## Boundaries and failure behavior

XTend does not fetch its runtime from a CDN or execute arbitrary remote modules. Import, capability, and integrity decisions belong to the host. If an optional surface or XTension cannot load, the host should expose a documented fallback; a kernel panic or failed integrity check must never be presented as success.

The most useful next step is a small local example. Confirm the loader, manifest, and one component before introducing RMT, Fabric lanes, or remote-surface policy.
