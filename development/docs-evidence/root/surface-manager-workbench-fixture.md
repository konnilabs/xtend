# SurfaceManager Workbench Fixture

Contract: `xtend.surface.workbench-fixture.v1`

The Surface Workbench fixture proves an RMT-first SurfaceManager app with route-bound Content, zwei Windows, one SidePanel and a shared Surface Snapshot.

## Runtime Evidence

- Authoring source: `xtendrmt/surface-workbench.rmt`
- Runtime parity core: `xtendrmt/surface-workbench.core.json`
- vNext core artifact: `xtendrmt/surface-workbench.vnext.core.json`
- Browser smoke: `tests/browser/fixtures/rmt-surface-workbench-smoke.html`
- Runtime module: `xtendrmt/surface-workbench.js`

The smoke host stays generic and renders the Workbench from Core records. The vNext source remains the authoring proof, while the runtime uses `sourceSyntax: "rmt-vnext"` metadata to connect both artifacts.

## Local Gate

```bash
node scripts/run_xtend_tests.js surface-workbench-fixture --json
```

The gate verifies route-bound manager rendering, two `x-surface-window` instances, one `x-side-panel`, command events and the shared `xtend.surface.snapshot.v1` snapshot.
