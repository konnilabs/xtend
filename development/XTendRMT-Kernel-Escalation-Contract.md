# XTendRMT Kernel Escalation Contract

- Status: `completed-diagnostics-command-bus-escalation`
- Datum: 14. Mai 2026
- Schema: `xtend.rmt.kernel-escalation.v1`
- Policy Schema: `xtend.rmt.kernel-escalation-policy.v1`
- Envelope Schema: `xtend.rmt.kernel-escalation-envelope.v1`
- Report Schema: `xtend.rmt.kernel-escalation-report.v1`
- Workpackage: `RKSH-WP-06`
- Diagnostic Channel: `rmt.kernel.escalation`

## Zweck

Dieser Contract bindet Diagnostics-Subscriber-Fehler und Command-Bus-Failures an die Panic-Schicht an. Der Kernel unterscheidet damit zwischen nichtkritischen Telemetrie-/Subscriber-Ausfaellen und trust- oder panic-relevanten Fehlern, die aktiv eskaliert werden muessen.

Bestehendes Verhalten bleibt fuer nichtkritische Fehler stabil: Subscriber-Fehler unterbrechen den Runtime-Pfad nicht, und Command-Handler-Fehler liefern weiterhin strukturierte `failed` Responses. Kritische Fehler bekommen zusaetzlich Severity, Trust-Relevanz, Escalation Envelope und optional ein Panic-Signal.

## Escalation Envelope

Jedes eskalierbare Ereignis wird als `xtend.rmt.kernel-escalation-envelope.v1` beschrieben.

Pflichtfelder:

- `source`: `diagnostics` oder `command-bus`
- `eventType`: `diagnostics-subscriber-failure`, `command-handler-failure`, `command-response-failed`, `command-missing-handler` oder `command-subscriber-failure`
- `severity`: `info`, `warning`, `error`, `critical` oder `fatal`
- `panicRelevant`
- `trustRelevant`
- `trigger`: `diagnostics-failure` oder `command-bus-failure`
- `scope`
- `correlationId`
- `reasonCode`
- `diagnosticCode`
- `metadata`

Payload-nahe Felder werden standardmaessig redigiert.

## Runtime-Hooks

Diagnostics Hub und Command Bus expose:

- `recordEscalation(input)`
- `listEscalations()`
- `getEscalationPolicy()`

Der Diagnostics Hub klassifiziert Subscriber-Fehler aus `publish()` und Replay. Der Command Bus klassifiziert Handler-Exceptions, explizite failed Handler-Responses, fehlende Handler und Command-Subscriber-Fehler.

## Panic-Integration

Ein Envelope wird an den PanicMonitor gemeldet, wenn:

- `severity` mindestens `critical` ist,
- `panicRelevant` explizit `true` ist,
- oder `trustRelevant` gesetzt ist und die Policy `trustRelevantActivatesPanic` aktiviert.

Diagnostics-Fehler erzeugen Trigger `diagnostics-failure`. Command-Bus-Fehler erzeugen Trigger `command-bus-failure`.

## Sicherheitsinvarianten

- Nichtkritische Diagnostics-Subscriber-Fehler bleiben isoliert.
- Kritische Diagnostics-Subscriber-Fehler verschwinden nicht still.
- Command-Handler-Fehler behalten `failed` Response-Kompatibilitaet.
- Kritische Command-Handler-Fehler tragen Severity, Trust-Relevanz und Panic-Handoff.
- Escalation-Diagnostics laufen ueber `rmt.kernel.escalation`.
- Rohpayloads in Envelopes werden standardmaessig redigiert.

## Artefakte

- `tools/rmt-language/kernel-escalation.js`
- `tools/rmt-language/kernel-escalation.d.ts`
- `tests/rmt-language/rmt_kernel_escalation_suite.js`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `development/WP-RKSH-06-Diagnostics-und-Command-Bus-Eskalation-anbinden.md`

## Lokales Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-escalation --json
```

Package Script:

```bash
npm run test:rmt-kernel-escalation
```
