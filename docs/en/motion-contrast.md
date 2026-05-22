# Motion and Contrast

- Contract: `xtend.docs.motion-contrast.v1`
- Runtime/gate contract: `xtend.a11y.motion-contrast-policy.v1`
- Motion contract: `xtend.a11y.motion-policy.v1`
- Contrast contract: `xtend.a11y.contrast-policy.v1`
- Gate: `node scripts/run_xtend_tests.js motion-contrast --json`

## Purpose

Motion and contrast are part of a11y-by-design in XTend. Components must respect reduced motion, forced contrast modes, visible focus and non-color status without requiring XTendRMT or a host framework to know concrete CSS details.

## Required Rules

| Area | Implementation |
|------|----------------|
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables non-essential animations and transitions |
| High contrast | `@media (forced-colors: active)` uses system colors such as `CanvasText`, `ButtonText`, `Highlight`, `Mark` |
| Focus | `:focus-visible` remains visible and uses `Highlight` in the forced-colors path |
| Status | error, warning, busy and active have semantics beyond color |
| Tokens | theme tokens must not override forced-colors when system colors are required |

## Component Contract

Relevant components declare statically:

```js
static get xtendMotionContrastPolicy() {
  return {
    schema: 'xtend.a11y.motion-contrast-policy.v1',
    componentRef: 'x-component',
    motion: {
      schema: 'xtend.a11y.motion-policy.v1',
      mediaQuery: '(prefers-reduced-motion: reduce)',
      noMotionOnlyState: true
    },
    contrast: {
      schema: 'xtend.a11y.contrast-policy.v1',
      mediaQuery: '(forced-colors: active)',
      focusVisible: 'required',
      nonColorStatus: 'required'
    }
  };
}
```

## Scaffold

New scaffold components receive:

- `motionContrast.policy` in the a11y profile
- manifest key `motionContrastPolicy`
- docs section `Motion and Contrast Policy`
- fixture fields `motionContrastPolicy`, `motionMediaQuery`, `contrastMediaQuery`
- TypeScript type `X<Component>MotionContrastPolicy`

## Fabric and RMT

Preference signals use Fabric lane `a11y`, fiber `a11y.preference` and schedule `a11y.user-blocking.preference`. RMT remains framework-agnostic and receives only host-neutral schedule/diagnostic signals, not CSS execution.

## Local Verification

```bash
npm run test:motion-contrast
node scripts/run_xtend_tests.js motion-contrast --json
node scripts/run_xtend_tests.js references --json
```
