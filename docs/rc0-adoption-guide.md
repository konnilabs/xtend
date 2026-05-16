# RC0 Adoption Guide

- Contract: `xtend.epic12.docs-adoption.v1`
- Report: `xtend.epic12.docs-adoption-report.v1`
- Workpackage: `WP-E12-15`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic12-docs-adoption --json`

Dieser Guide ist der produktnahe Einstieg fuer Teams, die XTend nach Epic 12 als Release-Candidate-Kandidaten evaluieren. Er verbindet die Migration Notes aus Long-Tail Runtime, Visual Snapshots, Design Tokens, RMT DSL Authoring Polish und RC0 Gate Matrix.

RC0 bleibt ein lokaler Review-Kandidat. `private-until-release-owner-approval` bleibt aktiv; ein gruener Gate-Lauf ist keine Publish-Freigabe.

## Migration Notes

### Long-Tail Runtime Closure

Geschlossen:

- `x-tabs`: Performance Profile, Keyboard, Browser-Smoke, Theme Matrix
- `x-theme`: A11y, Reduced Motion, Forced Colors, Performance, Theme Propagation, Density Boundary
- `x-button`: Performance Budget, Interaction Budget, Fabric Measurement, RMT Metadata
- `x-menu`: Performance, Keyboard Navigation, Router-Kompatibilitaet, Fabric Measurement, RMT Metadata

Akzeptierte RC0-Residuals:

- `xstate`: nicht-visuelle Boundary-Probe, `contract-gated`
- `x-utils`: Utility-Boundary, `typed-contract-gated`

Diese Residuals sind keine versteckten Blocker. Sie bleiben sichtbar, weil Infrastrukturmodule nicht kuenstlich als UI-Shells behandelt werden.

### DOM-first Visual Snapshots

Der RC0 Snapshot-Pfad ist DOM-first:

```bash
node scripts/run_xtend_tests.js visual-snapshots --json
node scripts/run_xtend_tests.js design-tokens --json
```

Pixel-Baselines sind optional lokal. Die reviewbare Baseline liegt in `tests/browser/visual-baselines/visual-snapshots.dom-baseline.json`.

### Design Token Productization

Neue Komponenten und RMT-Shells nutzen die `--xtend-*` Tokenlinie. Theme Packs, Density Packs, High Contrast, Forced Colors und CSS Parts sind oeffentliche Styling-Oberflaechen und brauchen Migration Notes, wenn sie veraendert werden.

### RMT DSL Authoring Polish

Neue RMT-App-Dokumente koennen Shells, Routes, Links, Outlets, Components, Slots, Commands, Hydration und Lanes ueber die DSL-Polish-Schicht authoren. XTendRMT bleibt framework-agnostisch: Der Kernel importiert keine XTend-Typen und keine XRouter-Implementierung.

### RC0 Gate Matrix

Vor dem Owner Review:

```bash
node scripts/run_xtend_tests.js epic12-docs-adoption --json
node scripts/run_xtend_tests.js rc0-gate-matrix --json
npm run test:release:full:report
npm run pack:dry-run
```

Conditional Network Gates:

```bash
npm audit --audit-level=moderate
npm sbom --sbom-format=cyclonedx --json
```

Wenn Netzwerkzugriff nicht verfuegbar ist, bleibt RC0 lokal reviewbar; Publish bleibt blockiert.

## Component Author Checklist

| Check | Pflicht |
|-------|---------|
| `xtend-loader.js` und lokales Manifest verwenden | ja |
| Types, Events, A11y und Performance dokumentieren | ja |
| Design Tokens und CSS Parts als Public API behandeln | ja |
| Fabric-Lanes und RMT-Schedule-Hints korrekt setzen | ja |
| Snapshot- und Theme-Matrix-Auswirkungen pruefen | ja |
| Breaking Changes mit Migration Notes markieren | ja |

## App Author Checklist

| Check | Pflicht |
|-------|---------|
| App Shell nach Moeglichkeit Shell-first in RMT beschreiben | ja |
| XRouter-Routen ueber native RMT `routes` Records fuehren | ja |
| Parsedown, Rich HTML oder Media als scheduled Content-Komponenten behandeln | ja |
| Trusted-DOM-Boundary fuer `html_fragment` pruefen | ja |
| `rmt-dsl-authoring-polish` und `docs-rmt-pilot` fuer RMT-Pfade ausfuehren | ja |

## Known Residual Policy

RC0 akzeptiert:

- `xstate`
- `x-utils`
- `xtend.component.hydrate`

Die Hydration-Warnung bleibt akzeptiert, solange sie unter der Fail-Schwelle und unter `maxWarningCount = 2` bleibt. Failures sind nicht erlaubt.

## Handoff zu WP-E12-16

`WP-E12-16` hat aus diesem Guide, der [RC0 Gate Matrix](./rc0-gate-matrix.md), dem Package Dry Run, den Conditional Network Gates und der Known Residual Policy den [Epic 12 RC0 Handoff](./epic12-rc0-handoff.md) fuer Release Owner gebaut.
