# XTend Fabric Runtime

XTend Fabric is the coordination layer for runtime work. It maps RMT scheduling intent into lanes and fibers, makes hydration decisions and exposes telemetry plus diagnostics.

## What This Layer Is

Fabric is the bridge between kernel intent and host execution. The kernel describes which work exists; Fabric helps the host decide when that work should run and with which priority.

## What this layer knows

Fabric knows Fabric lanes, RMT lane mapping, schedule records, fiber context, hydration policies, backpressure, completion signals, diagnostics and telemetry snapshots.

Fabric can identify whether work is visible, idle, diagnostic or user-blocking. That helps the app control repaints, reflows and unnecessary hydration work.

## What it does not know

Fabric does not parse RMT, render UI, own framework components or execute business logic.

Fabric does not decide whether a React, Vue or XTend component is correct for the product. It only evaluates runtime intent, priority, hydration and diagnostic information.

## Interfaces

```js
import { createXtendFabric } from '@ccslabs/xtend/fabric';
import { resolveRmtScheduleForFiber } from '@ccslabs/xtend/fabric/rmt-lane-mapping';

const fabric = createXtendFabric();
const schedule = resolveRmtScheduleForFiber({
  lane: 'visible',
  scheduleRef: 'component.visible.hydrate',
  kind: 'component.hydrate'
});
```

The primary public entry points are `createXtendFabric`, hydration policy helpers, RMT lane mapping, diagnostics and telemetry snapshots.

## Communication with other layers

The RMT kernel provides schedule intent, lane names and diagnostics. Fabric normalizes that information and gives host adapters concrete execution and hydration hints.

XTend UI and other framework adapters can use Fabric context to prioritize visible work before idle work, collect diagnostics and make component hydration traceable.

## Next Steps

- [RMT Stack Topography](./rmt-stack-topography.md)
- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [XTend Fabric](./xtend-fabric.md)
- [Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md)

## Public contract

XTend Fabric Runtime is the public Fabric scheduling contract for `docs/en/xtend-fabric-runtime.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: Fabric lanes, fiber inputs, RMT lane mapping, hydration policy and diagnostics.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/xtend-fabric-runtime.md`
- `docs/menu.json`
- `package.json`
- `fabric/xtend-fabric.js`
- `fabric/rmt-lane-mapping.js`
- `fabric/rmt-lane-mapping.d.ts`
- `docs/utils/fabric-runtime.js`
- `docs/dev-router.php`

Names:
- `docs/en/xtend-fabric-runtime.md`
- `docs/menu.json`
- `fabric/xtend-fabric.js`
- `fabric/rmt-lane-mapping.js`
- `fabric/rmt-lane-mapping.d.ts`
- `docs/utils/fabric-runtime.js`
- `docs/dev-router.php`
- `package.json`
- `createXtendFabric`
- `resolveRmtScheduleForFiber`

Commands:
- `node scripts/run_xtend_tests.js fabric fabric-lane-mapping fabric-runtime-bridge --json`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js fabric fabric-lane-mapping fabric-runtime-bridge --json
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If work lands in the wrong lane, check the fiber input, mapping table and diagnostics snapshot.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
