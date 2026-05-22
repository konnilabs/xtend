# RC0 Adoption Guide

- Contract: `xtend.epic12.docs-adoption.v1`
- Report: `xtend.epic12.docs-adoption-report.v1`
- Workpackage: `WP-E12-15`
- Local gate: `node scripts/run_xtend_tests.js epic12-docs-adoption --json`

This guide is the production-close entry point for teams evaluating XTend after Epic 12 as a release-candidate candidate. It connects the migration notes from long-tail runtime, visual snapshots, design tokens, RMT DSL authoring polish and RC0 gate matrix.

RC0 remains a local review candidate. `private-until-release-owner-approval` remains active; a green gate run is not a publish approval.

## Migration Notes

### Long-Tail Runtime Closure

Closed:

- `x-tabs`: performance profile, keyboard, browser smoke, theme matrix
- `x-theme`: a11y, reduced motion, forced colors, performance, theme propagation, density boundary
- `x-button`: performance budget, interaction budget, Fabric measurement, RMT metadata
- `x-menu`: performance, keyboard navigation, router compatibility, Fabric measurement, RMT metadata

Accepted RC0 residuals:

- `xstate`: non-visual boundary probe, `contract-gated`
- `x-utils`: utility boundary, `typed-contract-gated`

These residuals are not hidden blockers. They remain visible because infrastructure modules are not artificially treated as UI shells.

### DOM-First Visual Snapshots

The RC0 snapshot path is DOM-first:

```bash
node scripts/run_xtend_tests.js visual-snapshots --json
node scripts/run_xtend_tests.js design-tokens --json
```

Pixel baselines are optional locally. The reviewable baseline is in `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`.

### Design Token Productization

New components and RMT shells use the `--xtend-*` token line. Theme packs, density packs, high contrast, forced colors and CSS parts are public styling surfaces and need migration notes when they change.

### RMT DSL Authoring Polish

New RMT app documents can author shells, routes, links, outlets, components, slots, commands, hydration and lanes through the DSL polish layer. XTendRMT remains framework-agnostic: the kernel imports no XTend types and no XRouter implementation.

### RC0 Gate Matrix

Before owner review:

```bash
node scripts/run_xtend_tests.js epic12-docs-adoption --json
node scripts/run_xtend_tests.js rc0-gate-matrix --json
npm run test:release:full:report
npm run pack:dry-run
```

Conditional network gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

If network access is unavailable, RC0 remains locally reviewable; publishing remains blocked.

## Component Author Checklist

| Check | Required |
|-------|----------|
| use `xtend-loader.js` and local manifest | yes |
| document types, events, a11y and performance | yes |
| treat design tokens and CSS parts as public API | yes |
| set Fabric lanes and RMT schedule hints correctly | yes |
| check snapshot and theme matrix impact | yes |
| mark breaking changes with migration notes | yes |

## App Author Checklist

| Check | Required |
|-------|----------|
| describe app shell shell-first in RMT where possible | yes |
| route XRouter routes through native RMT `routes` records | yes |
| treat Parsedown, rich HTML or media as scheduled content components | yes |
| check Trusted DOM boundary for `html_fragment` | yes |
| run `rmt-dsl-authoring-polish` and `docs-rmt-pilot` for RMT paths | yes |

## Known Residual Policy

RC0 accepts:

- `xstate`
- `x-utils`
- `xtend.component.hydrate`

The hydration warning remains accepted as long as it stays below the failure threshold and below `maxWarningCount = 2`. Failures are not allowed.

## Handoff to WP-E12-16

`WP-E12-16` used this guide, the [RC0 Gate Matrix](./rc0-gate-matrix.md), the Package Dry Run, the Conditional Network Gates and the Known Residual Policy to build the [Epic 12 RC0 Handoff](./epic12-rc0-handoff.md) for release owners.
