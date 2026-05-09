# WP-E10-12 - Component Lab und RMT Inspector Pilot anlegen

Status: `completed`

Contract: `xtend.epic10.component-lab-rmt-inspector.v1`

Gate: `node scripts/run_xtend_tests.js component-lab-rmt-inspector --json`

## Ziel

WP-E10-12 legt den lokalen Preview- und Inspect-Pfad fuer die erste Epic-10-Komponentenwelle an. Entwickler koennen damit Component Contracts, RMT Records, Schedules, Telemetry, A11y-Hinweise und Performance-Hinweise als zusammenhaengenden Pilot inspizieren.

## Umgesetzte Artefakte

| Artefakt | Pfad | Zweck |
|----------|------|-------|
| Builder-Modul | `xtend-builder/preview/component-lab.js` | maschinenlesbarer Component-Lab- und Inspector-Plan |
| RMT Fixture | `tests/fixtures/rmt-component-lab-pilot.rmt` | Shell-first Lab-App als RMT-Dokument |
| Contract-Dokument | `development/XTend-Component-Lab-und-RMT-Inspector-Pilot.md` | fachlicher Vertrag fuer Lab, Inspector und Panels |
| Gate | `tests/builder/component_lab_rmt_inspector_suite.js` | lokaler Contract-, Fixture-, Docs- und Package-Gate |
| Entwicklerdocs | `docs/component-lab.md` | offizieller Einstieg fuer Component Lab und Inspector |

## Entscheidungen

- Das Component Lab bleibt ein lokaler Pilot und kein produktiver Browser-Lab-Server.
- RMT rendert Shell-first und besitzt nur Records, Routes, Templates, Schedules und Diagnostics.
- XTend-Komponenten laufen weiterhin ueber den Host-Adapter `xtend.component`.
- XRouter bleibt ueber `xtend.xrouter` angebunden.
- Telemetry wird ueber `snapshot.componentTelemetry` und `xtend.component.lifecycle-telemetry.v1` sichtbar.
- A11y- und Performance-Hinweise werden aus den bestehenden Component Contracts, P0-Wave-Stubs und TS-Artefakten abgeleitet.
- Die Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Preview Targets

Das Lab bindet die komplette erste `enterprise-ready` Referenzlinie:

- `x-select`
- `x-checkbox`
- `x-radio`
- `x-textarea`
- `x-status`
- `x-progress`
- `x-tooltip`
- `x-popover`
- `x-drawer`

## Panels

- `component-preview`
- `rmt-inspector`
- `telemetry`
- `a11y`
- `performance`
- `source-links`

## Validierung

```bash
node scripts/run_xtend_tests.js component-lab-rmt-inspector --json
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

WP-E10-12 ist abgeschlossen. `WP-E10-13` kann nun die produktive RMT-first Demo-App ohne manuelle Shell-Sonderlogik auf dem Lab-/Inspector-Pilot aufbauen.
