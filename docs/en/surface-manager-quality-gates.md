# SurfaceManager Quality Gates

`WP-SM-07` introduces `xtend.surface.quality-gates.v1`. The gate checks the SurfaceManager across four domains: browser, a11y, performance and visual.

## Local Gates

```bash
node scripts/run_xtend_tests.js surface-manager-quality --json
node scripts/run_xtend_tests.js surface-manager-browser --json
node scripts/run_xtend_tests.js surface-manager-a11y --json
node scripts/run_xtend_tests.js surface-manager-performance --json
node scripts/run_xtend_tests.js surface-manager-visual --json
```

The domain gates run through the same contract and can be referenced specifically in local checks or CI matrices.

## Browser

The fixture `tests/browser/fixtures/surface-manager-quality-smoke.html` builds a mixed surface UI:

- two `x-surface-window`
- one `x-side-panel`
- one `x-modal`
- one `x-dialog`
- one `x-drawer`

Overlays are opened through `surface-overlay-command` and added to the same surface stack.

## A11y

The gate checks contract and fixture signals for:

- roles: `application`, `dialog`, `complementary`
- `aria-live` status
- focus restore
- Escape topmost behavior
- Tab focus trap
- reduced motion
- forced colors and visible focus

## Performance

The contract defines budgets for open/close, focus, layout transition, snapshot and registration. The browser fixture additionally sets the performance measurement `surface-quality-open-close`.

## Visual

The DOM baseline `tests/browser/visual-baselines/surface-manager-quality.dom-baseline.json` covers desktop, mobile, topmost overlay and forced colors. It intentionally remains JSON-only so the local gate can run stably without browser pixel diff.

## Handoff

`WP-SM-08` can build on the quality gates and validate the native RMT `surfaces` domain against the same visible stack states.
