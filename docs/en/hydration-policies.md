# Hydration Policies

Choose visible, idle and progressive hydration deliberately.

## What it covers

A hydration policy defines trigger, lane, deadline, and backpressure behavior for existing markup. `visible` covers visible or focus-critical work, `idle` and `lazy` cover non-urgent areas, `prewarm` is interruptible preparation, and `worker_prerender_hydrate` handles validated worker output.

## Public building blocks

- `fabric/hydration-policy.js` contains canonical policies.
- `fabric/hydration-policy.d.ts` describes decisions, controllers, and schedule records.
- `fabric/rmt-lane-mapping.js` connects policy lanes to RMT schedules.

## Recommended workflow

Verify every policy against its trigger and backpressure cases:

```bash
node scripts/run_xtend_tests.js hydration-policy --json
```

The report must include policy ID, selected lane, schedule, and diagnostics. High backpressure may defer best-effort prewarm, but visible hydration must not silently remain idle forever. DOM commit stays on the controlled main thread.

## Next steps

- [XTend DEV API](./xtend-dev-api.md)
- [Performance](./performance.md)
- [A11y Keyboard Smokes](./a11y-keyboard-smokes.md)
