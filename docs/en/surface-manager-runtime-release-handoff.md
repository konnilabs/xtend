# SurfaceManager Runtime Release Handoff

`WP-SM-19` finalizes the surface runtime as a productive XTend UI layer for app shells. The contract `xtend.surface.runtime-release-handoff.v1` bundles the work from `WP-SM-10` through `WP-SM-18` and makes the runtime claim locally gateable.

## Productive Runtime Claims

| Claim | Gate |
| --- | --- |
| `productive-xtend-surface-adapter-runtime` | `surface-adapter-runtime` |
| `native-surfaces-materialize-xtend-ui-components` | `surface-native-materialization` |
| `restore-key-snapshot-hydration` | `surface-persistence` |
| `shell-first-skeleton-hydration` | `surface-lazy-hydration` |
| `xrouter-bound-surface-lifecycle` | `surface-route-lifecycle` |
| `modal-focus-inert-stack-policy` | `surface-stack-policy` |
| `layout-engines-docking-split-tile-stacked` | `surface-layout-engines` |
| `remote-surface-trust-policy` | `surface-remote-policy` |
| `browser-lab-visual-stability` | `surface-browser-lab` |

The final gate is:

```bash
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
```

## Authoring

New complex app shells should use native `surfaces[*]`. `components[*].metadata.surface` remains as a compatibility path, especially for existing fixtures and additive migrations.

The productive path is:

1. Model surface records in `surfaces[*]`.
2. Reference component records as manager and content bindings.
3. Keep route, schedule, state key and restore key stable.
4. Check `surface-adapter-runtime` and `surface-native-materialization`.
5. Check app-shell stability through `surface-browser-lab`.

## Release Gate Matrix

The runtime handoff expects the existing baseline plus the hardened runtime line:

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring surface-controller surface-manager surface-side-panel surface-workbench-fixture surface-overlay-bridge surface-manager-quality surface-native-rmt surface-release-handoff --json
node scripts/run_xtend_tests.js surface-adapter-runtime surface-native-materialization surface-persistence surface-lazy-hydration surface-route-lifecycle surface-stack-policy surface-layout-engines surface-remote-policy surface-browser-lab surface-runtime-release-handoff --json
```

## Compatibility Notes

`xtend.surface.runtime-compatibility-notes.v1` records:

- existing component-metadata surfaces remain runnable
- workbench and browser-lab fixtures remain in the gate
- Docs app Parsedown remains a host boundary and is not moved into SurfaceManager
- remote runtime loading remains outside the RMT kernel
- SurfaceManager replaces neither Fabric nor the RMT kernel
- SurfaceController remains the only registry

## Open Scopes

These points are intentionally not part of the runtime claim:

- `project-specific-pixel-artifact-storage`
- `release-owner-signoff-before-public-npm-publish`
- `optional-command-palette-and-workspace-surface-types`
- `remote-runtime-loading-remains-out-of-scope`
- `docs-app-php-parsedown-host-boundary-remains`

## SemVer

The classification for the current state is `0.x-minor-with-migration-notes`. Before external publish, release-owner signoff, changelog and the general release checklist remain required.
