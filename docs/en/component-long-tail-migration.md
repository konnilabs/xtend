# Component Long-Tail Migration

- Contract: `xtend.docs.component-long-tail-migration.v1`
- Plan contract: `xtend.epic11.legacy-long-tail-migration.v1`
- Gate contract: `xtend.epic11.legacy-long-tail-migration-gate.v1`
- Workpackage: `WP-E11-17`

This page describes how XTend handles the last components that are not fully `enterprise-ready` after Epic 11. The plan is intentionally incremental: visible custom elements are hardened against shell, styling, a11y, performance, browser smokes and theme matrix; infrastructure and utility modules receive integration probes instead of artificial UI shells.

Update after `WP-E13-05`: `x-tabs` has an explicit performance profile and is no longer part of the open long-tail plan. `x-theme` has a11y, reduced-motion, forced-colors, performance, theme-propagation and density coverage. `x-button` has performance, interaction-budget, Fabric-measurement and RMT metadata. `x-menu` has performance, keyboard, routing, Fabric and RMT metadata. `xstate` has suite, fixture, public types, lifecycle events, Fabric diagnostics and RMT state adapter and is classified by [Known Residual Triage](./known-residual-triage.md) as `closed-as-runtime-boundary`. `x-utils` has utility contract, import policy, fixture and public types and is classified as `closed-as-utility-boundary`. No open long-tail or boundary-profile decisions remain from this plan.

## Check Locally

```bash
node scripts/run_xtend_tests.js component-long-tail-migration --json
npm run test:component-long-tail-migration
```

## Migration Waves

| Wave | Components | Goal |
|------|------------|------|
| `wave-1-p0-routing-interaction` | closed: `x-tabs` | performance profile, browser smoke and theme matrix are complete |
| `wave-2-p1-theme-and-interaction` | closed: `x-theme`, `x-button`, `x-menu` | performance, a11y, interaction and routing hardening are complete |
| `wave-3-infrastructure-and-utility-probes` | closed: `xstate`, `x-utils` | suite, fixture, type and boundary decisions are complete; both remain documented as non-visual runtime/utility boundaries |

## Rules for Component Authors

- No long-tail component is rewritten to TypeScript or new shells in a big bang.
- Custom elements must first close their missing profiles in `components/*`, docs, types and component suites.
- Non-custom elements such as `xstate` and `x-utils` are tested as infrastructure or utility boundaries.
- Browser smokes and theme matrix are required only when the surface is genuinely visual or interactive.
- RMT continues to describe adapter data; the kernel imports no XTend types.

## Source

The migration plan is generated from `catalog/component-catalog-coverage.js` and `catalog/component-regression-priority.js`. The accepted specification is in `development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md`.

## RC0 Adoption Update

Since `WP-E12-15`, the [RC0 Adoption Guide](./rc0-adoption-guide.md) summarizes this long-tail status as a migration note for component authors and app authors. For RC0, `xstate` and `x-utils` counted as known, accepted residuals from the Known Residual Policy; they did not block local RC0 review and did not open a publish boundary. Since `WP-E13-05`, both scopes are closed for RC1: `xstate` as a runtime boundary, `x-utils` as a utility boundary.
