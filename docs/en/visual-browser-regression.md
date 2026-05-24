# Visual Browser Regression

Find browser-level regressions with stable fixtures and screenshots.

## What it covers

This page describes checkable rules for robust user experiences. The recommendations fit local hosts, RMT app shells and classic Web Component pages.

## Public building blocks

- Local test commands.
- Browser-facing fixtures.
- Documented acceptance criteria.
- Docs contract `xtend.docs.visual-browser-regression.v1`.
- Gate `node scripts/run_xtend_tests.js regression-priority --json`.
- Viewports `desktop-1280`, `tablet-768` and `mobile-390`.

## Recommended workflow

Define budgets, check keyboard and screenreader signals and keep screenshots reproducible.

## Next steps

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
