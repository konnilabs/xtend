# Epic 10 Platform Gates

Contract: `xtend.epic10.platform-gates.v1`

This document describes the gate chain from `WP-E10-15`. It bundles browser, a11y, performance and visual gates for the Epic 10 Component Platform.

## Local Gate

```bash
node scripts/run_xtend_tests.js epic10-platform-gates --json
npm run test:epic10-platform-gates
```

## Gate Domains

- `component-contract`: Component Contract v2 and Existing Component Metadata
- `rmt-first-app`: RMT-first demo app without manual shell
- `browser-smoke`: local browser-close fixtures
- `a11y`: keyboard, screenreader, reduced motion and contrast
- `performance`: measurements, regression and hydration policies
- `visual-browser-regression`: viewports, theme variants and visual states
- `ci-handoff`: Fast PR and release composition

## Fast PR

The Fast PR gate includes the new Epic 10 platform rules, but remains without release-only performance regression:

```bash
node scripts/run_xtend_tests.js component-contract-v2 epic10-p0-component-wave component-lab-rmt-inspector rmt-first-demo-app existing-component-metadata browser a11y-hydration screenreader-signals motion-contrast regression-priority references --json
```

`npm run test:pr` runs this line together with core, Fabric, security and Docs RMT gates.

## Release

Release gates additionally run:

- `fabric-performance-measurements`
- `performance-regression`
- `hydration-policy`

The complete release path remains:

```bash
npm run test:release:full
```

## Browser Smokes

The gate chain expects these local fixtures:

- `tests/browser/fixtures/custom-elements-smoke.html`
- `tests/browser/fixtures/core-flows-smoke.html`
- `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
- `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- `tests/browser/fixtures/a11y-focus-keyboard-smoke.html`

CDN loads are not allowed in this line.

## Handoff

`WP-E10-15` closes the testability of the Epic 10 platform line. Since `WP-E10-16`, the closure gate `epic10-release-handoff` has been part of the Fast PR/release handoff view, so documentation, guide structure and publish boundary are checked together with the platform gates.
