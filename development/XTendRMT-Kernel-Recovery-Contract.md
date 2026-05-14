# XTendRMT Kernel Recovery Contract

- Status: `completed-kernel-recovery-policy`
- Datum: 14. Mai 2026
- Schema: `xtend.rmt.kernel-recovery.v1`
- Policy Schema: `xtend.rmt.kernel-recovery-policy.v1`
- Plan Schema: `xtend.rmt.kernel-recovery-plan.v1`
- Outcome Schema: `xtend.rmt.kernel-recovery-outcome.v1`
- Safe Snapshot Schema: `xtend.rmt.kernel-recovery-safe-snapshot.v1`
- Report Schema: `xtend.rmt.kernel-recovery-report.v1`
- Workpackage: `RKSH-WP-05`
- Diagnostic Channel: `rmt.kernel.recovery`

## Zweck

Dieser Contract definiert die Recovery-Schicht des RMT-Kernels nach einem aktiven oder fehlgeschlagenen Panic-Zustand. Recovery ist eine Kernel-Faehigkeit: Sie quarantained den betroffenen Scope, pausiert scope-gebundene Jobs, stellt den letzten sicheren Snapshot wieder her oder rendert einen sicheren Fallback und meldet das Ergebnis an den Host Adapter.

Recovery darf keinen zweiten unsicheren DOM-Pfad einfuehren. HTML-basierte Restore- und Fallback-Pfade laufen deshalb weiterhin ueber die Trusted-DOM- und Trust-Authority-Sinks des Kernels.

## Recovery-Modell

Die Recovery-Schicht besteht aus:

- `KernelRecoveryController` fuer host-neutrale Planung und Ausfuehrung.
- `RecoveryPolicy` mit Scope-Isolation, Snapshot-Restore, Safe-Fallback und Host-Notification.
- `SafeSnapshot` als letzter bekannter sicherer Zustand eines Surface-, Template- oder Binding-Scopes.
- `RecoveryPlan` als deterministische Aktionsliste fuer einen Panic-Scope.
- `RecoveryOutcome` als Host- und Diagnostics-faehiger Abschlussnachweis.

## Pflichtaktionen

- `quarantine-scope`: betroffenen Scope isolieren.
- `pause-scheduler-jobs`: pending Jobs fuer den Scope pausieren.
- `restore-last-safe-snapshot`: letzten sicheren Snapshot als bevorzugtes Restore-Ziel verwenden.
- `render-safe-fallback`: Fallback nur ueber denselben Trusted-DOM-Pfad wie normale Runtime-Outputs committen.
- `notify-host`: Host Adapter ueber Outcome, Scope, Status und Recovery-Details informieren.

## Runtime-API

Runtime Renderer, Binding Session und Execution Path stellen die Recovery-Oberflaeche bereit:

- `rememberSafeSnapshot(input)`
- `getLastSafeSnapshot(scopeKey)`
- `listSafeSnapshots()`
- `restoreLastSafeSnapshot(scopeKey, options)`
- `renderSafeFallback(scopeKey, options)`
- `recoverFromPanic(input)`
- `listRecoveryOutcomes()`
- `listQuarantinedScopes()`
- `isScopeQuarantined(scopeKey)`

Der Runtime Renderer und Execution Path koennen zusaetzlich `quarantineScope(input)` aufrufen, um einen Scope explizit zu isolieren.

## Panic-Integration

Recovery verwendet den PanicMonitor als State Source:

- Recovery startet aus `active` oder `failed`.
- `beginPanicRecovery()` markiert den Zustand als `recovering`.
- Erfolgreiche Recovery finalisiert mit `completePanicRecovery()`.
- fehlgeschlagene Recovery finalisiert mit `failPanicRecovery()` und erzeugt einen eigenen Panic-Trigger `recovery_failure`.

## Host-Adapter-Handoff

Der Host kann ueber eine der folgenden Abstraktionen informiert werden:

- `hostAdapter.notifyRecoveryOutcome(outcome)`
- `recoveryHostAdapter.notifyRecoveryOutcome(outcome)`
- `onRecoveryOutcome(outcome)`

Der Kernel bleibt host-neutral. Der Outcome enthaelt aber genug Kontext fuer Incident-Handoff, Oberflaechen-Isolation und externe Telemetrie.

## Sicherheitsinvarianten

- Recovery erzeugt keinen ungeprueften HTML-Commit.
- Unsichere Fallback-Inhalte werden sanitisiert oder blockiert.
- Scope-Quarantaene betrifft nur den Zielscope; nicht betroffene Scopes laufen weiter.
- Pausierte Jobs bleiben im Recovery-Outcome sichtbar.
- Recovery-Fehler sind eigenstaendige Panic-Signale.
- Outcomes sind ueber `rmt.kernel.recovery` diagnostisch nachvollziehbar.

## Artefakte

- `tools/rmt-language/kernel-recovery.js`
- `tools/rmt-language/kernel-recovery.d.ts`
- `tests/rmt-language/rmt_kernel_recovery_suite.js`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `development/WP-RKSH-05-Quarantaene-Rollback-und-sicheren-Fallback-modellieren.md`

## Lokales Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-recovery --json
```

Package Script:

```bash
npm run test:rmt-kernel-recovery
```
