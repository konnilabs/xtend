# XTend SurfaceManager Runtime Release Handoff Contract

- Schema: `xtend.surface.runtime-release-handoff.v1`
- Report: `xtend.surface.runtime-release-handoff-report.v1`
- Migration Notes: `xtend.surface.runtime-migration-notes.v1`
- Release Gate Matrix: `xtend.surface.runtime-release-gate-matrix.v1`
- Compatibility Notes: `xtend.surface.runtime-compatibility-notes.v1`
- Workpackage: `WP-SM-19`
- Gate: `node scripts/run_xtend_tests.js surface-runtime-release-handoff --json`

## Release Claim

`WP-SM-19` akzeptiert die Surface Runtime als produktive XTend-UI-Schicht fuer App Shells mit nativen `surfaces[*]`.

Produktive Claims:

- `productive-xtend-surface-adapter-runtime`
- `native-surfaces-materialize-xtend-ui-components`
- `restore-key-snapshot-hydration`
- `shell-first-skeleton-hydration`
- `xrouter-bound-surface-lifecycle`
- `modal-focus-inert-stack-policy`
- `layout-engines-docking-split-tile-stacked`
- `document-flow-static-portal-composition`
- `remote-surface-trust-policy`
- `browser-lab-visual-stability`

SurfaceController bleibt die einzige Registry. SurfaceManager ersetzt weder Fabric noch den RMT Kernel. Fabric behaelt Diagnostics, Fibers und Scheduling-Zusammenhang; RMT bleibt deklarativ und importiert keine XTend-Typen.

## Migration Notes

`surfaces[*]` ist der Authoring-Default fuer neue komplexe App Shells. `components[*].metadata.surface` bleibt als Compatibility-Pfad gueltig und darf waehrend Migrationen als Dual Record mitgefuehrt werden.

Pflicht fuer Migrationen:

- stabile `id`, `type`, `manager`, `component`, `route`, `schedule` und `stateKey`
- keine zweite Surface Registry
- keine Doku-App-Sonderloesung
- `surface-adapter-runtime` und `surface-native-materialization` als Pflichtgates
- `surface-runtime-release-handoff` als abschliessender Handoff-Gate

## Release Gate Matrix

Der Release-Gate umfasst:

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
node scripts/run_xtend_tests.js surface-adapter-runtime --json
node scripts/run_xtend_tests.js surface-native-materialization --json
node scripts/run_xtend_tests.js surface-persistence --json
node scripts/run_xtend_tests.js surface-lazy-hydration --json
node scripts/run_xtend_tests.js surface-route-lifecycle --json
node scripts/run_xtend_tests.js surface-stack-policy --json
node scripts/run_xtend_tests.js surface-layout-engines --json
node scripts/run_xtend_tests.js surface-remote-policy --json
node scripts/run_xtend_tests.js surface-browser-lab --json
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
```

## SemVer

SemVer-Klassifizierung: `0.x-minor-with-migration-notes`.

Vor einem oeffentlichen Publish bleibt Release-Owner-Signoff erforderlich. Die Runtime ist im Repository produktiv gatebar; npm-Publish, Changelog und externe Consumer-Kommunikation bleiben an die allgemeine Release Checklist gebunden.

## Offene Scopes

- `project-specific-pixel-artifact-storage`
- `release-owner-signoff-before-public-npm-publish`
- `optional-command-palette-and-workspace-surface-types`
- `remote-runtime-loading-remains-out-of-scope`
- `docs-app-php-parsedown-host-boundary-remains`

Diese Punkte blockieren den produktiven Runtime-Claim nicht, muessen aber in Projekt- oder Release-spezifischen Entscheidungen sichtbar bleiben.

## Boundary

`no-rmt-kernel-import-of-xtend-types`
