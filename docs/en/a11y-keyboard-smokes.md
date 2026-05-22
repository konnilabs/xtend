# A11y Keyboard Smokes

Contract:

```text
xtend.docs.a11y-keyboard-smokes.v1
xtend.a11y.browser-keyboard-smoke.v1
```

Starting with `ER-WP-24`, XTend verifies central accessibility interactions in
a browser-near way. The gate does not replace manual screen reader reviews, but
it prevents focus and keyboard paths from silently dropping out of core
components.

## Fixture

The self-checking browser fixture lives here:

```text
tests/browser/fixtures/a11y-focus-keyboard-smoke.html
```

It uses:

- `xtend-loader.js`
- `data-manifest="/tests/browser/fixtures/components/manifest.json"`
- local component modules
- `window.__xtendA11yKeyboardSmokeResult`

## Covered Paths

| Area | Component | Expectation |
|------|-----------|-------------|
| Routing | `x-link` + `x-router` | `Enter` and `Space` navigate, `aria-current` follows the route |
| Form | `x-input` + `x-form` | focus is delegated, input syncs `xstate` and form data |
| Tabs | `x-tabs` | `ArrowRight`, `ArrowLeft`, and `Enter` remain operable |
| Overlay | `x-modal` | initial focus, focus trap, `Escape`, and focus restore work |

`x-dialog` uses the same overlay contract and is checked source-side for focus
trap, `Escape`, and focus restore.

## Local Gates

```bash
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js a11y-hydration --json
```

Optionally, the browser smoke can be run with Safari WebDriver:

```bash
XTEND_BROWSER_SMOKE_DRIVER=safari node scripts/run_xtend_tests.js browser
```

The default run stays deterministic and does not require an external browser.

## Component Authors

New or modernized components should derive their a11y path from the profile:

- Routing and commands: `Enter`, optional `Space`, active ARIA state.
- Overlays: initial focus, focus trap, `Escape`, focus restore.
- Form controls: delegated focus, input events, state/form synchronization.
- Composite widgets: arrow keys and current ARIA state.

Scaffolded components receive an `xtend.a11y.profile.v1` starting with
`ER-WP-23`. ER-WP-24 provides the browser-near gate that such profiles can
later attach to component-by-component.
