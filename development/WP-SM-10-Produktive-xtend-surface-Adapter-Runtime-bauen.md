# WP-SM-10 - Produktive `xtend.surface` Adapter Runtime bauen

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.surface.adapter-runtime.v1`
- Report: `xtend.surface.adapter-runtime-report.v1`
- Adapter Contract: `xtend.surface.adapter.v1`
- Local Gate: `node scripts/run_xtend_tests.js surface-adapter-runtime --json`
- Package Script: `npm run test:surface-adapter-runtime`
- Backlog: `development/BACKLOG-XTend-SurfaceManager-App-Shell-und-RMT-Surface-Runtime.md`
- Boundary: `no-second-surface-registry`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `no-dom-materialization-in-wp-sm-10`
- Next: `WP-SM-11`

## Ziel

`WP-SM-10` schliesst den bisherigen Handoff fuer `xtend.surface` als produktive Host-Adapter-Runtime. Der Adapter konsumiert native RMT `surfaces[*]`, erzeugt daraus eine uebertragbare Surface-Mapping-Schicht und fuehrt Runtime-Operationen gegen ein vorhandenes `x-surface-manager` Ziel aus.

Die Runtime bleibt bewusst eine unterstuetzende XTend-UI-Schicht:

- SurfaceController und `x-surface-manager` bleiben die einzige operative Surface Registry.
- RMT bleibt deklarativ und importiert keine XTend-Komponenten.
- Fabric bleibt fuer Diagnostics, Fibers, Lanes, Telemetry und Backpressure zustaendig.
- DOM-Materialisierung aus `surfaces[*]` bleibt Folgearbeit in `WP-SM-11`.

## Scope

- `createRmtSurfaceAdapter`
- Mapping von `surfaces[*]` inklusive Component-, Manager-, Route- und Schedule-Referenzen
- Operationen:
  - `registerSurface`
  - `openSurface`
  - `closeSurface`
  - `focusSurface`
  - `moveSurface`
  - `resizeSurface`
  - `dockSurface`
  - `undockSurface`
  - `snapshotSurfaces`
  - `emitDiagnostic`
- Runtime-Metadaten `runtimeImplemented: true`
- Diagnostics fuer fehlende IDs, Manager, Components und Runtime-Ziele
- ESM-, Browser- und Typ-Artefakte

## Nicht im Scope

- automatische Erzeugung von `x-surface-manager`, `x-surface-window` oder `x-side-panel` aus RMT Records
- Route-bound Lazy Loading
- Persistenz oder Restore
- Remote Runtime Execution
- eigene Surface Registry im RMT Runtime Registry Snapshot

## Definition of Done

- `xtendrmt/rmt-core.esm.js`, `xtendrmt/rmt-runtime.esm.js` und `xtendrmt/rmt-runtime.browser.js` exponieren `createRmtSurfaceAdapter`.
- `xtendrmt/rmt-core.d.ts` typisiert Surface Mapping und Adapter-Operationen.
- `xtendrmt/rmt-manifest.json` kennt den neuen Factory Export.
- Der Adapter registriert native Surface Records gegen ein `x-surface-manager` Ziel.
- `surface-adapter-runtime` prueft Mapping, Operations, Diagnostics, Runtime-Artefakte und Boundary-Regeln.
- `surface-native-rmt` darf weiterhin den WP-SM-08-Handoff-Contract pruefen, ohne dessen `runtimeImplemented: false` nachtraeglich umzudeuten.
