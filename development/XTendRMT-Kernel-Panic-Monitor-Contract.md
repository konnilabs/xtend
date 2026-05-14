# XTendRMT Kernel Panic Monitor Contract

Status: `completed-panic-monitor-state-machine`  
Workpackage: `RKSH-WP-04`  
Schema: `xtend.rmt.kernel-panic-monitor.v1`  
State-Schema: `xtend.rmt.kernel-panic-state.v1`  
Event-Schema: `xtend.rmt.kernel-panic-event.v1`

## Ziel

Der `PanicMonitor` ist die Kernel-Schicht, die blockierte oder panic-relevante Trust-Verdicts in einen korrelierbaren Runtime-Zustand ueberfuehrt. Er ersetzt stille Fehlerpfade durch Snapshots und Diagnostics Events auf `rmt.kernel.panic`.

## Zustaende

| State | Bedeutung |
| --- | --- |
| `none` | kein Panic-Hinweis |
| `suspected` | erste nichtkritische Blockierung wurde erkannt |
| `active` | kritische Trust-Verletzung oder Schwellwert wurde erreicht |
| `recovering` | Recovery wurde gestartet |
| `recovered` | Recovery wurde abgeschlossen |
| `failed` | Recovery ist fehlgeschlagen oder eskaliert |

## Trigger

- `trust-verdict-blocked`
- `trust-verdict-panic`
- `scheduler-failure`
- `command-bus-failure`
- `diagnostics-failure`
- `adapter-output-blocked`
- `threshold-breached`
- `recovery-failure`
- `manual`

## Eskalationspolitik

| Regel | Default |
| --- | --- |
| Wiederholte Blockierungen | `3` blockierte Commits aktivieren `active` |
| Kritische Trust-Verletzung | `panic`, `panicCandidate` oder `fatal` aktiviert deterministisch `active` |
| Recovery Failure | erste fehlgeschlagene Recovery aktiviert `failed` |
| Diagnostics Channel | `rmt.kernel.panic` |
| Default Recovery Action | `quarantine-scope` |

## Runtime-Hooks

Runtime-Renderer, Binding-Sessions und Execution-Path stellen folgende Methoden bereit:

- `getPanicSnapshot()`
- `listPanicEvents()`
- `beginPanicRecovery(input?)`
- `completePanicRecovery(input?)`
- `failPanicRecovery(input?)`

Diese Hooks teilen denselben Monitor, wenn der Execution-Path einen Runtime-Renderer erzeugt. Dadurch sind Binding-, HTML- und Hydration-Signale unter derselben `panicId` und `correlationId` auswertbar.

## Diagnostics

Jedes Panic Event nutzt `xtend.rmt.kernel-panic-event.v1` und enthaelt:

- `eventId`
- `panicId`
- `correlationId`
- `recovery-started`
- `recovery-completed`
- `recovery-failed`
- `previousState`
- `state`
- `trigger`
- `severity`
- `blockedCommitCount`
- `criticalViolationCount`
- `recoveryAttemptCount`
- `recoveryFailureCount`

Raw Output wird in Panic-Metadaten nicht transportiert. HTML-, Script-, Payload- und Value-Felder werden redigiert, damit Incident-Diagnostics korrelierbar bleiben, ohne unsichere Inhalte erneut zu verbreiten.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-panic-monitor --json
```

Das Gate prueft das host-neutrale Tooling-Modul, den Runtime-Hook in allen drei XTendRMT-Artefakten, Package-Exports, Type-Exports und Dokumentation.

## Handoff

| Folgepaket | Ziel |
| --- | --- |
| `RKSH-WP-05` | Quarantaene, Rollback und sicheren Fallback modellieren |
| `RKSH-WP-06` | Remote Adapter Security Bridge |
| `RKSH-WP-08` | Scheduler Panic Propagation |
| `RKSH-WP-09` | Diagnostics und Observability |
