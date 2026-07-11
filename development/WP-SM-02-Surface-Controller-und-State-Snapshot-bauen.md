# WP-SM-02 Surface Controller und State Snapshot bauen

- Status: completed
- Datum: 9. Mai 2026
- Contract: `xtend.surface.controller.v1`
- Ergebnis: `surface-controller-state-snapshot-ready`
- Runtime: `components/xsurfacemanager-controller.js`
- Lokaler Gate: `node scripts/run_xtend_tests.js surface-controller --json`

## Ziel

Dieses Paket baut den internen Surface Controller fuer den XTend SurfaceManager. Der Controller verwaltet Surface Records, Lifecycle-Operationen, z-Order, aktives Surface, Layout Bounds, xstate Mirror und Fabric Diagnostics.

Der Schnitt bleibt `controller-only-no-custom-element`: Er ist Runtime-Unterbau fuer `WP-SM-03`, aber noch kein sichtbarer `x-surface-manager`.

## Artefakte

- `src/components/x-surface-manager/surface-record.ts`
- `src/components/x-surface-manager/surface-layout.ts`
- `src/components/x-surface-manager/surface-controller.ts`
- `components/xsurfacemanager-controller.js`
- `components/xsurfacemanager-controller.d.ts`
- `catalog/surface-manager-controller.js`
- `tests/components/surface_controller_suite.js`
- `development/XTend-SurfaceManager-Controller-und-State-Snapshot-Contract.md`
- `docs/en/surface-manager-controller.md`

## Implementierte Faehigkeiten

- Surface Registry fuer `window`, `side-panel`, `modal`, `dialog`, `drawer`, `popover`, `tooltip`
- RMT Component Record Normalisierung ueber `metadata.surface`
- `registerSurface`, `openSurface`, `closeSurface`, `focusSurface`, `updateSurface`
- `moveSurface`, `resizeSurface`, `minimizeSurface`, `maximizeSurface`, `restoreSurface`
- `snapshot` und `dispose`
- z-Order und aktive Surface Verwaltung
- xstate Mirror fuer Registry, Active, State, Bounds, Lifecycle, Diagnostics und Snapshot
- optionale Fabric Diagnostics ueber `emitDiagnostic`
- DOM-freie Runtime ohne Custom-Element-Registrierung

## Done Criteria

- Der Runtime-Controller laesst sich in Node laden und ausfuehren.
- Der Controller kann die WP-SM-01 Workbench-Surfaces registrieren.
- Zwei Windows und ein SidePanel koennen per Controller-Lifecycle verwaltet werden.
- State-Commits schreiben stabile `xtend.surface.*` Keys nach xstate.
- Snapshots tragen `xtend.surface.snapshot.v1`.
- Diagnostics tragen `xtend.surface.diagnostic.v1`.
- Keine rohen Metadata-Payloads oder DOM Nodes werden in Snapshot/State serialisiert.
- Package, Scaffold, Docs, Runner und Referenzregister spiegeln WP-SM-02.
- Der lokale Gate `node scripts/run_xtend_tests.js surface-controller --json` ist gruen.

## Handoff nach WP-SM-03

`WP-SM-03` sollte nun `x-surface-manager` und `x-surface-window` als sichtbare Komponenten auf diesem Controller aufbauen. Die Komponenten sollen:

- den Controller instanziieren und an Child Surfaces weiterreichen
- Layer-Container und Slots bereitstellen
- Surface Events aus Controller-Ergebnissen emittieren
- Fokus, Keyboard-Regeln und sichtbare Window-Chrome implementieren
- den XTendLoader-Ensure-Pfad fuer dynamische Surface-Inhalte vorbereiten
