# Migrating the RMT kernel to XTend 0.8

XTend 0.8 is a breaking pre-1.0 release. It replaces competing scheduling paths with one host-neutral kernel scheduler. The new boundary separates the microkernel in `xtendrmt/rmt-kernel-scheduler.js` from rendering, Product Surface, performance reports, and prewarm services. The [kernel topography](./rmt-kernel-topography-map.md) documents the complete module boundary and its rationale.

## Scheduling and return values

Import the standalone scheduler when composing the microkernel directly:

```js
import { createRmtKernelScheduler } from '@ccslabs/xtend/rmt/kernel-scheduler';

const scheduler = createRmtKernelScheduler();
const handle = scheduler.schedule({
  scope: 'surface.editor',
  endpointName: 'editor.render',
  lane: 'visible'
}, async ({ signal, shouldYield, yield: yieldWork }) => {
  if (shouldYield()) await yieldWork();
  return renderEditor(signal);
});

const result = await handle;
// Cancellation is handle.cancel(), not a returned cancellation closure.
```

`scheduleWork()`, `scheduleEndpoint()`, and `createRmtBrowserScheduler().schedule()` now return a thenable `RmtJobHandle`. Existing `await` call sites continue to receive the work result. Synchronous consumers must use `await handle` or `handle.result`. Cancellation, timeout, and dispose share the abort contract; a deadline controls aging and urgency but never aborts work by itself.

## Lane mapping

Use only `user-blocking`, `visible`, `transition`, `idle`, `background`, or `diagnostics`. The 0.8 browser adapter maps `critical_input`, `visible_commit`, `hydration_followup`, `background_prepare`, and `idle_maintenance`. Fabric `a11y` intents map to `user-blocking`. New applications should emit only the canonical names; the old names exist solely on the delegating browser migration surface.

## Removed behavior

- `inline` and `runInline` no longer bypass the queue. Strict mode rejects them; non-strict mode emits a migration diagnostic and schedules normally.
- Global `AppModules` factory mirrors and the 0.6 composers are removed. The documented public browser namespace remains available.
- Importing ESM no longer creates a Product Surface or runtime instance.
- Product Surface must be enabled explicitly; direct microkernel boot is the default.
- Expired 0.7 compatibility exports and `removeBy: 0.7.0` exceptions are removed.

Registry, Maraca, Browser Runtime, and the State/Telemetry bridge receive the same scheduler instance from the Orchestration Controller. Fabric contributes work intents, backpressure, and telemetry but owns no second queue.

## Operational defaults and verification

Prewarm Worker remains disabled unless explicitly enabled. Retained chunks use a 32-entry LRU and at most two generations per scope. Critical backpressure pauses and invalidates prewarm work. Panic and recovery records are always mirrored to Fabric in redacted form on the diagnostics lane.

Run the focused gates before upgrading:

```sh
node scripts/run_xtend_tests.js scaffold-kernel-lab rmt-kernel-scheduler rmt-vnext-scheduler rmt-kernel-scheduler-failure rmt-vnext-compatibility type-exports-rmt rmt-artifact-parity --json
```

Then run `schema-inventory`, `contract-registry`, `contract-runtime-parity`, and the package dry run. Publishing remains a separate manual owner action. The [feature-adoption evaluation](./rmt-kernel-feature-adoption-evaluation.md) records the scheduler authority and optional-service decisions.
