# XTendRMT Developer Overview

- Contract: `xtend.docs.xtendrmt-overview.v1`
- Product version: `XTendRMT 0.2.0`

XTendRMT is XTend's declarative app layer. Developers write a readable `.rmt` source; the compiler produces Core records, kernel artifacts, source maps, and adapter handoffs. XTend UI remains the Web Component system, while XTendRMT describes app structure and lifecycle.

## Product Boundary

| Layer | Responsibility |
| --- | --- |
| RMT vNext | App shell, surfaces, state, selectors, actions, events, resources, lanes |
| RMT Kernel | Normalization, scheduling, diagnostics, source maps, kernel records |
| Host Adapter | XTend Components, XRouter, DOM, browser APIs, framework bridges |
| XTend UI | Web Components, styling, accessibility, interaction, visible UI |
| Fabric | Lanes, fibers, telemetry, backpressure, runtime diagnostics |

The kernel stays framework-agnostic. It imports no XTend Components, no XRouter module, no browser APIs, and no host runtime. Anything that needs DOM, routing, component imports, or browser state belongs in adapters.

## Why RMT vNext?

- An app shell comes from one source instead of scattered HTML, legacy JSON, and host code.
- UI objects remain correlatable through primitive IDs, source maps, kernel records, Fabric fibers, and DOM markers.
- State, selectors, actions, data sources, events, portals, overlays, resources, and surfaces are first-class authoring primitives.
- Editor DX comes directly from the Language Server: completion, hover, document symbols, definition, and code actions.
- Legacy and App Platform JSON remain compatible targets, but they are not the normal authoring path.

```text
app.rmt
  -> vNext parser
  -> semantic primitive graph
  -> core document + kernel records
  -> host adapter
  -> XTend Components / XRouter / Fabric
  -> visible app in the browser
```

## Official Developer Docs

| Topic | Document |
| --- | --- |
| First app | [Quick Start Guide](./quick-start-guide.md) |
| vNext app authoring | [RMT vNext Authoring Guide](./rmt-vnext-authoring.md) |
| Native authoring | [XTendRMT Native Authoring Guide](./xtendrmt-native-authoring.md) |
| App DSL reference | [XTendRMT App DSL Reference](./xtendrmt-app-dsl.md) |
| Runtime bridge and adapters | [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md) |
| Editor setup | [RMT Language Server and Editor Setup](./rmt-language-server.md) |

## Local Check

```bash
xt rmt lint app.rmt
node tools/rmt-language-server/server.js
node scripts/run_xtend_tests.js rmt-vnext-parser rmt-vnext-compiler rmt-vnext-tooling --json
```
