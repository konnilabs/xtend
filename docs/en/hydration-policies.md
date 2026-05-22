# Hydration Policies

- Docs Contract: `xtend.docs.hydration-policies.v1`
- Policy Contract: `xtend.fabric.hydration-policy.v1`
- Decision Contract: `xtend.fabric.hydration-decision.v1`
- Since: `ER-WP-20`

XTend treats hydration as schedulable UI work. Components can hydrate as
visible, idle, or lazy work without RMT needing to know XTend components.

## Policies

| Policy | When | Lane | Schedule |
|--------|------|------|----------|
| `visible` | component is visible, focus-critical, or explicitly critical | `visible` | `component.visible.hydrate` |
| `idle` | non-critical default hydration | `idle` | `component.idle.hydrate` |
| `lazy` | `loading="lazy"`, not visible, below the fold, or under backpressure | `idle` | `component.lazy.hydrate` |

Hydration does not use the `user-blocking` lane. Focus, input, or a11y work
must run through dedicated fibers.

## Usage

```js
const decision = window.XTendFabricHydrationPolicy.resolveHydrationPolicy({
  componentRef: 'x-gallery',
  loading: 'lazy',
  isVisible: false
});

console.log(decision.scheduleRef);
```

With component fiber instrumentation:

```js
const fabric = window.XTendFabric.createXtendFabric();
const instrumentation = fabric.createComponentFiberInstrumentation('x-gallery');
const controller = window.XTendFabricHydrationPolicy.createHydrationPolicyController('x-gallery', {
  loading: 'lazy'
});

await controller.hydrate(instrumentation, (fiber) => hydrateGallery(fiber));
```

## RMT Delegation

RMT sees only schedule records:

- `component.visible.hydrate`
- `component.idle.hydrate`
- `component.lazy.hydrate`

The endpoint remains `xtendrmt.component.hydrate`. Execution belongs to Fabric
or the host adapter.

## Gates

```bash
node scripts/run_xtend_tests.js hydration-policy --json
npm run test:hydration-policy
```

The gate checks:

- policy selection for `visible`, `idle`, and `lazy`
- backpressure deferral
- refusal of `user-blocking` for non-visible hydration
- RMT schedule delegation
- integration with `createComponentFiberInstrumentation`

## Handoff

`ER-WP-21` turns this into practical performance rules for component authors in
[Performance for Component Authors](./performance.md).
