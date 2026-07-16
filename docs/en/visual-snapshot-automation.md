# Visual Snapshot Automation

Create deterministic screenshots for themes, viewports and components.

## What it covers

Snapshot automation materializes defined fixture states, waits for stable custom elements, and writes comparable local artifacts. Theme, viewport, motion, and state are part of snapshot identity; network and real-time data remain excluded.

## Public building blocks

- `tests/browser/visual_snapshot_automation_suite.js` verifies the automation contract.
- `tests/browser/visual_snapshots_suite.js` runs comparisons.
- `.xtend-test-results/` contains reports and generated evidence, not UI source of truth.
- The local runner publishes the stable `xtend.epic12.visual-snapshot-runner.v1` contract.

## Recommended workflow

Verify contract and runner together:

```bash
node scripts/run_xtend_tests.js visual-snapshot-automation visual-snapshots --json
```

The runner can also be verified in isolation:

```bash
node scripts/run_xtend_tests.js visual-snapshots --json
```

A timeout usually indicates an undefined element, active animation, or missing fixture readiness. Stabilize that state explicitly. Do not mask dynamic regions that remain visible and meaningful to users.

## Next steps

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
