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

## Developer context

This expanded section turns XTend Fabric Runtime from a short navigation note into a practical Fabric scheduling guide for third-party developers. Read it as the public contract around the topic: it explains why the page exists, which repository surfaces back it, how a host should integrate it and where to look when behavior does not match the expectation. The structure follows the same pattern used by mature developer documentation systems: a short concept, a repeatable integration path, a concrete example, reference checkpoints and troubleshooting.

Use this page when you need to make an implementation decision without relying on private project knowledge. The page should help you answer three questions quickly: what is stable, what must the host configure, and which local checks prove that the integration still works. It does not introduce new runtime behavior; it documents the contracts already present in the source, package metadata, fixtures, tests and localized documentation.

## Source of truth

The content is grounded in these repository surfaces:

- `docs/en/xtend-fabric-runtime.md`
- `docs/menu.json`
- `package.json`
- `fabric/xtend-fabric.js`
- `fabric/rmt-lane-mapping.js`
- `fabric/rmt-lane-mapping.d.ts`
- `docs/utils/fabric-runtime.js`

Treat these files as the authority when you need to verify a detail. Documentation examples should stay smaller than production code, but they must still use real paths, real commands and names that exist in the package. If an implementation and this page disagree, inspect the source surfaces first and update the article only after the public contract is clear.

## Integration path

Start with the smallest local host that can exercise the topic. Keep the manifest, loader, RMT document or quality script local to the application so browser security policy, import resolution and scheduling decisions are visible during development. Add product-specific wrappers only after the plain XTend path works, because wrappers can hide missing attributes, stale routes or incorrect scheduling assumptions.

For a third-party team, the practical sequence is: read the concept, copy the minimal example, run the relevant local check, then add host-specific data or styling. Avoid depending on internal directory names, generated DOM nodes or undocumented state records. Stable integration points are package exports, documented files, Web Component attributes and events, RMT records, public scripts and the localized docs routes.

## Example and verification

Useful local checks before you publish a change that depends on this page:

```bash
node scripts/run_xtend_tests.js fabric fabric-lane-mapping fabric-runtime-bridge --json
```

The example is intentionally small. It is meant to prove that the public surface is reachable, not to model a complete application. For production work, keep the same order: configure the local source, execute the smallest check, then expand with real host data. When the command produces JSON, attach the summary to the implementation review so reviewers can see the same signal without reproducing the full local setup.

## Reference checklist

- Identify the owning surface before changing a host integration: loader, manifest, RMT compiler, Fabric scheduler, Surface Manager, accessibility policy or security gate.
- Keep DE and EN articles aligned. Code blocks should stay identical across locales so copy-paste behavior does not depend on language.
- Prefer documented attributes, package exports, scripts and local Markdown routes over private runtime internals.
- Preserve existing local links and keep examples short enough that users can adapt them without deleting most of the snippet.
- When a page describes validation, security or performance, include the command that proves the claim locally.

## Troubleshooting

If the page still feels too abstract, look for a missing concrete noun: file path, command, component tag, RMT record, manifest key or event name. Add that noun before adding more prose. If a browser page fails, first check whether the local server was started from the repository root with `docs/dev-router.php`; otherwise root assets such as `/xtend.css`, `/xtend-loader.js` and `/fabric/xtend-fabric.js` will not resolve. If a command fails after a documentation-only edit, prefer fixing the example or the documented source reference instead of weakening the gate.

## Maintenance notes

This section is generated from the guide inventory and can be refreshed safely. Keep hand-written context above it when a page needs a narrative introduction, and keep generated depth below it for the repeatable developer checklist. A page is no longer considered a stub when both locales stay above the non-code character threshold, expose at least four meaningful second-level sections and pass the public docs quality checks.
