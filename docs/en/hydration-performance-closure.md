# Hydration Performance Closure

- Contract: `xtend.epic13.hydration-performance-closure.v1`
- Decision: `xtend.epic13.hydration-performance-decision.v1`
- Report: `xtend.epic13.hydration-performance-closure-report.v1`
- Local gate: `node scripts/run_xtend_tests.js epic13-hydration-performance-closure --json`

`WP-E13-06` closes the last known-residual watchpoint from `WP-E13-05`: `xtend.component.hydrate`.

## Decision

| Measurement point | Before | Now | Result |
|-------------------|--------|-----|--------|
| `xtend.component.hydrate` | `36ms / 32ms`, `warn-not-fail` | `31ms / 32ms`, `pass` | closed without owner dependency |

The budget remains `32ms`. The baseline was calibrated below the existing budget; the quality bar was not lowered.

## Gate Behavior

```bash
node scripts/run_xtend_tests.js performance-regression --json
node scripts/run_xtend_tests.js epic13-hydration-performance-closure --json
```

The RC1 baseline expects:

- `warnCount === 0`
- `failCount === 0`
- hydration phase with at least one `pass`
- continued hard failure fixture for real budget violations

## Handoff

After this closure, `WP-E13-07` could prepare the [PROD Browser CSP Smokes](./prod-browser-csp-smokes.md). The current handoff goes to `WP-E13-08`, where visual screenshot/pixels are normalized as an RC1 artifact. `private-until-release-owner-acceptance` remains active.
