# SurfaceManager Release Handoff

- Contract: `xtend.surface.release-handoff.v1`
- Report: `xtend.surface.release-handoff-report.v1`
- Workpackage: `WP-SM-09`
- Local Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`
- Package Script: `npm run test:surface-release-handoff`

## Status

Die erste SurfaceManager-Linie ist mit `WP-SM-09` authoring- und gatebereit. XTend kann App Shells mit Multi Window, SidePanels, Overlay-Kompatibilitaet, Quality Gates und nativen RMT Surface Records beschreiben.

Release Boundary:

```text
no-public-runtime-claim-for-xtend.surface-adapter-yet
```

Das bedeutet: `surfaces[*]` und `xtend.surface.adapter.v1` sind stabiler Handoff fuer Tooling und naechste Runtime-Arbeit. Die produktive Runtime-Ausfuehrung bleibt bei `x-surface-manager`, `x-surface-window`, `x-side-panel` und den bestehenden Overlay-Komponenten, bis ein echter `xtend.surface` Adapter implementiert ist.

## Gate-Kette

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

Bereit:

- App-Shell Authoring ueber Component Records und Surface-Metadata
- native `surfaces[*]` Records fuer komplexe Workbench-Oberflaechen
- Component Lab Fixture fuer Surface Preview, Native RMT Inspector, Migration Diff, Quality Gates und Source Links
- Migration Guide fuer `components[*].metadata.surface` zu `surfaces[*]`
- lokale statische Gates fuer RMT-Normalisierung, Semantic Graph, Docs und Referenzpfade

Folgearbeit:

- produktive `xtend.surface` Adapter Runtime
- optionaler Browser-Lab-Server oder visuelle Pixel-Baselines
- weitere Surface-Typen wie docked workspaces, command palettes und split panes
- Release-Hardening gegen echte App-Shell-Projekte

## Referenzen

- [SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md)
- [SurfaceManager Component Lab](./surface-manager-component-lab.md)
- [SurfaceManager Migration Guide](./surface-manager-migration-guide.md)
- [SurfaceManager Native RMT Surfaces](./surface-manager-native-rmt-surfaces.md)
