# SurfaceManager Runtime Release Handoff

`WP-SM-19` finalisiert die Surface Runtime als produktive XTend-UI-Schicht fuer App Shells. Der Contract `xtend.surface.runtime-release-handoff.v1` buendelt die Arbeit aus `WP-SM-10` bis `WP-SM-18` und macht den Runtime-Claim lokal gatebar.

## Produktive Runtime Claims

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

Der abschliessende Gate ist:

```bash
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
```

## Authoring

Neue komplexe App Shells sollen native `surfaces[*]` nutzen. `components[*].metadata.surface` bleibt als Compatibility-Pfad bestehen, vor allem fuer bestehende Fixtures und additive Migrationen.

Der produktive Pfad ist:

1. Surface Records in `surfaces[*]` modellieren.
2. Component Records als Manager- und Content-Bindings referenzieren.
3. Route, Schedule, State Key und Restore Key stabil halten.
4. `surface-adapter-runtime` und `surface-native-materialization` pruefen.
5. App-Shell-Stabilitaet ueber `surface-browser-lab` pruefen.

## Release Gate Matrix

Der Runtime-Handoff erwartet die bestehende Baseline plus die gehaertete Runtime-Linie:

```bash
node scripts/run_xtend_tests.js rmt-surface-authoring surface-controller surface-manager surface-side-panel surface-workbench-fixture surface-overlay-bridge surface-manager-quality surface-native-rmt surface-release-handoff --json
node scripts/run_xtend_tests.js surface-adapter-runtime surface-native-materialization surface-persistence surface-lazy-hydration surface-route-lifecycle surface-stack-policy surface-layout-engines surface-remote-policy surface-browser-lab surface-runtime-release-handoff --json
```

## Compatibility Notes

`xtend.surface.runtime-compatibility-notes.v1` haelt fest:

- bestehende Component-Metadata-Surfaces bleiben lauffaehig
- die Workbench- und Browser-Lab-Fixtures bleiben im Gate
- Docs-App Parsedown bleibt Host-Boundary und wird nicht in SurfaceManager verschoben
- Remote Runtime Loading bleibt ausserhalb des RMT-Kernels
- SurfaceManager ersetzt weder Fabric noch den RMT Kernel
- SurfaceController bleibt die einzige Registry

## Offene Scopes

Diese Punkte sind bewusst nicht Teil des Runtime-Claims:

- `project-specific-pixel-artifact-storage`
- `release-owner-signoff-before-public-npm-publish`
- `optional-command-palette-and-workspace-surface-types`
- `remote-runtime-loading-remains-out-of-scope`
- `docs-app-php-parsedown-host-boundary-remains`

## SemVer

Die Klassifizierung fuer den aktuellen Stand lautet `0.x-minor-with-migration-notes`. Vor externem Publish bleiben Release-Owner-Signoff, Changelog und die allgemeine Release Checklist erforderlich.
