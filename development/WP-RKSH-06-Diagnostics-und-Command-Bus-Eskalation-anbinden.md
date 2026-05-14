# WP-RKSH-06 - Diagnostics und Command Bus Eskalation anbinden

- Status: `completed`
- Prioritaet: `P1`
- Datum: 14. Mai 2026
- Contract: `development/XTendRMT-Kernel-Escalation-Contract.md`
- Schema: `xtend.rmt.kernel-escalation.v1`
- Envelope Schema: `xtend.rmt.kernel-escalation-envelope.v1`
- Package Script: `npm run test:rmt-kernel-escalation`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-kernel-escalation --json`

## Ziel

`RKSH-WP-06` verhindert, dass kritische Diagnostics- und Command-Bus-Fehler als normale Subscriber- oder Handler-Ausfaelle verschwinden. Der Kernel erzeugt fuer diese Pfade Escalation-Envelopes, unterscheidet nichtkritische von panic-relevanten Fehlern und leitet kritische Faelle an den PanicMonitor weiter.

## Umgesetzte Faehigkeiten

- `KernelEscalationController` fuer host-neutrale Policies und Envelopes.
- Severity-Klassifikation fuer Diagnostics-Subscriber-Fehler.
- Severity, Trust-Relevanz und Panic-Relevanz auf Command-Bus-`failed` Responses.
- Panic-Hooks fuer `diagnostics-failure` und `command-bus-failure`.
- Runtime-Methoden `recordEscalation()`, `listEscalations()` und `getEscalationPolicy()`.
- Escalation-Diagnostics auf `rmt.kernel.escalation`.
- Redaction fuer payload-nahe Metadata.

## Artefakte

- `tools/rmt-language/kernel-escalation.js`
- `tools/rmt-language/kernel-escalation.d.ts`
- `tests/rmt-language/rmt_kernel_escalation_suite.js`
- `development/XTendRMT-Kernel-Escalation-Contract.md`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `package.json`
- `catalog/type-exports-rmt.js`
- `scripts/run_xtend_tests.js`

## Abnahmekriterien

- Kritische Handler-Fehler verschwinden nicht als normale `failed` Response.
- `failed` Responses behalten Kompatibilitaet und erhalten Severity-/Escalation-Felder.
- Nichtkritische Telemetrie- und Subscriber-Fehler destabilisieren die Runtime nicht.
- Tests unterscheiden non-critical und panic-critical Failures.
- PanicMonitor erhaelt kritische Diagnostics- und Command-Bus-Signale.

## Handoff

- `RKSH-WP-07`: Scheduler-Failure-Semantik kann dieselbe Severity-/Panic-Handoff-Form nutzen.
- `RKSH-WP-08`: Compile-Time-/Runtime-Policy-Paritaet kann Command- und Diagnostics-Triggers abdecken.
- `RKSH-WP-09`: Negative Regression-Fixtures koennen SilentError-Pfade fuer Subscriber und Handler reproduzieren.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-escalation --json
```
