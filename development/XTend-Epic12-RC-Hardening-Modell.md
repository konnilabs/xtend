# XTend Epic 12 RC-Hardening-Modell

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.epic12.rc-hardening-model.v1`
- Workpackage: `WP-E12-01`
- Bezug:
  - `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
  - `development/XTend-Epic11-Abschluss-und-Enterprise-UX-Handoff.md`
  - `development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md`
  - `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md`
  - `development/XTend-Release-Checklist-und-SemVer-Policy.md`
  - `docs/epic11-enterprise-ux-handoff.md`
  - `docs/en/component-long-tail-migration.md`
  - `catalog/epic11-enterprise-ux-handoff.js`
  - `catalog/component-long-tail-migration.js`

## Zweck

Dieses Modell definiert, wann die aus Epic 11 akzeptierten Long-Tail-Restpunkte nicht mehr nur geplant, sondern release-kandidatenfaehig gehaertet sind.

Epic 12 ist kein neues Breitenfeature. Es ist die kontrollierte Umwandlung des Modus `completed-with-accepted-long-tail-handoff` in konkrete Runtime-, Visual- und RC-Readiness.

## Reifegrade

| Reife | Bedeutung | Einsatz |
|-------|-----------|---------|
| `handoff-accepted` | Restpunkt ist dokumentiert, priorisiert und gatebar | Ausgangspunkt aus Epic 11 |
| `runtime-ready` | Runtime, Types, Fixture, Component-Suite, A11y- und Performance-Profile sind geschlossen | Abschluss pro Long-Tail-Komponente |
| `visual-ready` | Browser-Smokes, Theme-Matrix und Snapshot-Pfad decken zentrale States ab | sichtbare Regression |
| `rc-candidate-ready` | lokale Gates, Docs, Migration Notes und RC-Matrix sind gruend | Release Candidate Entscheidung |
| `deferred-with-owner` | Restpunkt bleibt bewusst offen, hat Owner, Risiko und Gate | nur fuer RC0-Ausnahmen |

## Komponenten-Startzustand

| Komponente | Epic-11-Status | Restdimension | Epic-12-Ziel |
|------------|----------------|---------------|--------------|
| `x-tabs` | `browser-visual-ready` nach `WP-E12-03` | Snapshot-Automation ueber WS5 | `visual-ready` |
| `x-theme` | `runtime-ready` nach `WP-E12-05` | Snapshot-/Design-Token-Produktisierung ueber WS5/WS6 | `visual-ready` |
| `x-button` | `runtime-ready` nach `WP-E12-06` | Snapshot-/Theme-Matrix-Produktisierung ueber WS5 | `visual-ready` |
| `x-menu` | `runtime-ready` nach `WP-E12-07` | Snapshot-/Theme-Matrix-Produktisierung ueber WS5 | `visual-ready` |
| `xstate` | `contract-gated` nach `WP-E12-08` | A11y-/Performance-Profilentscheidung fuer Infrastruktur-Boundary | `runtime-ready` als Boundary-Probe |
| `x-utils` | `typed-contract-gated` nach `WP-E12-09` | Performance-Profilentscheidung fuer Utility-Boundary | `runtime-ready` als Boundary-Probe |

## Gate-Reihenfolge

### P0 Runtime Closure

1. `x-tabs` Performance Profile und Runtime Budget: abgeschlossen in `WP-E12-02`
2. `x-tabs` Browser-, Keyboard-, A11y- und Theme-Matrix-Smokes: abgeschlossen in `WP-E12-03`
3. `x-theme` A11y, High Contrast und Reduced Motion: abgeschlossen in `WP-E12-04`
4. `x-theme` Performance Profile und Theme Propagation: abgeschlossen in `WP-E12-05`

### P1 Runtime Closure

1. `x-button` Interaction Budget: abgeschlossen in `WP-E12-06`
2. `x-menu` Keyboard Navigation und Router-Kompatibilitaet: abgeschlossen in `WP-E12-07`
3. `xstate` Boundary-Probe: abgeschlossen in `WP-E12-08`
4. `x-utils` Utility-Probe: abgeschlossen in `WP-E12-09`

### Visual Closure

1. Visual Snapshot Automation Contract: abgeschlossen in `WP-E12-10`
2. Snapshot Fixture und lokaler Diff-Runner: abgeschlossen in `WP-E12-11`
3. Enterprise Design System Token Productization: abgeschlossen in `WP-E12-12`
4. RMT DSL Authoring Polish: abgeschlossen in `WP-E12-13`
5. Einbindung in RC Gate Matrix

### Release Candidate Closure

1. RC0 Gate Matrix: abgeschlossen in `WP-E12-14`
2. Docs, Migration Notes und Enterprise Adoption: abgeschlossen in `WP-E12-15`
3. Epic-12-Abschlussreview und RC0-Handoff: abgeschlossen in `WP-E12-16`

## Pflichtdimensionen fuer `runtime-ready`

Eine Long-Tail-Komponente ist `runtime-ready`, wenn:

- Source bleibt lokal und ESM-kompatibel.
- Public Types sind vorhanden oder die Boundary-Ausnahme ist dokumentiert.
- Component-Level-Suite und Fixture pruefen die relevante Runtime-Flaeche.
- A11y-Profil ist vorhanden oder bei nicht-visuellen Modulen als Boundary-Probe begruendet.
- Performance-Profil ist vorhanden.
- RMT/Fabric-Metadaten bleiben Adapterdaten.
- `catalog-coverage` verliert die jeweilige Restdimension.
- `component-long-tail-migration` aktualisiert den Status.

## Pflichtdimensionen fuer `visual-ready`

Eine sichtbare Komponente ist `visual-ready`, wenn:

- relevante Browser-Smokes vorhanden sind
- Theme-, Motion-, Density- und Viewport-Kombinationen in der Matrix liegen
- Snapshot-Automation einen lokalen, deterministischen Pfad besitzt
- keine visuelle Regression auf externen Diensten oder CDN-Pfaden beruht

## Pflichtdimensionen fuer `rc-candidate-ready`

Der Epic ist `rc-candidate-ready`, wenn:

- alle P0-Restpunkte geschlossen sind
- P1-Restpunkte geschlossen oder mit Owner als `deferred-with-owner` akzeptiert sind
- Visual Snapshot Gate existiert
- RC0 Gate Matrix lokal ausfuehrbar ist
- Docs und Migration Notes aktuell sind
- `private: true` bis Release Owner Acceptance bestehen bleibt

## Nicht-Ziele

- kein Publish in Epic 12
- kein Big-Bang-Rewrite aller Legacy-Komponenten
- keine XTend-Typimporte in den RMT Kernel
- keine Netzwerk- oder CDN-Abhaengigkeit fuer lokale Gates
- keine kuenstliche visuelle Shell fuer `xstate` und `x-utils`

## Startentscheidung

`WP-E12-02` bis `WP-E12-16` sind abgeschlossen. `x-tabs` ist nicht mehr der P0-Restpunkt in `p0-performance-profile-coverage` und besitzt browsernahe Keyboard-, A11y- und Theme-Matrix-Abdeckung. `x-theme` hat A11y, Performance, Theme Propagation und Density Boundary geschlossen und ist im Catalog `enterprise-ready`. `x-button` besitzt ein Performance- und Interaction-Budget, Fabric-Messpunkte, Public Types und RMT-Metadaten. `x-menu` besitzt Performance Profile, Keyboard Navigation, Router-Kompatibilitaet, Fabric-Messpunkte, Public Types und RMT-Metadaten. `xstate` besitzt Suite, Fixture, Public Types, Lifecycle Events, Fabric Diagnostics und einen RMT State Adapter und ist als nicht-visuelle Boundary-Probe `contract-gated`. `x-utils` besitzt Utility Contract, Import Policy, Fixture und Public Types und ist als Utility-Boundary `typed-contract-gated`. `WP-E12-10` hat die globale Snapshot-Automation als Contract, Matrix, Diff-Strategie und Artefaktpolitik eingefroren. `WP-E12-11` hat daraus einen lokalen DOM-first Snapshot Gate mit Fixture und JSON-Baseline gebaut. `WP-E12-12` hat die Design-System-Token als `xtend.design-tokens.product-contract.v1` produktisiert und `x-theme`, Theme Matrix sowie Snapshot Baseline auf gemeinsame `--xtend-*` Namen konsolidiert. `WP-E12-13` hat den RMT DSL Authoring Polish als `xtend.rmt.dsl-authoring-polish.v1` eingefroren und Alias-, Diagnose-, Token- und XRouter-/XLink-Sugar fuer Component Shells vorbereitet. `WP-E12-14` hat die RC0 Gate Matrix als `xtend.epic12.rc0-gate-matrix.v1` geschnitten und PR Fast, Full Release, Snapshot, RMT Authoring, Conditional Network, Package Dry Run sowie Known Residual Policy zusammengefuehrt. `WP-E12-15` hat Docs, Migration Notes und Enterprise Adoption als `xtend.epic12.docs-adoption.v1` auf den RC0-Schnitt aktualisiert. `WP-E12-16` hat Epic 12 als `xtend.epic12.rc0-handoff.v1` abgeschlossen.

Epic 12 ist abgeschlossen. Der Status ist `ready-for-release-owner-review-not-publish`; naechste Entscheidung ist `release-owner-acceptance`.

## Verifikation

Mindestgate fuer dieses Modell:

```bash
node scripts/run_xtend_tests.js references --json
```

Spaetere Workpackages sollen daraus dedizierte Gates ableiten:

- `x-tabs-runtime-hardening`
- `x-theme-runtime-hardening`
- `long-tail-boundary-probes`
- `visual-snapshots`
- `design-tokens`
- `rmt-dsl-authoring-polish`
- `rc0-gate-matrix`

## Handoff

Dieses Modell ist Startcontract fuer:

- `WP-E12-02` `x-tabs` Performance Profile und Runtime-Budget finalisieren: abgeschlossen
- `WP-E12-03` `x-tabs` Browser-, Keyboard-, A11y- und Theme-Matrix-Smokes haerten: abgeschlossen
- `WP-E12-04` `x-theme` A11y-, High-Contrast- und Reduced-Motion-Verhalten haerten: abgeschlossen
- `WP-E12-05` `x-theme` Performance Profile, Theme Propagation und Density Boundary finalisieren: abgeschlossen
- `WP-E12-06` `x-button` Performance Profile und Interaction Budget nachziehen: abgeschlossen
- `WP-E12-07` `x-menu` Performance Profile, Keyboard Navigation und Router-Kompatibilitaet haerten: abgeschlossen
- `WP-E12-08` `xstate` Adapter-, Typing- und Lifecycle-Boundary-Probe bauen: abgeschlossen
- `WP-E12-09` `x-utils` Utility-, Import-Policy- und Fixture-Probe bauen: abgeschlossen
- `WP-E12-10` Visual Snapshot Automation Contract: abgeschlossen
- `WP-E12-11` Snapshot Fixture und lokaler Diff-Runner: abgeschlossen
- `WP-E12-12` Enterprise Design System Token Productization: abgeschlossen
- `WP-E12-13` RMT DSL Authoring Polish fuer Component Shells vorbereiten: abgeschlossen
- `WP-E12-14` Release Candidate Gate Matrix fuer RC0 schneiden: abgeschlossen
- `WP-E12-15` Docs, Migration Notes und Enterprise Adoption Guide aktualisieren: abgeschlossen
- `WP-E12-16` Epic-12-Abschlussreview und RC0-Handoff: abgeschlossen

Abschlusscontract: `xtend.epic12.rc0-handoff.v1`.
