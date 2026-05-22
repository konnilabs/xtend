# SurfaceManager Component Lab

- Contract: `xtend.surface.component-lab-fixture.v1`
- Release Contract: `xtend.surface.release-handoff.v1`
- Fixture: `tests/fixtures/rmt-surface-manager-component-lab.rmt`
- Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`

## Zweck

Das SurfaceManager Component Lab ist die statische Lab-Fixture fuer die SurfaceManager-Linie. Es zeigt, wie eine App Shell mit `x-surface-manager`, `x-surface-window`, `x-side-panel`, einem kompatiblen Dialog und nativen `surfaces[*]` Records beschrieben wird.

Die Fixture ist kein neuer Lab-Server. Sie erweitert den bestehenden Component-Lab-Gedanken um Surface-spezifische Authoring- und Migrationssicht.

## Panels

| Panel | Aufgabe |
|-------|---------|
| `surface-preview` | sichtbare Surface Shell mit WindowManager- und SidePanel-Komponenten pruefen |
| `native-rmt-inspector` | `surfaces[*]`, `adapters`, `components`, `routes` und `schedules` inspizieren |
| `migration-diff` | `components[*].metadata.surface` mit nativen Surface Records vergleichen |
| `quality-gates` | Gate-Kette von `surface-manager-quality` bis `surface-native-rmt` sichtbar machen |
| `source-links` | Doku-, Katalog-, Fixture-, Runtime- und Suite-Pfade verlinken |

## Fixture-Modell

`tests/fixtures/rmt-surface-manager-component-lab.rmt` enthaelt:

- vier Adapter: `xtend.component`, `xtend.xrouter`, `rmt.state-scheduler-diagnostics`, `xtend.surface`
- eine SurfaceManager-Komponente `surface.lab.manager`
- zwei Windows: `surface.lab.preview` und `surface.lab.rmtInspector`
- zwei SidePanels: `surface.lab.migrationPanel` und `surface.lab.qualityPanel`
- einen Dialog: `surface.lab.commandDialog`
- native `surfaces[*]` Records plus passende `components[*].metadata.surface` Dual Records

Die Fixture prueft die Authoring-Boundary. Sie behauptet keine produktive `xtend.surface` Runtime.

## Lokaler Ablauf

```bash
node scripts/run_xtend_tests.js surface-release-handoff --json
```

Der Gate validiert die Fixture ueber RMT-Normalisierung und Semantic Graph. Damit bleiben Surface-IDs, Component-Refs, Manager-Refs, Routes und Schedules sichtbar und maschinenpruefbar.
