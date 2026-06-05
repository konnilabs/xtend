# Component Long-Tail Migration

- Status: `accepted-migration-plan`
- Docs Contract: `xtend.docs.component-long-tail-migration.v1`
- Plan Contract: `xtend.epic11.legacy-long-tail-migration.v1`
- Entry Contract: `xtend.epic11.legacy-long-tail-migration-entry.v1`
- Gate Contract: `xtend.epic11.legacy-long-tail-migration-gate.v1`
- Workpackage: `WP-E11-17`
- Strategy: `incremental-no-big-bang`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Purpose

This page is the stable developer-facing anchor for the Legacy Long-Tail Migration gate. The migration plan keeps the remaining non-visual helper surfaces visible without turning them into a broad component rewrite or coupling RMT to XTend runtime internals.

The source of truth is split deliberately:

- `catalog/component-long-tail-migration.js` builds the machine-readable plan from catalog coverage and regression priority data.
- `development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md` records the accepted contract.
- `development/WP-E11-17-Legacy-Long-Tail-Migration-planen.md` records the completed workpackage.
- `tests/catalog/component_long_tail_migration_suite.js` validates this page, the plan, package metadata and reference paths.

## Local Gate

```bash
node scripts/run_xtend_tests.js component-long-tail-migration --json
npm run test:component-long-tail-migration
```

## Current Long Tail

After the component hardening wave, the open long tail contains only infrastructure and utility boundary probes:

| Tag | Current Status | Target Maturity | Migration Kind | Remaining Focus |
|-----|----------------|-----------------|----------------|-----------------|
| `xstate` | `contract-gated` | `ux-baseline-probe` | `adapter-boundary-probe` | Runtime a11y profile, performance profile and integration probe |
| `x-utils` | `typed-contract-gated` | `ux-baseline-probe` | `adapter-boundary-probe` | Performance profile and integration probe |
| `xtend-i18n` | `typed-contract-gated` | `ux-baseline-probe` | `adapter-boundary-probe` | Performance profile and integration probe |

`x-tabs`, `x-theme`, `x-button` and `x-menu` are no longer part of the open long-tail matrix. Their component, theme, interaction and performance closure remains documented in the accepted migration contract.

## Acceptance Rules

- Migration remains incremental; there is no `big-bang` rewrite path.
- RMT keeps the `no-rmt-kernel-import-of-xtend-types` boundary.
- Helper surfaces use adapter and integration probes instead of forced visual shell rewrites.
- The docs path remains stable because package metadata, the reference registry and the local gate all refer to `docs/component-long-tail-migration.md`.
