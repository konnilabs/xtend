# A11y Keyboard Smokes

Check keyboard paths and focus states for real usability.

## What it covers

Keyboard smokes verify a complete interaction path rather than the presence of `tabindex` alone. Focus order, visible focus, Enter or Space activation, arrow keys, Escape, focus traps, and restoration after overlays all matter.

## Public building blocks

- `tests/browser/fixtures/a11y-focus-keyboard-smoke.html` is the browser-facing fixture.
- Component profiles name role, focus strategy, and supported keys.
- Surface and overlay checks track focus ownership across open and close.

## Recommended workflow

Run the accessibility and hydration gate locally:

```bash
node scripts/run_xtend_tests.js a11y-hydration --json
```

Fix the earliest failed focus transition first. A mouse click does not prove keyboard access. For an overlay, Tab and Shift+Tab stay inside the active boundary, Escape performs the documented action, and close restores prior focus.

## Next steps

- [Performance](./performance.md)
- [Hydration Policies](./hydration-policies.md)
