# XTend Documentation

Welcome to the XTend Developer Center. This documentation is written for developers who want to learn XTend, run it locally, and build their own apps. The recommended path is RMT-first: app shells, routes, surfaces, state, actions, events, and UI lifecycle rules are authored in RMT vNext, while XTend Components, XRouter, Fabric, and host adapters materialize that description in the browser.

Historical planning and release notes are bundled in the [XTend Changelog](./changelog.md). The articles here focus on productive development work.

## Learning Paths

| Goal | Start here |
| --- | --- |
| Start your first local app | [Quick Start Guide](./quick-start-guide.md) |
| Write the full UI in RMT | [RMT vNext Authoring Guide](./rmt-vnext-authoring.md) |
| Understand RMT architecture | [XTendRMT Developer Overview](./xtendrmt-overview.md) |
| Use or build components | [Component Development](./components.md) and [Component Platform](./component-platform.md) |
| Connect loader, manifest, and runtime | [XTend Loader](./xtend-loader.md), [Manifest Format](./manifest.md), [API Integration](./api.md) |
| Understand quality and security | [Best Practices](./best-practices.md), [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md), [Supply-Chain Gates](./supply-chain-gates.md) |

## Start

Begin with a local Web Component app, then grow it into an RMT vNext app shell:

- [Quick Start Guide](./quick-start-guide.md)
- [XTend Loader](./xtend-loader.md)
- [Manifest Format](./manifest.md)
- [Core Migration Guide](./core-migration-guide.md)
- [Enterprise Adoption Guide](./enterprise-adoption.md)

XTend stays framework-neutral. You can start with a simple HTML page, add RMT for shell and routing, and move host-specific details into adapters.

## Write App Shells in RMT

RMT vNext is the primary syntax for new XTend apps. A single `.rmt` source can describe state, selectors, data sources, actions, events, portals, overlays, resources, surfaces, and Fabric lanes.

- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [XTendRMT Developer Overview](./xtendrmt-overview.md)
- [Native RMT Authoring](./xtendrmt-native-authoring.md)
- [XTendRMT App DSL Reference](./xtendrmt-app-dsl.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)
- [Native RMT Migration Guide](./xtendrmt-migration-guide.md)
- [RMT-first XTend Apps](./rmt-first-xtend-apps.md)
- [RMT App Platform Migration Guide](./rmt-app-platform-migration-guide.md)

The RMT vNext reference demo lives in `xtendrmt/rmt-vnext-reference-demo.rmt`; its stable compiler output lives in `xtendrmt/rmt-vnext-reference-demo.core.json`.

## Tooling and Editor DX

The RMT Language Server is the source of truth for diagnostics, completion, hover, document symbols, definition, and code actions. VS Code, JetBrains, Neovim, and Helix can connect to it over stdio.

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
node tools/rmt-language-server/server.js
```

The tooling documentation contract remains `xtend.rmt.tooling-docs.v1`; the related local check is `node scripts/run_xtend_tests.js rmt-tooling-docs --json`.

## Use XTend Components

XTend Components are Web Components mounted, hydrated, and connected by RMT surfaces. Use them as UI building blocks while RMT describes app structure and lifecycle.

- [Component Development](./components.md)
- [Component Platform](./component-platform.md)
- [TypeScript Components](./typescript-components.md)
- [Component UX Authoring](./component-ux-authoring.md)
- [Component Lab](./component-lab.md)
- [Public Component Types](./public-component-types.md)

## Runtime, Fabric, and Surfaces

Fabric runs runtime work in lanes and fibers. RMT describes scheduling and lifecycle intent; the host adapter connects those records to XTend Components, XRouter, and browser DOM.

- [XTend-Fabric Runtime](./xtend-fabric.md)
- [XTend-Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)
- [SurfaceManager RMT Authoring](./surface-manager-rmt-authoring.md)
- [SurfaceManager Controller](./surface-manager-controller.md)
- [SurfaceManager Migration Guide](./surface-manager-migration-guide.md)

## If You Only Read Three Pages

1. [Quick Start Guide](./quick-start-guide.md)
2. [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
3. [Component Development](./components.md)
