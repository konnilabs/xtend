# XTendRMT Kernel Scheduler Failure Contract

- Status: `completed-scheduler-failure-semantics`
- Datum: 14. Mai 2026
- Schema: `xtend.rmt.kernel-scheduler-failure.v1`
- Policy Schema: `xtend.rmt.kernel-scheduler-failure-policy.v1`
- Record Schema: `xtend.rmt.kernel-scheduler-failure-record.v1`
- Report Schema: `xtend.rmt.kernel-scheduler-failure-report.v1`
- Workpackage: `RKSH-WP-07`
- Diagnostic Channel: `rmt.kernel.scheduler_failure`

## Zweck

Dieser Contract korrigiert die Scheduler-Failure-Semantik im RMT-Kernel. Callback-Fehler duerfen nicht mehr als normaler `executed` Erfolg erscheinen. Der Kernel unterscheidet jetzt erfolgreiche Jobs, fehlgeschlagene Jobs, Recovery-/Abort-Faelle und Panic-Blocks mit eigenen Statuswerten.

Die Semantik bleibt kompatibel migriert: Scheduler-Handles, `cancelScope()` und bestehende Scheduling-Pfade bleiben erhalten. Neue Outcomes werden zusaetzlich in Metriken, Diagnostics und Typen sichtbar.

## Statusmodell

Der Scheduler nutzt diese finalen Statuswerte:

- `executed`: Callback wurde ohne Fehler abgeschlossen.
- `failed`: Callback oder Scheduler-Job ist fehlgeschlagen, zum Beispiel `callback_error`.
- `aborted`: Job wurde wegen Recovery, Quarantaene oder explizitem Abort beendet.
- `cancelled`: regulaere Scope-/Root-/Manual-Cancellation ohne Panic-Semantik.
- `stale_scope` und `stale_root`: Job ist durch Token- oder Root-Drift veraltet.
- `panic_blocked`: Job wurde wegen Panic- oder Recovery-Sperre nicht ausgefuehrt.

`failed`, `aborted` und `panic_blocked` werden als Failure-Status gefuehrt und getrennt von `executed` gezaehlt.

## Failure Record

Jedes Scheduler-Failure-Ereignis wird als `xtend.rmt.kernel-scheduler-failure-record.v1` beschrieben.

Pflichtfelder:

- `status`: `failed`, `aborted` oder `panic_blocked`
- `reason`: zum Beispiel `callback_error`, `recovery_aborted` oder `panic_blocked`
- `severity`: `info`, `warning`, `error`, `critical` oder `fatal`
- `panicRelevant`
- `trustRelevant`
- `trigger`: `scheduler-failure` oder `scheduler-backpressure`
- `scope`
- `jobId`
- `reasonCode`
- `diagnosticCode`
- `metadata`

Payload-nahe Metadata wird standardmaessig redigiert.

## Runtime-Hooks

Der Runtime-Scheduler expose:

- `getSchedulerStats()`
- `getSchedulerDiagnostics()`
- `abortScope(scope, reason?)`
- `panicBlockScope(scope, reason?)`
- `reportPerformanceSample(sample?)`

`getSchedulerStats()` enthaelt `failed`, `aborted`, `panicBlocked` und `failures[]`. Lane-Diagnostics enthalten dieselben getrennten Counter.

## Panic-Integration

Ein Scheduler-Failure wird an den PanicMonitor gemeldet, wenn:

- `status` `panic_blocked` ist,
- ein Callback-Fehler nach Policy panic-relevant ist,
- `severity` mindestens `critical` ist,
- `trustRelevant` gesetzt ist und `trustRelevantActivatesPanic` aktiv ist,
- oder Scheduler-Backpressure den Level `critical` erreicht.

Job-Fehler nutzen Trigger `scheduler-failure`. Kritische Backpressure nutzt Trigger `scheduler-backpressure`.

## Sicherheitsinvarianten

- `callback_error` darf `executed` nicht erhoehen.
- `failed`, `aborted` und `panic_blocked` sind eigene Metriken.
- Recovery-Abbrueche werden nicht als normale Cancellations versteckt.
- Panic-Blocks koennen aktive Panic-Signale erzeugen.
- Kritische Scheduler-Backpressure wird an PanicMonitor gekoppelt.
- Failure-Diagnostics laufen ueber `rmt.kernel.scheduler_failure`.
- Scheduler-Failures koennen zusaetzlich auf `rmt.kernel.escalation` gespiegelt werden.

## Artefakte

- `tools/rmt-language/kernel-scheduler-failure.js`
- `tools/rmt-language/kernel-scheduler-failure.d.ts`
- `tests/rmt-language/rmt_kernel_scheduler_failure_suite.js`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `development/WP-RKSH-07-Scheduler-Failure-Semantik-korrigieren.md`

## Lokales Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-scheduler-failure --json
```

Package Script:

```bash
npm run test:rmt-kernel-scheduler-failure
```
