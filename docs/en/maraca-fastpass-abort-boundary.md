# Maraca: FastPass and presentation lifetimes (0.8.0)

Maraca retains one shared RMT scheduler authority. Jobs waiting for paint, idle or `scheduler.postTask` no longer occupy its execution slot. Once ready, they rejoin priority selection. Native priorities, cooperative continuations, cancellation and timeouts are preserved.

## Demand-driven diagnostics

`runtime.subscribe(listener)` still receives full immutable snapshots. A publication creates at most one full snapshot, shared by its full-snapshot subscribers. `runtime.subscribeEvents(listener)` receives an immutable lifecycle event containing `type`, `generation` and event-specific fields, without a snapshot wrapper. `runtime.snapshot()` remains a synchronous, current, full read.

No full subscribers means no automatic full snapshots. Errors, recovery state, counters and immutable `lastEvent` data remain available. Installing the DEV API does not create continuous snapshot demand. The browser bridge and Material scaffold DEV API use events; a diagnostic tool can explicitly request snapshots afterward. Late attachment, disconnect and reconnect do not require rebooting.

## FastPass authoring

```rmt
action showReports {
  execution fastpass
  effect navigation "#reports"
}
action dismissPanel {
  execution fastpass
  effect close surface panel
}
action focusNavigation {
  execution fastpass
  effect focus surface navigation
}
```

Navigation also accepts a declared input, e.g. `input path string` followed by `effect navigation input.path`. Close and focus require named surfaces. Existing event bindings and `dispatchCommand()` recognize these declarations; `dispatchCommand()` keeps its Promise contract.

```js
const runtime = createMaracaPlanRuntime({
  ...ports,
  fastPassActions: [{
    id: 'shell.navigate', scope: 'main',
    effects: [{ kind: 'navigation', path: { kind: 'reference', path: 'input.path' } }]
  }]
});
await runtime.boot();
const job = runtime.dispatchFastPass('shell.navigate', { path: '#reports' });
const result = await job.result;
```

The cancellable job uses `user-blocking` on the shared scheduler and bypasses the business-command Promise chain. Navigation and focus coalesce by scope; the default scope is the runtime. Repeated close is idempotent. Replaced jobs are cancelled, reject their result like other RMT jobs, and are never replayed as ordinary commands.

Navigation/focus use `navigationAdapter.navigate` and `focusAdapter.focus`. Close first validates the Surface Controller, then uses the PresentationEffectPort. Custom presentation ports need `setSurfaceHidden(id, hidden)` for FastPass Close. Ports acknowledge the applied shell intent immediately; loading and animation are separate lifecycle work. Older commands retain ordered model commits while stale presentation commits and navigation/focus effects are discarded.

Compiler and runtime share validation. Reducers, status/result state, data sources, services, streams, resources, custom effects and chained business commands are forbidden. FastPass does not accelerate model transactions or preempt synchronous JavaScript. The default cooperative budget is 8 ms; exceeding it emits a diagnostic.

## Abort boundaries

Managed surfaces expose `runtime.getSurfaceBoundary(id)`; omitting the ID returns the root boundary. External renderers can import `createMaracaAbortBoundary({ id, parent })` from `@ccslabs/xtend/maraca/plan-runtime`.

The contract provides `capture()`, `isCurrent(token)`, `invalidate(reason)`, `dispose()` and the current `signal`. `setActive(false)` also prevents new presentation work; reactivation starts a fresh epoch. `run(work, token)` settles obsolete work as `{ ok: false, status: 'superseded' }`. `commit(work, token)` guards a synchronous mutation. `scheduleCommit(scheduler, work, token, request)` checks again after scheduling and removes pending work on invalidation.

```js
const boundary = runtime.getSurfaceBoundary('panel');
const token = boundary.capture();
const response = await kernel.runtime.requestUiCompute(envelope, {
  abortBoundary: boundary, presentationToken: token
});
if (response.status === 'superseded') return;
await boundary.scheduleCommit(kernel.scheduler, () => {
  renderer.commit(buildCommit(response));
}, token);
```

Tokens stay on the main thread. They are independent of model versions and worker request generations. Check after a response and immediately before DOM/chart commits, including fallback paths. Supersession must never trigger a synchronous rendering fallback.

Managed boundaries follow successful close, hide, minimize/collapse, route departure, target replacement, data reprojection and disposal. Recreating the same surface ID does not revive old tokens. Failed atomic lifecycle operations leave the boundary unchanged. Hydration receives `metadata.surfaces` containing each island's `id`, `boundary`, `token`, `signal` and `isCurrent()`, plus a root guard. Custom hydrators must carry these guards across async work and check before resource/DOM commits.

Shared prewarming can keep valid cached data and component definitions. Business imports and services retain their own ownership. Cancellation settles and removes only the affected UI worker request, leaving the shared worker available. Guards cannot preempt synchronous code or prevent mutations by an external adapter that ignores them.

See `demos/xtendrmt/maraca-fastpass/` for native RMT authoring. The `maraca-responsiveness` and `rmt-kernel-scheduler` suites cover ordering and suppressed commits deterministically; browser checks supplement them with visible shell response measurements.

The extended public runtime and presentation adapter use `xtend.maraca.plan-runtime.v3` and `xtend.rmt.presentation-effect-adapter.v2`, following the repository’s major-only schema policy. Existing methods retain their behavior. The additive authoring contract is published in `xtend-maraca/fastpass.schema.json`; the released RMT v2 document schema stays unchanged.

## Related pages

- [Maraca orchestration](./xtend-maraca-orchestration.md)
- [Actions and Events](./rmt-reference-actions-events.md)
- [Hydration Policies](./hydration-policies.md)
- [XTend DEV API](./xtend-dev-api.md)
