# RMT Kernel Panic Recovery Incident Handoff

- Contract: `xtend.rmt.kernel-migration-authoring-incident-handoff.v1`
- Workpackage: `RKSH-WP-11`
- Local gate: `node scripts/run_xtend_tests.js rmt-kernel-handoff-docs --json`

Dieses Handoff beschreibt, wie Host-Teams Panic- und Recovery-Diagnostics auswerten, wenn die Kernel-Trust-Schicht fehlerhafte Outputs blockiert oder Recovery startet.

## Diagnostics-Kanaele

| Kanal | Zweck |
|-------|-------|
| `rmt.kernel.panic` | Panic-State, Trigger, Severity, Scope und blockierte Commits. |
| `rmt.kernel.recovery` | Recovery-Outcome, Snapshot-Nutzung, Fallback und Quarantaene. |
| `rmt.kernel.escalation` | Escalation Envelope aus Diagnostics Hub oder Command Bus. |
| `rmt.kernel.scheduler_failure` | `failed`, `aborted`, `panic_blocked` und Backpressure-Failure fuer Jobs. |

## Mindestfelder fuer Incident Review

- `panicId`
- `correlationId`
- `state`
- `severity`
- `scope`
- `trigger`
- `blockedCommitCount`
- `recoveryAction`
- `quarantined`
- `hostNotified`
- `affectedJobs`
- `firstSeenAt`
- `lastSeenAt`

## Incident Severity

| Severity | Bedeutung | Erwartete Reaktion |
|----------|-----------|--------------------|
| `warning` | Output wurde korrigiert oder sanitisiert. | Verdicts beobachten, keine Eskalation noetig. |
| `degraded` | Output wurde blockiert, UI bleibt mit sicherem Fallback nutzbar. | Host-Team prueft Authoring oder Remote Source. |
| `critical` | Surface, Template oder Binding wurde quarantined. | Incident oeffnen, `correlationId` und `panicId` verfolgen. |
| `fatal` | Recovery ist fehlgeschlagen oder mehrere Kernel-Scope-Fehler korrelieren. | Release/Traffic stoppen und letzten sicheren Stand wiederherstellen. |

## Recovery-Aktionen

| `recoveryAction` | Bedeutung | Host-Handoff |
|------------------|-----------|--------------|
| `rollback-last-safe-snapshot` | Der Kernel stellt den letzten sicheren Snapshot wieder her. | Snapshot-ID und Surface-Scope sichern. |
| `render-safe-fallback` | Ein gepruefter Fallback ersetzt unsicheren Output. | Fallback-Markup und Reason Code pruefen. |
| `quarantine-surface` | Betroffene Surface nimmt keine neuen Commits an. | Remote Source oder Adapter deaktivieren. |
| `abort-scope-jobs` | Scheduler Jobs im betroffenen Scope werden abgebrochen. | `rmt.kernel.scheduler_failure` mit `panic_blocked` pruefen. |
| `notify-host` | Host Adapter wird aktiv ueber Recovery informiert. | `hostNotified` und Host-Log-Korrelation bestaetigen. |

## Triage-Ablauf

1. `rmt.kernel.panic` nach `panicId`, `correlationId`, `scope`, `trigger` und `blockedCommitCount` filtern.
2. `rmt.kernel.recovery` mit demselben `correlationId` verbinden und `recoveryAction`, `quarantined` sowie `hostNotified` bewerten.
3. `rmt.kernel.escalation` pruefen, wenn Diagnostics-Subscriber oder Command-Handler beteiligt waren.
4. `rmt.kernel.scheduler_failure` pruefen, wenn Jobs `failed`, `aborted` oder `panic_blocked` sind.
5. Authoring anhand von [RMT Kernel Trusted Output Authoring](./rmt-kernel-trusted-output-authoring.md) korrigieren.
6. Migration und Regression mit [RMT Kernel Security Hardening Migration](./rmt-kernel-security-hardening-migration.md) und `node scripts/run_xtend_tests.js rmt-kernel-security-regression --json` absichern.

