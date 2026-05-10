# Browser Smoke Tests

Scope:

- real Custom Element lifecycle
- loader hydration
- visible UI activation
- router navigation
- theme switching
- overlay and feedback flows
- browser-near A11y focus and keyboard flows
- Epic 11 browser-near component UX and compatibility journeys
- Epic 11 Component Shell theme, motion, density and viewport matrix
- Epic 12 Visual Snapshot Automation contract and local runner handoff
- Epic 12 Enterprise Design System Token productization handoff
- SurfaceManager browser, A11y, Performance and Visual quality gates for mixed stacks
- XTendRMT browser-near route, component, scheduler and vanilla host regression
- ER-WP-35 visual/browser regression priority handoff for desktop/mobile, theme variants and high-usage components

Current entry point:

```bash
node scripts/run_xtend_tests.js browser
```

Related reference-path entry point:

```bash
node scripts/run_xtend_tests.js references
```

The default browser suite validates the self-checking fixture and the productive `x-alert` source contract. This is the accepted deterministic harness path for local development and does not require external browser automation.

Implemented fixtures:

- `fixtures/custom-elements-smoke.html`: first Custom Element smoke for `x-alert`.
- `fixtures/core-flows-smoke.html`: core-flow smoke for loader, API, router, theme, toast, alert, dialog and modal.
- `fixtures/a11y-focus-keyboard-smoke.html`: A11y smoke for `x-link`/`x-router`, `x-input`/`x-form`, `x-tabs` and `x-modal` focus/keyboard behavior.
- `tests/browser/fixtures/epic11-ux-compatibility-smoke.html`: Epic 11 UX compatibility smoke under `xtend.epic11.component-ux-browser-smokes.v1` for Form Controls, Feedback/Status, Navigation/Routing including `x-tabs`, Overlays and Layout/Display/Media.
- `tests/browser/fixtures/epic11-theme-matrix-smoke.html`: Epic 11 Component Shell Theme Matrix under `xtend.epic11.component-shell-theme-matrix.v1` for light, dark, high-contrast, forced-colors, reduced-motion, density, viewport contracts and the `x-tabs` P0 visual-ready journey.
- `tests/browser/fixtures/visual-snapshots-fixture.html`: Epic 12 Visual Snapshot fixture under `xtend.epic12.visual-snapshot-fixture.v1` for the local DOM-first snapshot runner.
- `tests/browser/fixtures/surface-manager-quality-smoke.html`: SurfaceManager quality smoke under `xtend.surface.quality-gates.browser-smoke.v1` for mixed Window, SidePanel, Modal, Dialog and Drawer stacks.
- `fixtures/rmt-xrouter-xtend-smoke.html`: XTendRMT smoke for native RMT routes, XRouter route changes, XTend adapter mount/hydration, scheduler endpoint signals and a vanilla host adapter path.
- `fixtures/components/manifest.json`: fixture-local manifest that resolves core components to repo-local files.

Optional Safari WebDriver run:

```bash
XTEND_BROWSER_SMOKE_DRIVER=safari node scripts/run_xtend_tests.js browser
```

Safari WebDriver requires local Safari Remote Automation support and is treated as an optional diagnostic run. The fixture set verifies `x-alert` registration, shadow DOM rendering, visible body state, shell-first loader visibility defaults, opt-in UI effects, API initialization, router rendering, theme state, feedback components, overlay components, A11y focus/keyboard flows, XTendRMT native route registration, XTend component hydration, scheduler endpoint signals and a non-XTend vanilla host path.

Epic 11 component UX smokes have their own local gate:

```bash
node scripts/run_xtend_tests.js component-ux-browser-smokes --json
```

That gate validates `xtend.epic11.component-ux-browser-smokes.v1`, the local manifest entries and the self-checking fixture contract without requiring external browser automation. After `WP-E12-03`, the navigation journey also checks `x-tabs` Arrow/Home/End keyboard behavior, roving focus and ARIA panel wiring.

Epic 11 Component Shell Theme Matrix has its own local gate:

```bash
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
```

That gate validates `xtend.epic11.component-shell-theme-matrix.v1`, derives its UX families from the browser UX smoke plan and keeps the fixture local-only while covering `light`, `dark`, `high-contrast`, `forced-colors`, `reduced-motion`, `comfortable`, `compact`, `dense`, `desktop-1280`, `tablet-768`, `mobile-390` and the `x-tabs` navigation shell states.

Epic 12 Visual Snapshot Automation has its own contract and runner gates:

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation --json
node scripts/run_xtend_tests.js visual-snapshots --json
```

The first gate validates `xtend.epic12.visual-snapshot-automation-contract.v1`. The second gate validates `xtend.epic12.visual-snapshot-runner.v1`, the local fixture `tests/browser/fixtures/visual-snapshots-fixture.html` and the JSON DOM baseline `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`. Pixel diff is exposed as `optional-local-pixel-diff` and stays outside the node contract gate unless a deterministic local browser driver is configured.

Epic 12 Enterprise Design System Tokens have their own local gate:

```bash
node scripts/run_xtend_tests.js design-tokens --json
```

That gate validates `xtend.design-tokens.product-contract.v1`, `x-theme.getDesignTokenContract()`, `design-tokens/themes/enterprise-light.json`, shared `--xtend-*` token names in Theme Matrix and Visual Snapshot fixtures, and the absence of fixture-local token names in the visual gates.

SurfaceManager Quality Gates have their own local gate:

```bash
node scripts/run_xtend_tests.js surface-manager-quality --json
```

That gate validates `xtend.surface.quality-gates.v1`, the local mixed-stack browser fixture, A11y assertions, performance budget contract and the JSON DOM baseline `tests/browser/visual-baselines/surface-manager-quality.dom-baseline.json`.

Demo HTML files that are not browser-smoke fixtures are classified in `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` and checked by the `references` suite.

Regression prioritization for future visual snapshots and browser automation is tracked separately through:

```bash
node scripts/run_xtend_tests.js regression-priority --json
```

That gate validates `xtend.catalog.component-regression-priority-plan.v1` without requiring screenshot automation in the default local browser smoke harness.
