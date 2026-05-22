# Epic 12 RC0 Handoff

- Contract: `xtend.epic12.rc0-handoff.v1`
- Report: `xtend.epic12.rc0-handoff-report.v1`
- Workpackage: `WP-E12-16`
- Local gate: `node scripts/run_xtend_tests.js epic12-rc0-handoff --json`
- Decision: `ready-for-release-owner-review-not-publish`

Epic 12 is complete. XTend now has a concrete RC0 path for release owner review without opening the publish boundary.

## What RC0 Contains

| Area | State |
|------|-------|
| Long-tail | `x-tabs`, `x-theme`, `x-button`, `x-menu` closed |
| Boundary residuals | `xstate`, `x-utils`, `xtend.component.hydrate` accepted and visible |
| Visual snapshot | DOM-first runner with JSON baseline |
| Design tokens | `--xtend-*` product token line |
| RMT DSL | authoring polish for shells, routes, links, slots, commands, hydration and lanes |
| Docs | RC0 Adoption Guide and Migration Notes current |
| Release gate | RC0 Gate Matrix executable locally |

## Owner Review

Before a publish decision, the release owner needs:

- Full Release Gate Report
- RC0 Gate Matrix Report
- Epic 12 RC0 Handoff Report
- Package Dry Run output
- Conditional Network Gate Status
- Known Residual Policy
- Migration Notes
- Publish Boundary decision

## Local Gates

```bash
node scripts/run_xtend_tests.js epic12-rc0-handoff --json
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

## Publish Boundary

`private-until-release-owner-approval` remains active. A green RC0 handoff means:

```text
ready-for-release-owner-review-not-publish
```

The next decision is `release-owner-acceptance`.
