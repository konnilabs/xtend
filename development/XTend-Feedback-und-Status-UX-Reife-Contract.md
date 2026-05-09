# XTend Feedback und Status UX Reife Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.component.feedback-status-ux.v1`
- Report: `xtend.component.feedback-status-ux-report.v1`
- Workpackage: `WP-E11-09`
- Runtime-Profil: `xtendFeedbackStatusUxProfile`
- Fixture: `tests/fixtures/rmt-feedback-status-ux.rmt`
- Gate: `node scripts/run_xtend_tests.js feedback-status-ux --json`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

## Zweck

Dieser Contract hebt die Feedback- und Status-Familie auf die Epic-11-UX-Reife. Er verbindet sichtbare Shells, stabile Styling-Oberflaechen, echte Runtime-A11y, Performance-Profile, Component-Network-Events, Fabric-Lanes und RMT Shell Authoring fuer:

- `x-alert`
- `x-toast`
- `x-status`
- `x-progress`
- `x-spinner`

RMT beschreibt Shell, Events, Commands, A11y, Style und Schedule-Daten ueber `xtend.component`. XTend rendert und hydriert die Web Components. Der RMT Kernel importiert keine XTend-Typen.

## Contract Domains

Pflichtdomains sind:

- `shell`
- `style`
- `a11y`
- `liveRegion`
- `motion`
- `timeout`
- `dismiss`
- `statusSemantics`
- `events`
- `commands`
- `state`
- `rmt`
- `fabric`
- `performance`
- `docs`
- `tests`

## Live Regions

Feedback-Komponenten muessen Status semantisch wahrnehmbar machen:

- normale Hinweise nutzen `role="status"` und `aria-live="polite"`
- Fehler und kritische Warnungen nutzen `role="alert"` oder `aria-live="assertive"`
- dynamische Meldungen setzen `aria-atomic="true"`
- `x-progress` nutzt `role="progressbar"` plus `aria-valuetext`
- `x-spinner` spiegelt Busy-Zustaende ueber `aria-busy`

## Motion

Motion darf nicht die einzige Statusinformation sein.

Pflichten:

- `prefers-reduced-motion` stoppt Animationen oder macht sie funktional optional
- `forced-colors` bleibt lesbar
- Status wird nicht nur ueber Farbe kommuniziert
- Fokus und Dismiss-Aktionen bleiben bei High Contrast sichtbar

## Dismiss und Timeout

`x-alert`, `x-toast` und `x-status` muessen Dismiss-Pfade einheitlich melden:

- manuell: `reason: 'button'` oder `reason: 'manual'`
- automatisch: `reason: 'timeout'`
- lifecycle: `reason: 'connected'`
- Event-Details enthalten `source` und `stateKey`

## Status-Semantik

Die Familie nutzt ein gemeinsames Statusmodell:

| Komponente | Rolle | Statusfokus |
|------------|-------|-------------|
| `x-alert` | `alert` oder `status` | laenger sichtbare Hinweise, Warnungen und Fehler |
| `x-toast` | `status` oder `alert` | kurzlebige Hinweise |
| `x-status` | `status` oder `alert` | Inline-, Form- und Scheduler-Status |
| `x-progress` | `progressbar` | determinate und indeterminate Fortschritte |
| `x-spinner` | `status` | Busy-, Pause- und Resume-Signale |

## Events

Pflichtevents sind:

- `alert-shown`
- `alert-dismissed`
- `toast-shown`
- `toast-dismissed`
- `status-changed`
- `status-dismissed`
- `progress-changed`
- `progress-complete`
- `spinner-started`
- `spinner-stopped`
- `paused`
- `resumed`

Events muessen `bubbles: true`, `composed: true`, `source` und `stateKey` liefern.

## Commands

RMT- und Host-Adapter koennen folgende Commands abbilden:

- `announce`
- `dismiss`
- `update-status`
- `set-progress`
- `complete`
- `pause`
- `resume`
- `snapshot`

## RMT

Die Referenzfixture `tests/fixtures/rmt-feedback-status-ux.rmt` beschreibt eine Shell-first Feedback-Status-Oberflaeche. Pflichtschedules sind:

- `component.visible.mount`
- `component.idle.hydrate`
- `a11y.announce`
- `feedback.status.update`
- `feedback.progress.update`
- `diagnostics.snapshot`

RMT fuehrt keine Inline-Runtime aus. Der Host-Adapter `xtend.component` materialisiert die Custom Elements.

## Fabric

Fabric-Korrelation ist Pflicht:

- A11y-Announcements laufen ueber Lane `a11y`
- Status-Updates laufen ueber Lane `feedback`
- Progress kann im Hintergrund laufen
- Snapshots laufen ueber Lane `diagnostics`

Die Komponenten expose `xtendFeedbackStatusUxProfile` und behalten ihre `xtend.component.lifecycle-telemetry.v1`-Anbindung.

## Testing

Der Gate `feedback-status-ux` prueft:

- Factory und Validator
- RMT Fixture und Referenzauflosung
- Runtime-Profile der Zielkomponenten
- Live-Region-, Motion-, Forced-Colors- und CSS-Part-Oberflaechen
- Package-, Scaffold-, Runner-, Epic-, Backlog- und Dokumentationsanker

