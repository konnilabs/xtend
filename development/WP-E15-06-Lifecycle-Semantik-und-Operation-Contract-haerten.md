# WP-E15-06 - Lifecycle Semantik und Operation Contract haerten

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Core Contract: `xtend.rmt.core-format.vnext.v1`
- Lifecycle Contract: `xtend.rmt.vnext-lifecycle.v1`
- Operation Contract: `xtend.rmt.vnext-lifecycle-operation.v1`
- Result Contract: `xtend.rmt.vnext-lifecycle-result.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-vnext-lifecycle --json`
- Package Script: `npm run test:rmt-vnext-lifecycle`
- Zielzustand: `rmt-vnext-lifecycle-contract-ready`

## Ziel

`WP-E15-06` haertet Lifecycle-Operationen nach der Compilation in das vNext Core-Format. Das Paket definiert Operation, Target, Phase, Adapter-Capability, Idempotency und Result-Shape fuer alle Lifecycle-Befehle. Es fuehrt keine Host-Runtime aus und bleibt auf host-neutrale Adapter-Stubs begrenzt.

## Umgesetzt

- `tools/rmt-language/vnext-lifecycle.js` als Lifecycle-Contract-Modul angelegt
- Contract-Schema `xtend.rmt.vnext-lifecycle.v1` eingefuehrt
- Operation-Schema `xtend.rmt.vnext-lifecycle-operation.v1` und Result-Schema `xtend.rmt.vnext-lifecycle-result.v1` eingefuehrt
- Semantikmatrix fuer `mount`, `hydrate`, `suspend`, `resume`, `invalidate`, `dispose`, `prewarm`, `recycle`, `detach`, `reattach` umgesetzt
- erlaubter Target-Type fuer den MVP auf deklaratives `ref` begrenzt
- Adapter-Capabilities als `lifecycle.<operation>` stabilisiert
- idempotente Operation-Keys aus Operation, Phase, Lane und Target erzeugt
- missing Adapter und missing Capability als Diagnostics umgesetzt
- unsupported Operation, missing Target und unsupported Target als Diagnostics umgesetzt
- Result-Normalisierung fuer `ok`, `skipped`, `failed`, `degraded` umgesetzt
- `tests/rmt-language/fixtures/vnext-lifecycle-valid.rmt` als Lifecycle-Fixture angelegt
- `tests/rmt-language/rmt_vnext_lifecycle_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` um `rmt-vnext-lifecycle` erweitert
- `package.json` um Export, Metadaten und Script fuer den Lifecycle Contract erweitert
- Epic-Backlog aktualisiert: `WP-E15-06` completed, `WP-E15-10` ready

## Implementierungsentscheidung

Der Lifecycle Contract ist eine eigene Schicht ueber dem Core-Compiler:

- `tools/rmt-language/vnext-lifecycle.js`

Er liest:

- `coreDocument.operations[]`
- `coreDocument.sourceMap[]`

Er erzeugt:

- Operation Plans
- Result Contracts
- Source-map-faehige Diagnostics

Er importiert keine Host-Runtime und fuehrt keine Lifecycle-Operation aus. Der Gate arbeitet mit Stubs, die nur `id` und `providedCapabilities` deklarieren.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Lifecycle Commands bleiben deklarativ | erfuellt: Plans beschreiben Operation und Adapter-Capability, fuehren aber nichts aus |
| Missing Adapter Capabilities erzeugen Diagnostics | erfuellt: `rmt.vnext.lifecycle.capability.missing` |
| Keine impliziten Fallbacks | erfuellt: blocked Plans behalten `adapterId: null` |
| Operationen haben Result Contracts | erfuellt: `xtend.rmt.vnext-lifecycle-result.v1` |
| Idempotency ist stabil | erfuellt: Keys aus Operation, Phase, Lane und Target |
| host-neutraler Adapter-Stub-Gate vorhanden | erfuellt: `rmt-vnext-lifecycle` |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-lifecycle --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `75`
- Failures: `0`
- Warnings: `0`

Zusaetzliche Regression-Gates:

```bash
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-parser --json
node scripts/run_xtend_tests.js rmt-parser --json
node scripts/run_xtend_tests.js references --json
```

Ergebnisse:

- `rmt-vnext-compiler`: `passed`, `65` Passes, `0` Failures, `0` Warnings
- `rmt-vnext-parser`: `passed`, `57` Passes, `0` Failures, `0` Warnings
- `rmt-parser`: `passed`, `84` Passes, `0` Failures, `0` Warnings
- `references`: `passed`, `7472` Passes, `0` Failures, `0` Warnings
- `package.json` JSON parse: `passed`

## Handoff

`WP-E15-06` ist abgeschlossen. `WP-E15-07` kann Scheduling, Budgeting und Priorities auf Core-Operationen und Lifecycle-Phasen aufbauen.

Durch `WP-E15-06` ist ausserdem `WP-E15-10` startbar, weil Slots und Component Binding nun auf einen stabilen Lifecycle Operation Contract referenzieren koennen.

Noch nicht Teil von `WP-E15-06`:

- Scheduling-Budgets
- Surface Registry Runtime
- Component Binding
- Import-Aufloesung
- Security Policy Execution
- Streaming Runtime
- Browser-Ausfuehrung echter Lifecycle-Adapter
