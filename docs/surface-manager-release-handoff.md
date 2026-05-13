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

## WP-SM-19 Runtime-Handoff

`WP-SM-19` schliesst diese Folgearbeit fuer die produktive Runtime-Linie ab. Der neue Contract `xtend.surface.runtime-release-handoff.v1` dokumentiert die produktive Runtime-Linie aus Adapter Runtime, nativer Materialisierung, Persistenz, Lazy Hydration, Route Lifecycle, Stack Policy, Layout Engines, Remote Policy und Browser Lab.

```bash
node scripts/run_xtend_tests.js surface-runtime-release-handoff --json
```

Damit bleibt `WP-SM-09` der historische Authoring-Handoff, waehrend `WP-SM-19` den produktiven Runtime-Claim gatebar macht. Offene Scopes wie projektbezogene Pixel-Artefakte, Release-Owner-Signoff vor npm Publish und optionale weitere Surface-Typen bleiben im Runtime-Handoff explizit benannt.

## Referenzen

- [SurfaceManager Authoring Guide](./surface-manager-authoring-guide.md)
- [SurfaceManager Component Lab](./surface-manager-component-lab.md)
- [SurfaceManager Migration Guide](./surface-manager-migration-guide.md)
- [SurfaceManager Native RMT Surfaces](./surface-manager-native-rmt-surfaces.md)
- [SurfaceManager Runtime Release Handoff](./surface-manager-runtime-release-handoff.md)
