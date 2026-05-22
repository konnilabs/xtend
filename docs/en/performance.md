# Performance for Component Authors

- Docs Contract: `xtend.docs.performance-authoring.v1`
- Scaffold Policy: `xtend.scaffold.performance-policy.v1`
- Component Profile Contract: `xtend.performance.component-profile.v1`
- Budget Matrix: `xtend.performance.budget-matrix.v1`
- Measurement Contract: `xtend.performance.measurement.v1`
- Regression Gate: `xtend.performance.regression-gate.v1`
- Hydration Policy: `xtend.fabric.hydration-policy.v1`
- Since: `ER-WP-21`

This document turns the performance budget matrix into concrete authoring
rules. New components should not be optimized only after the fact; their
performance profile should already be visible in the scaffold, component docs,
Fabric measurements, and the local regression gate.

## Performance Profile

Every new scaffolded component receives `xtendScaffoldPerformanceProfile` in
source, `performanceProfile` in the manifest patch plan, and the docs sections
`Performance Profile` and `Performance Rules`. These artifacts all reference
the same policy: `xtend.scaffold.performance-policy.v1`.

| Profile | Lane | Budget Class | Hydration | Critical Phases |
|--------|------|--------------|-----------|------------------|
| `display` | `visible` | `interactive` | `visible` | load, mount, hydrate, render, update |
| `interactive` | `user-blocking` | `critical` | `visible` | hydrate, render, update, event |
| `overlay` | `user-blocking` | `critical` | `visible` | mount, hydrate, render, event |
| `routing` | `transition` | `interactive` | `visible` | route navigate, route render, hydrate, event |
| `form` | `user-blocking` | `critical` | `visible` | hydrate, update, event |
| `media` | `visible` | `interactive` | `visible-or-idle` | mount, hydrate, render, event |
| `stateful` | `user-blocking` | `critical` | `visible` | update, event, state sync |
| `feedback` | `a11y` | `critical` | `visible` | render, update, event, announcement |
| `theme` | `visible` | `interactive` | `visible` | render, update, theme apply |

Components with multiple profiles use the strictest budget class and the
highest-priority lane. `feedback` may use a dedicated `a11y` fiber; `media` may
move non-visible work to `idle`.

## DOM Rules

- DOM queries must be limited to `this.shadowRoot`, the host, or a known
  container.
- `document.querySelectorAll` and global DOM loops need a justified exception
  and a budget.
- Static references may be cached; dynamic node lists must not grow without
  control.
- Repeated full renders are acceptable only for small, static components.
  Larger components must update targeted subtrees.
- `MutationObserver`, `ResizeObserver`, timers, and subscriptions must be
  cleaned up in `disconnectedCallback`.

## Event Rules

- `interactive`, `overlay`, and `form` treat user events as `critical`; the
  synchronous handler target is 16 ms.
- Handlers must not perform synchronous network, storage, or large DOM-scan
  work.
- High-frequency events such as `input`, `scroll`, `pointermove`, and `resize`
  must be throttled, batched, or moved onto `requestAnimationFrame`.
- Event data should be moved into canonical state or local render caches;
  derived DOM work is then batched afterwards.

## Shadow DOM

- Styles should stay static. Re-inserting identical `<style>` blocks on the
  update path is a review signal.
- Use CSS custom properties and parts where possible so theme work does not
  require JavaScript layout loops.
- `slotchange` must be budgeted and must not trigger unbounded DOM scans.
- Shadow DOM updates should replace small subtrees instead of rewriting the
  entire UI for every state change.

## Layout and Animation

- Layout reads happen before layout writes. Mixed read/write loops in the same
  synchronous phase are forbidden.
- Animations should prefer `transform` and `opacity` and respect
  `prefers-reduced-motion`.
- Measurable visible work must be correlatable through `componentRef`,
  `fiberId`, `lane`, `phase`, and `durationMs`.
- Non-visible work uses `idle`, `background`, or `diagnostics`; it must not
  claim a `user-blocking` lane.

## Hydration

`visible` is the default for visible UI. `idle` is suitable for work that is
not needed immediately but is expected soon. `lazy` is reserved for work that
activates only on demand or when it becomes visible. Non-visible hydration must
not be scheduled as `user-blocking`.

The operational policy is described in
[Hydration Policies](./hydration-policies.md). Measurement points and gate
evaluation are described in [Performance Measurements](./performance-measurements.md)
and [Performance Regression](./performance-regression.md).

## Scaffold Requirements

New scaffold outputs must expose this data:

- `performanceProfile`
- `budgetClass`
- `lane`
- `hydrationPolicy`
- `criticalMeasurements`
- `idleOrBackgroundAllowed`
- `requiresA11yFiber`

The policy is stored in `xtend-builder/scaffold.config.js` under
`performance`. The generator mirrors it into
`xtend-builder/performance/component-performance-profile.js`, the component
templates, and the manifest patch plan.

## Gates

```bash
node scripts/run_xtend_tests.js fabric-performance-measurements --json
node scripts/run_xtend_tests.js performance-regression --json
node scripts/run_xtend_tests.js hydration-policy --json
node scripts/run_xtend_tests.js references --json
```

`performance-regression` may produce local warnings when a deterministic
fixture path exceeds its budget. Hard failures remain reserved for prioritized
core paths and documented budget violations.

## Handoff

`ER-WP-25` is complete and connects screen reader signals with performance
fibers and the `a11y` lane. `ER-WP-26` is complete as well: reduced-motion and
high-contrast rules use the same profile, lane, and gate language through
`xtend.a11y.motion-contrast-policy.v1`.
