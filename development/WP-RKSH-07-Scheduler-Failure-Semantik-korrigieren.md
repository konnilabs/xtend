# WP-RKSH-07 - Scheduler-Failure-Semantik korrigieren

- Status: `completed`
- Prioritaet: `P1`
- Datum: 14. Mai 2026
- Contract: `development/XTendRMT-Kernel-Scheduler-Failure-Contract.md`
- Schema: `xtend.rmt.kernel-scheduler-failure.v1`
- Record Schema: `xtend.rmt.kernel-scheduler-failure-record.v1`
- Package Script: `npm run test:rmt-kernel-scheduler-failure`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-kernel-scheduler-failure --json`

## Ziel

`RKSH-WP-07` verhindert SilentError-Risiken im Scheduler. Callback-Fehler werden nicht mehr als normale `executed` Jobs ausgewiesen. Recovery-Abbrueche, Panic-Blocks und kritische Backpressure bekommen eigene Statuswerte, Metriken und Panic-Handoff.

## Umgesetzte Faehigkeiten

- `KernelSchedulerFailureController` fuer host-neutrale Policies und Failure Records.
- Statuswerte `failed`, `aborted` und `panic_blocked` in Runtime-Metriken.
- Callback-Fehler finalisieren Jobs als `failed` mit `callback_error`.
- `abortScope(scope, reason?)` fuer Recovery- und Quarantaene-Abbrueche.
- `panicBlockScope(scope, reason?)` fuer aktive Panic-Sperren.
- Failure-History in `getSchedulerStats().failures`.
- Lane-Diagnostics fuer `failed`, `aborted` und `panicBlocked`.
- Panic-Hooks fuer `scheduler-failure` und `scheduler-backpressure`.
- Diagnostics auf `rmt.kernel.scheduler_failure` und Escalation-Spiegelung auf `rmt.kernel.escalation`.

## Artefakte

- `tools/rmt-language/kernel-scheduler-failure.js`
- `tools/rmt-language/kernel-scheduler-failure.d.ts`
- `tests/rmt-language/rmt_kernel_scheduler_failure_suite.js`
- `development/XTendRMT-Kernel-Scheduler-Failure-Contract.md`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `package.json`
- `catalog/type-exports-rmt.js`
- `scripts/run_xtend_tests.js`

## Abnahmekriterien

- Callback-Fehler erhoehen `failed`, nicht `executed`.
- `failed`, `aborted` und `panicBlocked` sind in Stats und Lane-Diagnostics getrennt.
- Callback-Fehler koennen Panic-/Recovery-Pfade ausloesen.
- Job-Abbruch und Recovery-Neuplanung sind artifact-level getestet.
- Kritische Scheduler-Backpressure erzeugt ein Panic-Signal.
- Bestehende Scheduler-Kompatibilitaet bleibt ueber Handles, `cancelScope()` und neue Alias-/Abort-APIs nachvollziehbar.

## Handoff

- `RKSH-WP-08`: Policy-Paritaet kann Scheduler-Failure-Statuswerte und Backpressure-Signale mappen.
- `RKSH-WP-09`: Negative Regression-Fixtures koennen Callback-Failures, Panic-Blocks und Recovery-Requeue abdecken.
- `RKSH-WP-10`: Artefakt-Paritaet muss die neuen Scheduler-Statuswerte in allen generierten Runtimes pruefen.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-scheduler-failure --json
```
