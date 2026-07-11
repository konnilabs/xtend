# Visual Browser Regression

Find browser-level regressions with stable fixtures and screenshots.

## What it covers

Visual browser regression compares controlled states at fixed themes and viewports. It should reveal layout drift, overlap, clipped text, focus treatment, and responsive state changes rather than random pixels from animation or system fonts.

## Public building blocks

- `tests/browser/visual_snapshots_suite.js` runs local DOM and screenshot comparisons.
- The `desktop-1280`, `tablet-768`, and `mobile-390` viewports cover fixed layout boundaries.
- `xtend.epic12.visual-snapshot-automation-contract.v1` identifies the existing snapshot report.

## Recommended workflow

Generate regression priority and snapshots from the same revision:

```bash
node scripts/run_xtend_tests.js regression-priority visual-snapshots --json
```

For a diff, inspect fixture state, fonts, motion, and viewport first. Update a baseline only after visual review and an explained product change. A new baseline is not a fix for overlapping or clipped UI.

## Next steps

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
