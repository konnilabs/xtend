# TypeScript Components

XTend introduces new components TypeScript-first. Runtime artifacts remain local ES modules under `components/`, while the source of truth lives under `src/components/<tag>/`.

Contract: `xtend.scaffold.typescript-component-blueprint.v1`

Since `WP-E10-16`, this guide is part of the Epic 10 release handoff `xtend.epic10.release-handoff.v1`. New components must prove not only TypeScript source, but also RMT metadata, Fabric boundary, a11y, performance, fixture, docs and local gates.

## Source Layout

| File | Purpose |
|------|---------|
| `<tag>.ts` | custom element source with static RMT, Fabric, a11y and performance metadata |
| `<tag>.contract.ts` | Component Contract v2 |
| `<tag>.rmt.ts` | RMT component metadata for `xtend.component` |
| `<tag>.a11y.ts` | a11y profile |
| `<tag>.performance.ts` | performance profile |
| `<tag>.fixture.ts` | typed fixture data |

## Builder

The builder renders the new artifact group in dry run:

```bash
node xtend-builder/scaffold.js component-files --tag x-example --profile display --feature state --json
```

The local gate is:

```bash
node scripts/run_xtend_tests.js builder-typescript-blueprint --json
```

## Required Gates as of WP-E10-16

```bash
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js epic10-platform-gates --json
node scripts/run_xtend_tests.js epic10-release-handoff --json
```

New components additionally run through their component-level suite, catalog coverage, a11y, performance and visual regression gates.

As of `WP-TypeExports-09`, the productive TypeExports handoff is also part of the release view:

```bash
npm run test:type-exports:release
```

New TypeScript-first components must therefore deliver not only runtime and component-contract artifacts, but also cover their public package surface through `components/*.d.ts`, an explicit package `types` condition or a documented `types-not-required` boundary.

## RMT and Fabric

Every new component needs an `xtend.component` RMT record and a Fabric boundary. The canonical runtime boundary for Fabric context is `adapter-injection-via-xtend-component-resolveFabricContext`; `window.XTendFabric` is a host convenience surface and not the component contract.

## Boundaries

- no CDN imports
- no new runtime dependencies for core components
- no productive TypeScript compiler in the blueprint package
- no automatic file output without review
- RMT kernel boundary: `no-rmt-kernel-import-of-xtend-types`
- TypeExports boundary: `declarations-follow-js-runtime-surface`
