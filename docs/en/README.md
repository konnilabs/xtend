# XTend Developer Center

Welcome to the XTend Developer Center. These docs explain XTend for developers who want to use Web Components, RMT app shells, local modules and SSR in their own products.

## Learning paths

| Goal | Start |
| --- | --- |
| First local page | [Quick Start Guide](./quick-start-guide.md) |
| Understand RMT | [XTendRMT Overview](./xtendrmt-overview.md) |
| Author RMT vNext | [RMT vNext Authoring Guide](./rmt-vnext-authoring.md), [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md), [RMT vNext Release contract](./rmt-vnext-release-handoff.md), [RMT Syntax Basics](./learn-rmt-syntax-basics.md) |
| Author Native-First XTend | [Native-First Authoring Guide](./native-first-authoring-guide.md), [Native-First RMT Recipes](./native-first-rmt-recipes.md), [Native-First Migration Guide](./native-first-migration-guide.md), [Native-First Release Review](./native-first-release-review.md) |
| Build Maraca app orchestration | [XTend Maraca](./xtend-maraca.md), [Maraca Orchestration](./xtend-maraca-orchestration.md) |
| Verify enterprise remote surfaces | [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md), [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md), [RMT vNext Cross Surface Events](./rmt-vnext-cross-surface-events.md), [RMT vNext Enterprise MFE contract](./rmt-vnext-enterprise-mfe-handoff.md) |
| Use components | [Component Development](./components.md) |
| Verify Design Tokens | [Design Tokens](./design-tokens.md) |
| Add SSR | [RMT Node SSR Adapter](./rmt-node-ssr-adapter.md), [RMT PHP/Laravel SSR Adapter](./rmt-php-ssr-adapter.md) |
| Editor, linting and VS Code | [RMT Linter](./rmt-linter.md), [RMT Language Server](./rmt-language-server.md), [RMT App Platform Tooling](./rmt-app-platform-tooling.md) |
| Verify release surface | [Package Export Lock](./package-export-lock.md), [Type Exports](./type-exports.md), [XTend Loader Types](./xtend-loader-types.md), [XTend API Types](./xtend-api-types.md), [XTend Policy Types](./xtend-policy-types.md), [XTend Builder Types](./xtend-builder-types.md), [XTend Catalog Types](./xtend-catalog-types.md), [XTend Vendor Types](./xtend-vendor-types.md) |
| Verify release evidence | [Release Readiness](./rc1-readiness.md), Previous Release Bridge, [Release Acceptance](./release-owner-acceptance.md), [Conditional Network Evidence](./conditional-network-evidence.md), [Conditional Network Evidence CI](./conditional-network-evidence-ci.md), [Release Report Pack Dry Run Evidence](./release-report-pack-dry-run-evidence.md), [Readiness CI Bundle](./rc1-gate-matrix-ci-handoff.md) |

```txt
conditional network ci: xtend.epic13.conditional-network-evidence-ci.v1
release pack evidence: xtend.epic13.release-report-pack-dry-run-evidence.v1
previous release bridge: prior local release bridge
previous release bridge path: ./epic12-rc0-handoff.md
```

## Product model

XTend UI provides the visible Web Components. XTendRMT describes app shells, state, actions, events, resources, surfaces, hydration, validation and surface transitions. Fabric coordinates runtime work; the RMT kernel adds scheduler lanes, fibers and telemetry. The loader connects manifest-based hosts locally and without a CDN; Maraca builds loaderless, kernel-orchestrated ESM apps from `.rmt` sources with bundle reports, browser bridges and strict contract gates.

## Maraca In The Main Path

Maraca is the production app orchestrator in the XTend stack. Use the learning path to understand RMT documents, then move to [XTend Maraca](./xtend-maraca.md) when that document needs to become a shipped app bundle with an inline registry, kernel scheduling, hydration, validation and surface transitions. The real orchestration fixture lives at `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`; the deep dive explains which contracts the build exposes in the browser and the report.

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
node tools/rmt-language-server/server.js
node scripts/run_xtend_tests.js rmt-tooling-docs --json
node scripts/run_xtend_tests.js maraca-docs rmt-vnext-tooling rmt-editor-packaging type-exports-rmt --json
```

The tooling path uses the public schema `xtend.rmt.tooling-docs.v1`. For orchestrated Maraca apps, `xtend.rmt.app-orchestration.v1`, `xtend.rmt.form-validation.v1` and `xtend.rmt.surface-transitions.v1` are also relevant.

## Next steps

- [Quick Start Guide](./quick-start-guide.md)
- [XTend Maraca](./xtend-maraca.md)
- [Maraca Orchestration](./xtend-maraca-orchestration.md)
- [RMT vNext Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT vNext Release contract](./rmt-vnext-release-handoff.md)
- [Native-First Authoring Guide](./native-first-authoring-guide.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [Native-First Migration Guide](./native-first-migration-guide.md)
- [Native-First Release Review](./native-first-release-review.md)
- [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [RMT vNext Enterprise Surface Registry](./rmt-vnext-surface-registry-enterprise.md)
- [RMT vNext Cross Surface Events](./rmt-vnext-cross-surface-events.md)
- [RMT vNext Enterprise MFE contract](./rmt-vnext-enterprise-mfe-handoff.md)
- [Best Practices](./best-practices.md)
- [Trusted DOM and Sanitizing](./trusted-dom-sanitizing.md)
- [Changelog](./changelog.md)

## Public contract

XTend Developer Center is the public orientation contract for `docs/en/README.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: entry routes, local docs navigation and the smallest runnable commands.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/README.md`
- `docs/menu.json`
- `package.json`
- `README.md`
- `docs/de/quick-start-guide.md`
- `docs/en/quick-start-guide.md`
- `components/manifest.json`
- `xtend-loader.js`

Names:
- `docs/en/README.md`
- `docs/menu.json`
- `docs/de/quick-start-guide.md`
- `docs/en/quick-start-guide.md`
- `docs/de/xtend-maraca-orchestration.md`
- `docs/en/xtend-maraca-orchestration.md`
- `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`
- `components/manifest.json`
- `tools/rmt-language/vnext-compiler.js`
- `xtend-maraca/index.js`

Commands:
- `npm run dev:local`
- `xt rmt lint app.rmt`
- `xt rmt lint app.rmt --json`
- `xt rmt lint app.rmt --agent`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
npm run dev:local
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If entry paths drift, check `docs/menu.json`, local links and the command in the verification block first.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
