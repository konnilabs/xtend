# Epic18 RMT App Platform Release Handoff

- Schema: `xtend.epic18.rmt-app-platform-release-handoff.v1`
- Report Schema: `xtend.epic18.rmt-app-platform-release-handoff-report.v1`
- Gate Matrix: `xtend.epic18.rmt-app-platform-gate-matrix.v1`
- Status: `accepted-docs-migration-vendor-rebuild-release-handoff`
- Local Gate: `node scripts/run_xtend_tests.js epic18-rmt-app-platform --json`
- Workpackage: `development/WP-E18-13-Docs-Migration-Guide-Vendor-Rebuild-und-Release-Handoff.md`
- GitHub Actions: `.github/workflows/xtend-default-gates.yml`

## Release Commands

```bash
npm run test:pr:report
npm run test:release:full:report
npm run pack:dry-run
```

## Required Gate Chain

```bash
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime rmt-app-platform-tooling rmt-app-platform-fixture rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
node scripts/run_xtend_tests.js type-exports-rmt type-exports epic13-package-export-lock --json
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
```

## Handoff

Epic18 ist abgeschlossen und oeffnet keinen Publish-Schritt von selbst. Release Owner pruefen PR-Fast-Report, Full-Release-Report, Pack-Dry-Run, Package Export Lock und die GitHub-Actions-Artefakte aus `.github/workflows/xtend-default-gates.yml`.

## Boundaries

- `publishAllowed`: `false`
- `publishBoundary`: `private-until-release-owner-acceptance`
- `kernelBoundary`: `no-rmt-kernel-import-of-xtend-types`
- `xstate` bleibt Host Adapter und wird nicht in den RMT-Kernel importiert.
- RMT App Platform Migration nutzt DOM Descriptor Records statt manueller `innerHTML`-Hosts.
