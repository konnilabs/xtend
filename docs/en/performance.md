# Performance

Budgets, measurements and hydration rules for fast XTend apps.

## What it covers

XTend records loader, mount, hydration, render, route, and interaction work as versioned measurements. A budget belongs to a named phase and time base; a large absolute timestamp must not be mistaken for navigation duration.

## Public building blocks

- `fabric/xtend-fabric.js` collects fiber and component measurements.
- `tests/performance/performance_regression_suite.js` checks deterministic budget cases.
- `xtend.performance.measurement.v1` uses `pass`, `warn`, and `fail` status values.

## Recommended workflow

Run regression and Fabric measurement together:

```bash
node scripts/run_xtend_tests.js performance-regression fabric-performance-measurements --json
```

Read phase, actual value, budget, and status first. Fix a `fail` in the affected work; change a budget only when the documented user requirement changed. Build trends from comparable samples, never timestamps with different origins.

## Next steps

- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
