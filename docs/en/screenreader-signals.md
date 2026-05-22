# Screenreader Signals

- Contract: `xtend.docs.screenreader-signals.v1`
- Runtime/gate contract: `xtend.a11y.screenreader-signals.v1`
- Signal record: `xtend.a11y.screenreader-signal.v1`
- Gate: `node scripts/run_xtend_tests.js screenreader-signals --json`

## Purpose

Screenreader signals make visible which UI state changes must not remain silent. The contract describes `aria-live`, status regions, error regions and announcements without embedding a specific UI runtime into XTendRMT.

XTend uses the contract for components and scaffold artifacts. XTendRMT can schedule the resulting a11y work through Fabric lane `a11y`, fiber `a11y.announce` and schedule `a11y.user-blocking.announce`.

## Signal Types

| Signal | Live region | Region | Typical use |
|--------|-------------|--------|-------------|
| `status-announcement` | `polite` | `status` | Toasts, alerts, submit success |
| `dismissal-announcement` | `polite` | `status` | Toast/alert was closed |
| `validation-error-summary` | `assertive` | `error` | Form or input errors |
| `submit-status` | `polite` | `status` | Form processed successfully |
| `dialog-context` | `none` | `dialog` | Dialog/modal context via role and label |
| `focus-return` | `none` | `focus` | Focus returns to source after overlay close |
| `route-change-announcement` | `polite` | `status` | Route was changed |

## Component Obligations

Feedback components declare status signals and set a live region. Error states may be assertive, but must remain reviewable.

Form components declare at least `validation-error-summary` and `submit-status`. Error regions need a clear source and must not treat empty announcements as success.

Overlay components declare `dialog-context` and `focus-return`. They do not necessarily need `aria-live`, because the screenreader context comes from `role="dialog"`, `aria-modal`, `aria-labelledby` and focus management.

## Scaffold

New scaffold components include the screenreader contract in:

- `xtendScaffoldA11yProfile.screenreader.signalContract`
- manifest key `screenreaderSignals`
- component docs section `Screenreader Signals`
- fixture result `screenreaderSignals`
- type contract `ScreenreaderSignalContract`

## Verification

```bash
npm run test:screenreader-signals
node scripts/run_xtend_tests.js screenreader-signals --json
node scripts/run_xtend_tests.js a11y-hydration --json
```

The gate checks the contract factory, real feedback/form/overlay components, scaffold outputs and package metadata.

## Boundaries

The contract is not a replacement for manual screenreader acceptance. It prevents relevant status, error or overlay signals from remaining unnamed.
