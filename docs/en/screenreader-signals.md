# Screenreader Signals

Signal live regions, status messages and overlay context cleanly.

## What it covers

Screen-reader signals distinguish status, error, and immediate warning. Polite live regions announce non-urgent state changes; assertive alerts are reserved for blocking errors. Visible text and accessible name must express the same user intent.

## Public building blocks

- `tests/a11y/screenreader_signal_suite.js` verifies signal contracts.
- Components use `role="status"`, `role="alert"`, and `aria-live` according to profile.
- Fabric schedules announcements in the accessibility lane but does not own message text.

## Recommended workflow

Verify shared signal contracts:

```bash
node scripts/run_xtend_tests.js screenreader-signals --json
```

Fix a missing status in the responsible control. Avoid simultaneous live regions with identical text, and never use a visual toast as the only error message. Validation errors remain connected to their field through `aria-describedby`.

## Next steps

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
