# Visual Browser Regression

- Contract: `xtend.docs.visual-browser-regression.v1`
- Plan contract: `xtend.catalog.component-regression-priority-plan.v1`
- Gate contract: `xtend.catalog.component-regression-priority-gate.v1`
- Snapshot contract: `xtend.epic12.visual-snapshot-automation-contract.v1`
- Workpackage: `ER-WP-35`

This page describes the current XTend plan for visual and browser-close regression. ER-WP-35 does not introduce a screenshot runner yet. Instead, XTend creates a stable priority plan that defines per manifest component which browser smokes, viewports, theme variants, visual states and performance profiles must be automated first.

## Check Locally

```bash
node scripts/run_xtend_tests.js regression-priority
node scripts/run_xtend_tests.js regression-priority --json
npm run test:regression-priority
```

The gate is part of the local test runner and uses the Component Catalog Coverage Matrix as its source. It remains CDN-free and needs no external browser automation.

## Minimum Coverage

Every component in the plan receives:

- viewports: `desktop-1280`, `mobile-390`
- theme/preference variants: `light`, `dark`, `forced-colors`, `reduced-motion`
- performance profile: `xtend.performance.component-profile.v1`
- handoff gates: `browser`, `performance-regression`, `catalog-coverage`, `references`

P0 components such as `x-router`, `x-link`, `x-modal`, `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-tooltip`, `x-popover`, `x-drawer`, `x-form`, `x-calendar`, `x-writer`, `x-dialog` and `x-lightbox` are classified as `p0-browser-critical`. P1 components such as `x-status` and `x-progress` form the visual and performance baseline. P2 components remain visible as long tail.

## Profile Rules

| Profile | Browser smokes | Visual states |
|---------|----------------|---------------|
| `routing` | route changes, keyboard navigation, history state, RMT route adapter | initial route, active route, RMT scheduled route |
| `form` | input sync, validation feedback, keyboard entry, form submit | default, focus, invalid, disabled |
| `overlay` | focus trap, Escape close, scroll lock, focus restore | closed, open, focus trapped, reduced motion open |
| `feedback` | live region, dismiss timer, reduced motion | info, warning, error, dismissed |
| `interactive` | keyboard activation, focus visible, mobile tap | default, hover, focus visible, active, disabled |
| `media` | media controls, poster load, fullscreen toggle | poster, playing, controls focus |
| `theme` | theme switch, token contrast, forced colors | light theme, dark theme, forced colors |
| `display` | layout stability, responsive overflow | default layout, narrow layout |
| `iconography` | layout stability, theme token color | default layout, high-contrast currentColor |
| `utility` | utility integration probe | helper ready |

## Boundary Closure

The plan keeps the earlier boundary gaps traceable, but no longer treats them as open RC1 residuals:

- 0 manifest entries still need suite, fixture or type follow-up.
- `xstate` is closed as a runtime boundary since `WP-E13-05`.
- `x-utils` is closed as a utility boundary since `WP-E13-05`.
- The 40 visible runtime/UI components keep explicit performance profiles; `xstate` and `x-utils` are not artificially reinterpreted as visual profile carriers.

This makes it clear that `ER-WP-35` prioritizes, while handing the actual screenshot/pixel regression to CI and release readiness.

## Snapshot Automation Contract

Since `WP-E12-10`, the next step is defined through `xtend.epic12.visual-snapshot-automation-contract.v1`:

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation --json
npm run test:visual-snapshot-automation
node scripts/run_xtend_tests.js visual-snapshots --json
npm run test:visual-snapshots
node scripts/run_xtend_tests.js design-tokens --json
npm run test:design-tokens
```

The snapshot contract takes over the 360 combinations from the Component Shell Theme Matrix and describes `shell-structure`, `visual-state`, `theme-token-state`, `motion-density-state`, `viewport-layout`, `focus-a11y-state` and `rmt-shell-descriptor` as snapshot scopes. The diff strategy is `dom-first-pixel-ready`: DOM structure and CSS tokens are handled with tolerance `0`. Since `WP-E12-11`, `xtend.epic12.visual-snapshot-runner.v1` compares the local fixture against a textual JSON DOM baseline. Pixel diff is prepared as `optional-local-pixel-diff` and remains outside the Node contract gate. Since `WP-E12-12`, these CSS tokens are productized as `xtend.design-tokens.product-contract.v1` and checked through the same `--xtend-*` names in `x-theme`, Theme Matrix and Snapshot Baseline.

## Handoff

- `WP-E12-10`: Visual Snapshot Automation Contract is complete.
- `WP-E12-11`: local snapshot fixture and DOM-first runner are complete.
- `WP-E12-12`: Enterprise Design System Token Productization is complete.
- `ER-WP-36`: productize CI workflow for default gates and regression priority gate.
- `ER-WP-38`: extend release checklist with browser/visual regression, artifacts and SemVer risks.
- `ER-WP-39`: Enterprise Adoption Guide with QA recommendations and baseline strategy is complete.
- `ER-WP-40`: Docs app with RMT Parsedown Scheduling Pilot is complete.

The machine-readable implementation is in `catalog/component-regression-priority.js`. The architecture decision is in `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`.
