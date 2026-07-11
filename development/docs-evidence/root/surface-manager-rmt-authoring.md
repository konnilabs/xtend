# SurfaceManager RMT Authoring

Contract: `xtend.surface.authoring.v1`

SurfaceManager RMT authoring describes shell-first workbench apps without binding the RMT kernel to XTend implementation details.

## Authoring Model

- Surface records describe windows, SidePanels and future surface types.
- Routes can mount route-bound Content.
- Shared Surface Snapshot records keep visible surfaces observable.
- Host adapters own DOM materialization, focus handling and command execution.

The Surface Workbench fixture at `xtendrmt/surface-workbench.rmt` is the smallest active proof. It renders through `xtendrmt/surface-workbench.js` and is checked by `tests/browser/fixtures/rmt-surface-workbench-smoke.html`.

## Local Gate

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring surface-workbench-fixture --json
```

The gate keeps the authoring contract aligned with Windows, SidePanel behavior, route-bound Content and shared Surface Snapshot expectations.
