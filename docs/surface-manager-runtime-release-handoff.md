# SurfaceManager Runtime Release Handoff

Schema: `xtend.surface.runtime-release-handoff.v1`

The SurfaceManager runtime handoff documents the productive runtime line for `productive-xtend-surface-adapter-runtime`. The release gate is `node scripts/run_xtend_tests.js surface-runtime-release-handoff --json`.

Required gates include `surface-adapter-runtime`, `surface-native-materialization`, `surface-lazy-hydration`, `surface-route-lifecycle`, `surface-stack-policy`, `surface-layout-engines`, `surface-remote-policy`, `surface-browser-lab`, and `surface-runtime-release-handoff`.

SurfaceController remains the single registry. SurfaceManager does not replace Fabric, the RMT kernel, or xstate; it coordinates with them through host adapter contracts and observable snapshots.

Open release scopes remain explicit: `project-specific-pixel-artifact-storage` and `release-owner-signoff-before-public-npm-publish` must be resolved outside the runtime handoff before public npm publication.
