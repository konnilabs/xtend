# WP-E12-02 - x-tabs Performance Profile und Runtime-Budget finalisieren

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung`
- Backlog: `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
- Contract: `xtend.epic12.wp02.xtabs-performance-runtime-budget.v1`
- Bezug:
  - `development/XTend-Epic12-RC-Hardening-Modell.md`
  - `development/XTend-Epic11-Legacy-Long-Tail-Migrationsplan.md`
  - `development/XTend-Component-Catalog-Coverage-Matrix.md`
  - `docs/components/xtabs.md`
  - `catalog/component-catalog-coverage.js`
  - `catalog/component-long-tail-migration.js`
  - `catalog/component-regression-priority.js`

## Ziel

`WP-E12-02` schliesst den P0-Restpunkt `x-tabs` aus dem Epic-11-Handoff. Die Komponente erhaelt ein explizites Performance-Profil, Runtime-Budgets fuer Tab-Wechsel, Keyboard-Interaktion, Render Update und Hydration sowie RMT-/Fabric-Metadaten fuer shell-first Authoring.

## Umsetzung

Die Runtime `components/xtabs.js` wurde um folgende First-Class-Metadaten erweitert:

- `xtendComponentContract`
- `xtendRmtMetadata`
- `xtendComponentLifecycleTelemetry`
- `xtendScaffoldPerformanceProfile`

Das Performance-Profil nutzt:

| Feld | Wert |
|------|------|
| Schema | `xtend.performance.component-profile.v1` |
| Component Ref | `x-tabs` |
| Profile | `interactive`, `routing` |
| Budget Class | `critical` |
| Lane | `user-blocking` |
| Hydration Policy | `visible` |
| Tab-Switch Budget | `16 ms` |
| Keyboard Budget | `16 ms` |
| Render Update Budget | `28 ms` |

Die Runtime stellt zusaetzlich `getPerformanceBudget()` und `snapshotPerformance()` bereit. Damit koennen Fabric, Diagnostics oder spaetere Reporter-Adapter lokale Messpunkte aufnehmen, ohne dass der RMT-Kernel XTend-Typen importieren muss.

## Katalog-Fortschreibung

`x-tabs` verliert die Restdimension `performance`.

| Gate-Flaeche | Ergebnis |
|--------------|----------|
| `catalog-coverage` | `x-tabs` ist `enterprise-ready` |
| `component-long-tail-migration` | `x-tabs` ist nicht mehr offener Long-Tail-Eintrag |
| `regression-priority` | `x-tabs` braucht kein `performance-profile-authoring` mehr |
| `epic11-enterprise-ux-handoff` | P0 Performance Profile Coverage ist `met` |

Die offenen Long-Tail-Komponenten sind danach:

- `x-theme`
- `x-button`
- `x-menu`
- `xstate`
- `x-utils`

## Grenzen

- Keine harte XTend-Kopplung im XTendRMT Kernel.
- Kein TypeScript-Big-Bang-Refactor der Legacy-Runtime.
- Keine Browser-/Theme-Matrix-Ausweitung in diesem Paket; das folgt in `WP-E12-03`.
- Kein Publish oder Release-Candidate-Schnitt.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `xtendScaffoldPerformanceProfile` vorhanden | erfuellt |
| Hydration Policy und Lane-Ableitung vorhanden | erfuellt |
| Tab-Switch-, Keyboard- und Render-Budget vorhanden | erfuellt |
| Fabric Measurement vorbereitet | erfuellt ueber `snapshotPerformance()` und Lifecycle Telemetry |
| RMT Shell Authoring Metadata vorhanden | erfuellt ueber `xtendRmtMetadata.shellAuthoring` |
| `x-tabs` aus Long-Tail-Performance-Restpunkt entfernt | erfuellt |
| `WP-E12-03` startbar | erfuellt |

## Verifikation

```bash
node --check components/xtabs.js
node --check tests/components/priority_component_contracts.js
node --check tests/catalog/component_catalog_coverage_suite.js
node --check tests/catalog/component_long_tail_migration_suite.js
node --check tests/catalog/component_regression_priority_suite.js
node scripts/run_xtend_tests.js components catalog-coverage component-long-tail-migration regression-priority epic11-enterprise-ux-handoff references --json
```

## Ergebnis

`WP-E12-02` ist abgeschlossen. `x-tabs` ist performance-seitig `runtime-ready`, im Catalog `enterprise-ready` und kein offener Long-Tail-Performance-Restpunkt mehr. Das naechste Paket ist `WP-E12-03`.
