# Epic 18 RMT App Platform Release Handoff

Schema: `xtend.epic18.rmt-app-platform-release-handoff.v1`

WP-E18-13 closes Epic 18 as a release-close handoff. The vendor bugfixes are documented, the RMT App Platform has a generic fixture, and the GitHub gates run through the existing CI commands.

## Local Gate

```bash
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
```

Package script:

```bash
npm run test:epic18-rmt-app-platform
```

## Gate Matrix

Bugfix line:

```bash
node scripts/run_xtend_tests.js components surface-controller surface-manager-browser overlay-interaction-ux layout-display-media-ux epic18-vendor-bugfix-smokes browser references --json
```

RMT App Platform line:

```bash
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime rmt-app-platform-tooling rmt-app-platform-fixture rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
```

Export and pack evidence:

```bash
node scripts/run_xtend_tests.js type-exports-rmt type-exports epic13-package-export-lock --json
npm run pack:dry-run
```

GitHub Actions:

```bash
npm run test:pr:report
npm run test:release:full:report
```

`.github/workflows/xtend-default-gates.yml` uses these commands for pull requests, pushes, manual runs and nightly runs. `epic18-rmt-app-platform` is part of the PR fast gate; the full release gate continues to run through all registered suites.

## Release Boundary

The handoff makes Epic 18 commit-ready and CI-ready, but does not open a publish path. Public publish remains bound to release-owner acceptance, supply-chain evidence and the existing RC/release checklist.

## Artifacts

- `docs/epic18-vendor-bugfixes.md`
- `docs/rmt-app-platform-migration-guide.md`
- `docs/rmt-app-platform-fixture.md`
- `catalog/epic18-rmt-app-platform-release-handoff.js`
- `tests/platform/epic18_rmt_app_platform_release_handoff_suite.js`
- `development/WP-E18-13-Docs-Migration-Guide-Vendor-Rebuild-und-Release-Handoff.md`
