# WP-RKSH-04 - PanicMonitor State Machine bauen

Status: `completed`  
Prioritaet: `P0`  
Gate: `node scripts/run_xtend_tests.js rmt-kernel-panic-monitor --json`  
Package Script: `npm run test:rmt-kernel-panic-monitor`

## Ergebnis

`RKSH-WP-04` fuehrt eine host-neutrale Panic-Zustandsmaschine ein und koppelt sie an die Runtime-Trust-Verdicts aus `RKSH-WP-02` und `RKSH-WP-03`.

## Artefakte

- `tools/rmt-language/kernel-panic-monitor.js`
- `tools/rmt-language/kernel-panic-monitor.d.ts`
- `tests/rmt-language/rmt_kernel_panic_monitor_suite.js`
- `development/XTendRMT-Kernel-Panic-Monitor-Contract.md`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `package.json`
- `catalog/type-exports-rmt.js`
- `scripts/run_xtend_tests.js`

## Contract

- Monitor-Schema: `xtend.rmt.kernel-panic-monitor.v1`
- State-Schema: `xtend.rmt.kernel-panic-state.v1`
- Event-Schema: `xtend.rmt.kernel-panic-event.v1`
- Diagnostics Channel: `rmt.kernel.panic`
- Workpackage: `RKSH-WP-04`

## Implementierte Faehigkeiten

- Panic-State-Modell mit `none`, `suspected`, `active`, `recovering`, `recovered`, `failed`.
- Eskalation von `blocked` Verdicts nach Schwellwert.
- Deterministische Aktivierung von `active` fuer kritische Trust-Verletzungen.
- Recovery-Start, Recovery-Ende und Recovery-Failure als Snapshots und Events.
- Korrelierbare `panicId`, `correlationId`, `eventId` und Diagnostics Events.
- Runtime-Hooks auf Renderer, Binding-Session und Execution-Path.
- Redigierte Panic-Metadaten ohne Raw HTML oder Script Payloads.

## Abnahmekriterien

- Kritische Trust-Verletzungen fuehren deterministisch zu `active`.
- Drei wiederholte blockierte Runtime-Commits fuehren zu `active` mit Trigger `threshold-breached`.
- `beginPanicRecovery`, `completePanicRecovery` und `failPanicRecovery` aktualisieren den sichtbaren Runtime-Snapshot.
- Panic Events verwenden `xtend.rmt.kernel-panic-event.v1` und werden ueber `rmt.kernel.panic` publiziert.
- Der Monitor ist ueber Package-Export `./rmt-language/kernel-panic-monitor` typisiert verfuegbar.

## Handoff

`RKSH-WP-05` kann auf `active`, `recovering`, `recovered` und `failed` Snapshots aufsetzen, um Quarantaene, Rollback und Safe Fallbacks zu modellieren.
