# WP-RKSH-05 - Quarantaene, Rollback und sicheren Fallback modellieren

- Status: `completed`
- Prioritaet: `P0`
- Datum: 14. Mai 2026
- Contract: `development/XTendRMT-Kernel-Recovery-Contract.md`
- Schema: `xtend.rmt.kernel-recovery.v1`
- Safe Snapshot Schema: `xtend.rmt.kernel-recovery-safe-snapshot.v1`
- Package Script: `npm run test:rmt-kernel-recovery`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-kernel-recovery --json`

## Ziel

`RKSH-WP-05` verankert Recovery als deterministische Kernel-Faehigkeit nach einem Panic-Zustand. Der Kernel kann betroffene Scopes quarantainen, scope-gebundene Jobs pausieren, den letzten sicheren Snapshot wiederherstellen, einen sicheren Fallback rendern und den Host Adapter ueber das Recovery-Outcome informieren.

## Umgesetzte Faehigkeiten

- `KernelRecoveryController` fuer host-neutrale Recovery-Policies, Plaene und Outcomes.
- Safe-Snapshot-Speicher mit `rememberSafeSnapshot()`, `getLastSafeSnapshot()` und `listSafeSnapshots()`.
- Scope-Quarantaene mit `quarantineScope()`, `listQuarantinedScopes()` und `isScopeQuarantined()`.
- Pending-Job-Pause fuer betroffene Scheduler-Scopes.
- Runtime-Methoden `restoreLastSafeSnapshot()`, `renderSafeFallback()` und `recoverFromPanic()`.
- Host-Notification ueber `notifyRecoveryOutcome()` oder `onRecoveryOutcome()`.
- Recovery-Diagnostics auf `rmt.kernel.recovery`.
- Recovery-Failure als eigener Panic-Trigger `recovery_failure`.

## Artefakte

- `tools/rmt-language/kernel-recovery.js`
- `tools/rmt-language/kernel-recovery.d.ts`
- `tests/rmt-language/rmt_kernel_recovery_suite.js`
- `development/XTendRMT-Kernel-Recovery-Contract.md`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `package.json`
- `catalog/type-exports-rmt.js`
- `scripts/run_xtend_tests.js`

## Abnahmekriterien

- Recovery erzeugt keinen neuen unsicheren DOM-Commit.
- HTML-basierte Restore- und Fallback-Pfade laufen ueber die vorhandenen Trusted-DOM-Sinks.
- Nicht betroffene Scopes bleiben funktionsfaehig.
- Pending Jobs fuer den betroffenen Scope werden sichtbar pausiert.
- Recovery-Outcomes sind serialisierbar, diagnostisch sichtbar und an Host Adapter uebergebbar.
- Recovery-Failure fuehrt deterministisch zu `failed` im PanicMonitor.

## Handoff

- `RKSH-WP-06`: Diagnostics und Command Bus koennen Recovery-Outcomes als Eskalationskontext verwenden.
- `RKSH-WP-07`: Scheduler-Failure-Semantik kann an die Pending-Job- und Quarantaene-Scopes anschliessen.
- `RKSH-WP-08`: Compile-Time-/Runtime-Policy-Paritaet kann Recovery als Runtime-Reaktion abdecken.
- `RKSH-WP-09`: Negative Regression-Fixtures koennen Panic- und Recovery-Pfade gemeinsam pruefen.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-recovery --json
```
