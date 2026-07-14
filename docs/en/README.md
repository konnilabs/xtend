# XTend Developer Center

Welcome to the XTend Developer Center. These docs explain XTend for developers who want to use Web Components, RMT app shells, local modules and SSR in their own products.

## Learning paths

| Goal | Start |
| --- | --- |
| Build directly with HTML and JavaScript | [XTend Classic](./xtend-classic.md), [Quick Start Guide](./quick-start-guide.md) |
| Understand RMT | [XTendRMT Overview](./xtendrmt-overview.md) |
| Author RMT vNext | [RMT vNext Authoring Guide](./rmt-vnext-authoring.md), [RMT AnimationEngine](./rmt-animation-engine.md), [RMT Reference](./rmt-reference.md), [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md), [RMT vNext Release contract](./rmt-vnext-migration-notes.md), [RMT Syntax Basics](./learn-rmt-syntax-basics.md) |
| Author Native-First XTend | [Native-First Authoring Guide](./native-first-authoring-guide.md), [Native-First RMT Recipes](./native-first-rmt-recipes.md), [Native-First Migration Guide](./native-first-migration-guide.md), [Native-First Release Review](./native-first-release-review.md) |
| Build Maraca app orchestration and PWA output | [XTend Maraca](./xtend-maraca.md), [Maraca Orchestration](./xtend-maraca-orchestration.md) |
| Verify enterprise remote surfaces | [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md), [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md), [RMT vNext Cross Surface Events](./rmt-vnext-cross-surface-events.md), [RMT vNext Enterprise MFE contract](./rmt-vnext-remote-surfaces.md) |
| Use or migrate components | [Component Development](./components.md), [Component Long-Tail Migration](./component-long-tail-migration.md) |
| Build managed workspaces | [SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md), [SurfaceManager Controller](./surface-manager-controller.md), [SurfaceManager Runtime](./surface-manager-runtime.md), [SurfaceManager Migration Guide](./surface-manager-migration-guide.md) |
| Verify Design Tokens | [Design Tokens](./design-tokens.md) |
| Add SSR | [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md), [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) |
| Editor, linting and VS Code | [RMT Linter](./rmt-linter.md), [RMT Language Server](./rmt-language-server.md), [RMT App Platform Tooling](./rmt-app-platform-tooling.md), [RMT Tooling Release Gates](./rmt-tooling-release-gates.md) |
| Instrument and inspect XTend apps in the browser | [XTend DEV API](./xtend-dev-api.md), [XTend Dev Surface](./xtend-dev-surface.md) |
| Verify release surface | [Package Export Lock](./package-export-lock.md), [Type Exports](./type-exports.md), [XTend Loader Types](./xtend-loader-types.md), [XTend API Types](./xtend-api-types.md), [XTend Policy Types](./xtend-policy-types.md), [XTend Builder Types](./xtend-builder-types.md), [XTend Catalog Types](./xtend-catalog-types.md), [XTend Vendor Types](./xtend-vendor-types.md) |
| Verify release evidence | [Release Readiness](./release-verification.md), Previous Release Bridge, [Release Acceptance](./release-verification.md), [Conditional Network Evidence](./conditional-network-evidence.md), [Conditional Network Evidence CI](./conditional-network-evidence-ci.md), [Release Report Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md), [Readiness CI Bundle](./release-verification.md) |

```txt
conditional network ci: xtend.epic13.conditional-network-evidence-ci.v1
release pack evidence: xtend.epic13.release-report-pack-dry-run-evidence.v1
previous release bridge: prior local release bridge
previous release bridge path: ./release-verification.md
```

## Product model

XTend UI provides the visible Web Components. XTendRMT describes app shells, state, actions, events, resources, surfaces, hydration, validation and surface transitions. Fabric coordinates runtime work; the RMT kernel adds scheduler lanes, fibers and telemetry. [XTend Classic](./xtend-classic.md) delivers directly authored HTML and JavaScript through a local runtime manifest and `xtend-loader.js`. Maraca builds loaderless, kernel-orchestrated ESM apps from `.rmt` sources with bundle reports, browser bridges, mobile Web App Manifest output, optional PWA Service Worker scaffolding and strict contract gates. Both are supported delivery paths over the same public component contracts.

## Choose A Delivery Path

Choose XTend Classic for HTML-/JavaScript-first pages, dynamic catalogs and progressive enhancement without an XTend-required application build. Choose [XTend Maraca](./xtend-maraca.md) when RMT source should become a shipped app bundle with an inline registry, kernel scheduling, SSR/hydration, validation, surface transitions, a mobile manifest, a generated app-shell Service Worker or build evidence. Project size alone does not decide between the paths.

## RMT vNext Release Surface

The RMT vNext Authoring Guide, RMT vNext Migration Notes and RMT vNext Release contract belong together. The release path points at `xtendrmt/rmt-vnext-reference-demo.rmt` and `xtendrmt/rmt-vnext-reference-demo.core.json`, so an integrator can review the authoring example, compiler output and gate matrix in one pass.

## RMT vNext Enterprise Surface

RMT vNext Remote Surfaces, RMT vNext Enterprise Surface Registry, RMT vNext Cross Surface Events and RMT vNext Enterprise MFE contract describe the Enterprise MFE path through `rmt-vnext-enterprise-mfe-ready`. The path remains network-free to verify: remote manifests, surface registry, cross-surface events and browser-smoke artifacts are local fixtures.

## Tooling

```bash
npm run dev:local
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --css external --json
xt maraca build app.rmt --out dist --web-app-manifest --json
xt maraca build app.rmt --out dist --pwa --json
node tools/rmt-language-server/server.js
node scripts/run_xtend_tests.js rmt-tooling-docs --json
node scripts/run_xtend_tests.js maraca-docs rmt-vnext-tooling rmt-editor-packaging type-exports-rmt --json
```

The tooling path uses the public schema `xtend.rmt.tooling-docs.v1`. For orchestrated Maraca apps, `xtend.rmt.app-orchestration.v1`, `xtend.rmt.form-validation.v1` and `xtend.rmt.surface-transitions.v1` are also relevant.

## Next steps

- [Quick Start Guide](./quick-start-guide.md)
- [XTend Classic](./xtend-classic.md)
- [XTend Dev Surface](./xtend-dev-surface.md)
- [XTend DEV API](./xtend-dev-api.md)
- [XTend Maraca](./xtend-maraca.md)
- [Maraca Orchestration](./xtend-maraca-orchestration.md)
- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT AnimationEngine](./rmt-animation-engine.md)
- [RMT Reference](./rmt-reference.md)
- [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT vNext Release contract](./rmt-vnext-migration-notes.md)
- [Native-First Authoring Guide](./native-first-authoring-guide.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [Native-First Migration Guide](./native-first-migration-guide.md)
- [Native-First Release Review](./native-first-release-review.md)
- [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [RMT vNext Cross Surface Events](./rmt-vnext-cross-surface-events.md)
- [RMT vNext Enterprise MFE contract](./rmt-vnext-remote-surfaces.md)
- [Best Practices](./best-practices.md)
- [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
- [Visual Snapshot Automation](./visual-snapshot-automation.md)
- [Coordinate Parsedown with RMT](./xtendrmt-parsedown-scheduling.md)
- [Changelog](./changelog.md)
