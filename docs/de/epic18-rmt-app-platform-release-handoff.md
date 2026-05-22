# Epic 18 RMT App Platform Release Handoff

Schema: `xtend.epic18.rmt-app-platform-release-handoff.v1`

WP-E18-13 schliesst Epic 18 als release-nahen Handoff ab. Die Vendor-Bugfixes
sind dokumentiert, die RMT App Platform besitzt eine generische Fixture, und
die GitHub-Gates laufen ueber die bestehenden CI-Kommandos.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js epic18-rmt-app-platform --json
```

Package Script:

```bash
npm run test:epic18-rmt-app-platform
```

## Gate-Matrix

Bugfix-Linie:

```bash
node scripts/run_xtend_tests.js components surface-controller surface-manager-browser overlay-interaction-ux layout-display-media-ux epic18-vendor-bugfix-smokes browser references --json
```

RMT-App-Platform-Linie:

```bash
node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-action-effect-runtime rmt-event-routing-runtime rmt-surface-resource-graph-runtime rmt-app-platform-tooling rmt-app-platform-fixture rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json
```

Export und Pack Evidence:

```bash
node scripts/run_xtend_tests.js type-exports-rmt type-exports epic13-package-export-lock --json
npm run pack:dry-run
```

GitHub Actions:

```bash
npm run test:pr:report
npm run test:release:full:report
```

`.github/workflows/xtend-default-gates.yml` nutzt diese Kommandos fuer Pull
Requests, Pushes, manuelle Laeufe und Nightly Runs. `epic18-rmt-app-platform`
ist Teil des PR-Fast-Gates; der Full-Release-Gate laeuft weiterhin ueber alle
registrierten Suites.

## Release-Grenze

Der Handoff macht Epic 18 commit- und CI-ready, aber oeffnet keinen Publish-
Pfad. Public Publish bleibt an Release-Owner-Akzeptanz, Supply-Chain Evidence
und die vorhandene RC-/Release-Checkliste gebunden.

## Artefakte

- `docs/epic18-vendor-bugfixes.md`
- `docs/rmt-app-platform-migration-guide.md`
- `docs/rmt-app-platform-fixture.md`
- `catalog/epic18-rmt-app-platform-release-handoff.js`
- `tests/platform/epic18_rmt_app_platform_release_handoff_suite.js`
- `development/WP-E18-13-Docs-Migration-Guide-Vendor-Rebuild-und-Release-Handoff.md`
