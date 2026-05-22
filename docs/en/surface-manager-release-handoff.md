# SurfaceManager Release Handoff

- Contract: `xtend.surface.release-handoff.v1`
- Report: `xtend.surface.release-handoff-report.v1`
- Workpackage: `WP-SM-09`
- Local gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`
- Package script: `npm run test:surface-release-handoff`

## Status

The first SurfaceManager line is authoring-ready and gate-ready with `WP-SM-09`. XTend can describe app shells with multi-window, side panels, overlay compatibility, quality gates and native RMT surface records.

Historical `WP-SM-09` release boundary:

```text
no-public-runtime-claim-for-xtend.surface-adapter-yet
```

In the `WP-SM-09` authoring handoff, this meant: `surfaces[*]` and `xtend.surface.adapter.v1` were a stable handoff for tooling and the next runtime work. Since `WP-SM-19`, this runtime work has been closed through [SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md), and the productive `xtend.surface` adapter claim is gateable.

## Gate Chain

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring --json
node scripts/run_xtend_tests.js surface-controller --json
node scripts/run_xtend_tests.js surface-manager --json
node scripts/run_xtend_tests.js surface-side-panel --json
node scripts/run_xtend_tests.js surface-workbench-fixture --json
node scripts/run_xtend_tests.js surface-overlay-bridge --json
node scripts/run_xtend_tests.js surface-manager-quality --json
node scripts/run_xtend_tests.js surface-native-rmt --json
node scripts/run_xtend_tests.js surface-release-handoff --json
```

## Handoff

Ready:

- app-shell authoring through component records and surface metadata
- native `surfaces[*]` records for complex workbench UIs
- Component Lab fixture for surface preview, native RMT inspector, migration diff, quality gates and source links
- migration guide from `components[*].metadata.surface` to `surfaces[*]`
- local static gates for RMT normalization, semantic graph, docs and reference paths

Historical follow-up work from `WP-SM-09`:

- productive `xtend.surface` adapter runtime, closed by `WP-SM-19`
- optional browser-lab server or visual pixel baselines
- additional surface types such as docked workspaces, command palettes and split panes
- release hardening against real app-shell projects

## WP-SM-19 Runtime Handoff

`WP-SM-19` closes this follow-up work for the productive runtime line. The new contract `xtend.surface.runtime-release-handoff.v1` documents the productive runtime line made of adapter runtime, native materialization, persistence, lazy hydration, route lifecycle, stack policy, layout engines, remote policy and browser lab.

```bash
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
```

`WP-SM-09` therefore remains the historical authoring handoff, while `WP-SM-19` makes the productive runtime claim gateable. Open scopes such as project-specific pixel artifacts, release-owner signoff before npm publish and optional additional surface types remain explicitly named in the runtime handoff.

## References

- [SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md)
- [SurfaceManager Component Lab](./surface-manager-component-lab.md)
- [SurfaceManager Migration Guide](./surface-manager-migration-guide.md)
- [SurfaceManager Native RMT Surfaces](./surface-manager-native-rmt-surfaces.md)
- [SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md)
