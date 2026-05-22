# Visual Snapshot Automation

- Contract: `xtend.epic12.visual-snapshot-automation-contract.v1`
- Entry contract: `xtend.epic12.visual-snapshot-automation-entry.v1`
- Automation report contract: `xtend.epic12.visual-snapshot-automation-report.v1`
- Runner contract: `xtend.epic12.visual-snapshot-runner.v1`
- Fixture contract: `xtend.epic12.visual-snapshot-fixture.v1`
- Runner report contract: `xtend.epic12.visual-snapshot-runner-report.v1`
- Design token contract: `xtend.design-tokens.product-contract.v1`
- Workpackages: `WP-E12-10`, `WP-E12-11`, `WP-E12-12`
- Contract gate: `node scripts/run_xtend_tests.js visual-snapshot-automation --json`
- Snapshot gate: `node scripts/run_xtend_tests.js visual-snapshots --json`

XTend Visual Snapshot Automation is the Epic 12 line for local visual regression. `WP-E12-10` defines scopes, matrix, tolerances and artifact policy. `WP-E12-11` builds a local DOM-first snapshot runner with JSON baseline on top of that.

## Check Locally

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation
node scripts/run_xtend_tests.js visual-snapshot-automation --json
npm run test:visual-snapshot-automation
node scripts/run_xtend_tests.js visual-snapshots --json
npm run test:visual-snapshots
node scripts/run_xtend_tests.js design-tokens --json
npm run test:design-tokens
```

The gate is local-only, CDN-free and uses no external browser services.

## Matrix

The contract adopts the 360 combinations of the Component Shell Theme Matrix:

- themes: `light`, `dark`, `high-contrast`, `forced-colors`
- motion: `default-motion`, `reduced-motion`
- density: `comfortable`, `compact`, `dense`
- viewports: `desktop-1280`, `tablet-768`, `mobile-390`
- UX families: `form-controls`, `feedback-status`, `navigation-routing`, `overlay-interaction`, `layout-display-media`

## Snapshot Scopes

- `shell-structure`
- `visual-state`
- `theme-token-state`
- `motion-density-state`
- `viewport-layout`
- `focus-a11y-state`
- `rmt-shell-descriptor`

The RMT boundary remains `no-rmt-kernel-import-of-xtend-types`: RMT describes and schedules shells, but imports no XTend types into the kernel.

As of `WP-E12-12`, the snapshot fixture uses the same product tokens as `x-theme` and the Component Shell Theme Matrix. The DOM baseline tracks `--xtend-surface`, `--xtend-text`, `--xtend-color-primary`, `--xtend-density-spacing` and `--xtend-radius`; local fixture names such as `--snapshot-*` have been removed.

## Diff Strategy

`WP-E12-10` defines `dom-first-pixel-ready`; `WP-E12-11` performs the local DOM diff:

- DOM structure and CSS tokens have tolerance `0`.
- Pixel diff is prepared as `optional-local-pixel-diff`, but does not run in the Node contract gate.
- Maximum pixel mismatch is `0.01`.
- Layout shift is limited to `1px`.
- Before capture, the runner must wait for custom elements, fonts, loader completion and one animation frame.

## Artifacts

| Artifact | Path |
|----------|------|
| Contract | `development/XTend-Visual-Snapshot-Automation-Contract.md` |
| Plan | `tests/browser/visual-snapshot-automation-plan.js` |
| Automation suite | `tests/browser/visual_snapshot_automation_suite.js` |
| Runner | `tests/browser/visual-snapshots-runner.js` |
| Fixture | `tests/browser/fixtures/visual-snapshots-fixture.html` |
| DOM baseline | `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json` |
| Snapshot suite | `tests/browser/visual_snapshots_suite.js` |
| Output root | `.xtend-test-results/visual-snapshots` |
| Report path | `.xtend-test-results/visual-snapshots/visual-snapshots-report.json` |
| RC1 owner manifest | `tests/browser/visual-baselines/rc1-visual-owner-artifact.manifest.json` |

The baseline is textual and reviewable in `WP-E12-11`. Binary or screenshot baselines remain reserved for an optional local pixel-diff mode.

## RC1 Visual Owner Artifact

As of `WP-E13-08`, [Visual Owner Artifacts](./visual-owner-artifacts.md) uses this DOM-first line as the source for `xtend.epic13.visual-owner-artifact.v1`. The local gate `node scripts/run_xtend_tests.js epic13-visual-owner-artifact --json` normalizes artifact root, report path, screenshot template and viewports. Screenshot/pixel creation remains `optional-browser-driver-or-ci-artifact`.

## RC0 Adoption Update

Since `WP-E12-15`, the [RC0 Adoption Guide](./rc0-adoption-guide.md) references this DOM-first snapshot path as RC0 baseline. Component authors treat `visual-snapshots`, `design-tokens` and `component-shell-theme-matrix` together as a local review chain; pixel baselines remain optional and must not block the local RC0 dry run.
