# XTend Component Lab und RMT Inspector Pilot

Contract: `xtend.epic10.component-lab-rmt-inspector.v1`

Status: `accepted-pilot`

Workpackage: `WP-E10-12`

## Ziel

Das Component Lab ist der lokale Inspect- und Preview-Pfad fuer Epic 10. Es verbindet die erste `enterprise-ready` Komponentenlinie mit dem RMT App Authoring Contract, ohne den RMT-Kernel an XTend zu koppeln.

Der Pilot ist bewusst Shell-first modelliert: RMT beschreibt Shell, Routes, Preview Targets, Inspector Panels, Schedules und Diagnostics. XTend fuehrt Komponenten, XRouter, Fabric und DOM-Materialisierung weiter im Host aus.

## Component Lab Shell

- RMT Fixture: `tests/fixtures/rmt-component-lab-pilot.rmt`
- Builder-Modul: `xtend-builder/preview/component-lab.js`
- Gate: `node scripts/run_xtend_tests.js component-lab-rmt-inspector --json`
- Render Mode: `shell-first`
- Runtime Policy: `localOnly: true`, `externalNetworkAllowed: false`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

Die Shell verwendet `lab.shell`, `lab.router` und `lab.preview.host`. Sie ist kein produktiver Browser-Lab-Server, sondern ein gatebarer Pilot, der die spaetere UI-Oberflaeche fachlich festlegt.

## Preview Targets

Das Lab bindet die vollstaendige erste Epic-10-Komponentenwelle:

| Target | Runtime | TS Source | RMT Metadata | Fixture |
|--------|---------|-----------|--------------|---------|
| `x-select` | `components/xselect.js` | `src/components/x-select/x-select.ts` | `src/components/x-select/x-select.rmt.ts` | `tests/components/fixtures/xselect.component.html` |
| `x-checkbox` | `components/xcheckbox.js` | `src/components/x-checkbox/x-checkbox.ts` | `src/components/x-checkbox/x-checkbox.rmt.ts` | `tests/components/fixtures/xcheckbox.component.html` |
| `x-radio` | `components/xradio.js` | `src/components/x-radio/x-radio.ts` | `src/components/x-radio/x-radio.rmt.ts` | `tests/components/fixtures/xradio.component.html` |
| `x-textarea` | `components/xtextarea.js` | `src/components/x-textarea/x-textarea.ts` | `src/components/x-textarea/x-textarea.rmt.ts` | `tests/components/fixtures/xtextarea.component.html` |
| `x-status` | `components/xstatus.js` | `src/components/x-status/x-status.ts` | `src/components/x-status/x-status.rmt.ts` | `tests/components/fixtures/xstatus.component.html` |
| `x-progress` | `components/xprogress.js` | `src/components/x-progress/x-progress.ts` | `src/components/x-progress/x-progress.rmt.ts` | `tests/components/fixtures/xprogress.component.html` |
| `x-tooltip` | `components/xtooltip.js` | `src/components/x-tooltip/x-tooltip.ts` | `src/components/x-tooltip/x-tooltip.rmt.ts` | `tests/components/fixtures/xtooltip.component.html` |
| `x-popover` | `components/xpopover.js` | `src/components/x-popover/x-popover.ts` | `src/components/x-popover/x-popover.rmt.ts` | `tests/components/fixtures/xpopover.component.html` |
| `x-drawer` | `components/xdrawer.js` | `src/components/x-drawer/x-drawer.ts` | `src/components/x-drawer/x-drawer.rmt.ts` | `tests/components/fixtures/xdrawer.component.html` |

Alle Targets muessen im Component Catalog `enterprise-ready` sein und ihren Component Contract v2, RMT Metadata, Public Types, Fixture, A11y-Profil und Performance-Profil referenzieren.

## RMT Inspector

Der Inspector ist als Panel `lab.panel.rmt.inspector` modelliert und liest die folgenden Domains:

- `manifest`
- `adapters`
- `components`
- `routes`
- `schedules`
- `templates`
- `diagnostics`

Der Inspector darf RMT-Dokumente normalisieren und anzeigen, aber keine XTend-Komponenten importieren. Adapter-Execution, XRouter-Registrierung, DOM-Materialisierung und Fabric-Ausfuehrung bleiben Host-Aufgabe.

## Telemetry Panel

Das Telemetry Panel nutzt:

- `xtend.component.lifecycle-telemetry.v1`
- `xtend.fabric.telemetry-snapshot.v1`
- `xtend.performance.regression-report.v1`
- Snapshot-Pfad `snapshot.componentTelemetry`

Pflichtoperationen sind `mount`, `hydrate`, `render`, `update`, `event`, `error` und `unmount`. Das Lab zeigt damit spaeter, welche Komponente in welcher Lane, Fiber und Schedule-Referenz aktiv war.

## A11y/Performance Hinweise

A11y/Performance Hinweise werden aus Component Contract v2, P0-Wave-Stubs und den TS-Artefakten abgeleitet. Der Pilot definiert nur den Datenpfad:

- A11y Panel: Rollen, Keyboard-Erwartungen, Screenreader-Signale und Pflichtassertions
- Performance Panel: Budgetklasse, Lane, Hydration Policy und kritische Messpunkte
- Source Links: Runtime, TS Source, RMT Metadata, Fixture, Docs, Types und Suite

## Gate

```bash
node scripts/run_xtend_tests.js component-lab-rmt-inspector --json
```

Der Gate prueft:

- Plan-Schema `xtend.epic10.component-lab-rmt-inspector.v1`
- Gate-Schema `xtend.epic10.component-lab-rmt-inspector-gate.v1`
- neun Preview Targets in Epic-10-Reihenfolge
- alle Targets `enterprise-ready`
- Shell-first RMT Fixture
- Adapter, Components, Routes, Schedules und Templates
- RMT Inspector Domains
- Telemetry-, A11y-, Performance- und Source-Link-Panels
- Package-, Runner-, Scaffold-, Docs- und Referenzpfad-Integration

## Grenzen

- kein produktiver Lab-Server
- keine Browser-Automation fuer jede Preview
- keine RMT-Kernel-Imports aus XTend
- keine automatische TypeScript-Kompilation
- keine produktive RMT-first Demo-App

Die produktive Demo folgt in `WP-E10-13`.
