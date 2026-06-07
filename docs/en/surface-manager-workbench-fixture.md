# SurfaceManager Workbench Fixture

Contract: `xtend.surface.workbench-fixture.v1`

The Workbench Fixture proves an RMT-first Surface App with route, manager, windows, side panel and shared snapshot.

Gate:

```bash
node scripts/run_xtend_tests.js surface-workbench-fixture --json
```

## Purpose

The Workbench Fixture proves that an RMT-first app can describe multiple surface types together without bypassing the host runtime. A route brings the user into the workbench, the manager registers the surfaces, windows show primary work areas, a side panel provides context and a snapshot makes state readable again. This combination is closer to real applications than a single component smoke, but still small enough for local gates.

The `xtend.surface.workbench-fixture.v1` contract is not a product layout. It describes a verifiable structure: route, manager, window, panel, commands and snapshot. Teams can use it to reason about their own workbench-style apps, but they should provide their own names, content and domains. The fixture stays domain-neutral so it is not mistaken for a CRM, CMS or admin template.

## Runtime Flow

The flow starts with an RMT source that declares route and surfaces. The compiler produces a structure that the host translates into owned components. `x-surface-manager` receives the surface records, `x-surface-window` renders work areas, and `x-side-panel` shows secondary context. The shared snapshot proves that the app is not merely visual; state, focus and action results are brought back together.

No stage should take a manual DOM shortcut. RMT provides descriptors, not HTML injection. The host decides which custom elements, slots and DOM sinks are allowed. When a workbench action runs, it must return through the runtime path into the snapshot. Only then is the fixture strong enough for Native-First and Trusted DOM gates.

## Reviewer Check

Reviewers read the fixture as integration evidence. They check whether route, windows and side panel refer to the same app instance, whether ids are stable, whether the snapshot captures every visible surface and whether commands avoid unregistered side effects. A failure in this gate often points to architecture drift: RMT describes too much DOM, the host registers too little state, or a surface type exists only as a visual container.

New workbench cases should be added only when they prove a different interaction. Examples include an inspector, a multi-stage queue or a resizable workspace. Pure text changes, new example names or cosmetic columns do not need a new fixture. That keeps the gate small but meaningful.
