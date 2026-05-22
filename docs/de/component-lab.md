# XTend Component Lab

Contract: `xtend.docs.component-lab.v1`

Das Component Lab ist ab `WP-E10-12` der lokale Preview- und Inspect-Pfad fuer TypeScript-first XTend-Komponenten. Es verbindet Component Contract v2, RMT Metadata, Fabric/Lane Context, Lifecycle Telemetry, A11y-Profile und Performance-Profile in einem Shell-first RMT-Pilot.

## Pilot-Artefakte

- Plan-Modul: `xtend-builder/preview/component-lab.js`
- RMT Fixture: `tests/fixtures/rmt-component-lab-pilot.rmt`
- Contract: `development/XTend-Component-Lab-und-RMT-Inspector-Pilot.md`
- Gate: `node scripts/run_xtend_tests.js component-lab-rmt-inspector --json`

## Preview Targets

Das Lab startet mit den neun `enterprise-ready` Komponenten aus Epic 10:

- `x-select`
- `x-checkbox`
- `x-radio`
- `x-textarea`
- `x-status`
- `x-progress`
- `x-tooltip`
- `x-popover`
- `x-drawer`

Jeder Target-Eintrag verweist auf Runtime, TypeScript Source, RMT Metadata, Contract, A11y, Performance, Fixture Data, Browser-Fixture, Docs, Public Types und Component-Suite.

## RMT Inspector

Der RMT Inspector zeigt im Pilot die Domains:

- `manifest`
- `adapters`
- `components`
- `routes`
- `schedules`
- `templates`
- `diagnostics`

RMT bleibt dabei host-neutral. Der Kernel importiert keine XTend-Klassen und keine XTend-Typen. Execution, DOM-Materialisierung, XRouter-Registrierung und Fabric-Laufzeit bleiben Adapteraufgabe.

## Panels

| Panel | Zweck |
|-------|-------|
| `component-preview` | Preview Target, Fixture und Component Contract anzeigen |
| `rmt-inspector` | RMT-Dokument, Routes, Schedules und Templates inspizieren |
| `telemetry` | Component Lifecycle Records und Fabric Snapshots sichtbar machen |
| `a11y` | Rollen, Keyboard, Screenreader-Signale und Pflichtassertions zeigen |
| `performance` | Budgetklasse, Lane, Hydration Policy und Messpunkte zeigen |
| `source-links` | Runtime-, TS-, RMT-, Docs-, Types- und Suite-Pfade verlinken |

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js component-lab-rmt-inspector --json
```

Der Gate validiert den Plan, das RMT-Fixture, die neun Preview Targets, alle Panels, Inspector-Domains, Package-Metadaten, Runner-Registrierung und Referenzpfade.

## Epic 11 UX Inspector

Ab `WP-E11-13` liegt zusaetzlich der UX Inspector `xtend.epic11.component-lab-ux-inspector.v1` vor.

Artefakte:

- Plan-Modul: `xtend-builder/preview/component-lab-ux-inspector.js`
- RMT Fixture: `tests/fixtures/rmt-component-lab-ux-inspector.rmt`
- Contract: `development/XTend-Component-Lab-UX-Inspector.md`
- Gate: `node scripts/run_xtend_tests.js component-lab-ux-inspector --json`

Der UX Inspector arbeitet ueber 31 `enterprise-ready` Komponenten aus den fuenf Epic-11-Familien:

- Form Controls
- Feedback und Status
- Navigation und Routing
- Overlay und Interaction
- Layout, Display und Media

Die Panels erweitern den alten Pilot um `ux-family-matrix`, `state`, `styling` und `component-network`. Die Inspector-Domains sind `shell`, `style`, `a11y`, `performance`, `state`, `componentNetwork`, `rmtAuthoring`, `fabricTelemetry`, `diagnostics` und `sourceLinks`.

```bash
node scripts/run_xtend_tests.js component-lab-ux-inspector --json
```

Auch diese Schicht bleibt shell-first, lokal und host-neutral. RMT beschreibt Shell, Routes, Templates und Schedules; XTend-Komponenten laufen ueber Adapter ausserhalb des Kernels.

## SurfaceManager Component Lab

Ab `WP-SM-09` gibt es eine Surface-spezifische Lab-Fixture:

- Docs: [SurfaceManager Component Lab](./surface-manager-component-lab.md)
- Fixture: `tests/fixtures/rmt-surface-manager-component-lab.rmt`
- Contract: `xtend.surface.component-lab-fixture.v1`
- Gate: `node scripts/run_xtend_tests.js surface-release-handoff --json`

Die Panels `surface-preview`, `native-rmt-inspector`, `migration-diff`, `quality-gates` und `source-links` zeigen die SurfaceManager-Linie als App-Shell-Lab: native `surfaces[*]`, kompatible `components[*].metadata.surface` Records, `x-surface-manager`, Windows, SidePanels und Overlay-Bridge bleiben zusammen pruefbar, ohne eine produktive `xtend.surface` Runtime zu behaupten.

## Handoff

Das Lab ist noch kein produktiver Browser-Lab-Server. Es ist der gatebare Pilot fuer `WP-E10-13`, in dem die RMT-first Demo-App ohne manuelle Shell-Sonderlogik gebaut wird.
