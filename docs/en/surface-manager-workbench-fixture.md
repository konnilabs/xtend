# SurfaceManager Workbench Fixture

Docs contract: `xtend.docs.surface-manager-workbench-fixture.v1`

Runtime contract: `xtend.surface.workbench-fixture.v1`

`WP-SM-05` introduces the first RMT-first workbench for the SurfaceManager. It renders an app shell from RMT, binds the SurfaceManager to a route and shows two windows plus a side panel with a shared snapshot.

## Artifacts

| Path | Purpose |
|------|---------|
| `xtendrmt/surface-workbench.rmt` | RMT document with app shell, route, SurfaceManager, two windows, side panel and content |
| `tests/browser/fixtures/rmt-surface-workbench-smoke.html` | host/smoke fixture without manual surface components |
| `xtendrmt/surface-workbench.js` | workbench renderer for `dom_descriptor`, slots, routes and snapshot |
| `tests/browser/fixtures/rmt-surface-workbench-smoke.html` | prepared browser smoke for later surface gates |

## Model

The workbench continues to use the MVP path from `xtend.rmt.surface-authoring.v1`: surfaces are normal `components` records with `metadata.surface`. The native RMT `surfaces` domain remains reserved.

Included:

- `workbench.manager` as `x-surface-manager`
- `workbench.inspector` and `workbench.editor` as two windows
- `workbench.properties` as `x-side-panel`
- `app.router` as route-bound outlet
- `workbench` as route for surface content
- `xtend.surface.snapshot` as shared surface snapshot key

## Runtime

`xtendrmt/surface-workbench.js` renders only structured DOM nodes. The renderer does not use `innerHTML`; it uses `renderDomDescriptor`, `renderSurfaceWorkbenchFromDocument` and `root.replaceChildren(shellFragment)`.

The snapshot is read via `collectSurfaceSnapshot(root)`. If `x-surface-manager.snapshot()` is available, the snapshot comes directly from the manager; otherwise the fixture provides a DOM fallback for static gates.

## Gate

```bash
node scripts/run_xtend_tests.js surface-workbench-fixture --json
```

The gate checks contract, RMT normalization, host boundary, runtime boundary, route-bound content, two windows, side panel, shared surface snapshot, package/scaffold metadata, docs and runner registration.
