# WP-RKSH-08 - Compile-Time-/Runtime-Policy-Paritaet herstellen

- Status: `completed`
- Prioritaet: `P1`
- Datum: 14. Mai 2026
- Contract: `development/XTendRMT-Kernel-Policy-Parity-Contract.md`
- Schema: `xtend.rmt.kernel-policy-parity.v1`
- Report Schema: `xtend.rmt.kernel-policy-parity-report.v1`
- Package Script: `npm run test:rmt-kernel-policy-parity`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json`

## Ziel

`RKSH-WP-08` stellt sicher, dass compile-time blockierende RMT-Policies einen Runtime-Gegenpart im Kernel haben. Die Runtime erzeugt dafuer einen Policy-Parity-Report mit angewendeter Policy, Runtime-Scope, Verdict und Drift-Hinweisen.

## Umgesetzte Faehigkeiten

- `KernelPolicyParityController` fuer host-neutrale Matrix und Runtime Reports.
- Paritaetsmatrix fuer vNext-Security, Remote-Security, Degradation, Streaming und Event Governance.
- Runtime-Factory `createRmtKernelPolicyParity()` in Core, Runtime und Browser Runtime.
- Runtime Reports mit `appliedPolicies[]`, `runtimeCapabilities` und `drift[]`.
- Drift-Erkennung fuer fehlende Runtime-Mappings und fehlende Runtime-Hooks.
- Diagnostics auf `rmt.kernel.policy_parity`.

## Artefakte

- `tools/rmt-language/kernel-policy-parity.js`
- `tools/rmt-language/kernel-policy-parity.d.ts`
- `tests/rmt-language/rmt_kernel_policy_parity_suite.js`
- `development/XTendRMT-Kernel-Policy-Parity-Contract.md`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `package.json`
- `catalog/type-exports-rmt.js`
- `scripts/run_xtend_tests.js`

## Abnahmekriterien

- Jede compile-time blockierende Security-Regel in der Matrix hat einen Runtime-Gegenpart.
- Remote-Security ist mit dem Runtime-Scope `remote-output` verbunden.
- Degradation `blocked` zeigt Panic-/Recovery-Hooks.
- Streaming Error Paths sind Scheduler-/Panic-Signalen zugeordnet.
- Event Governance Delivery Blocks sind Runtime-Signale.
- Runtime Reports zeigen angewendete Policy und Verdict.
- Drift zwischen Contract und Runtime wird im Gate erkannt.

## Handoff

- `RKSH-WP-09`: Negative Regression-Fixtures koennen die Matrix-Codes als reproduzierbare SilentError-Pfade verwenden.
- `RKSH-WP-10`: Artifact-Parity muss die neue Runtime-Factory und die Tooling-Exports stabil halten.
- `RKSH-WP-11`: Migration und Incident-Handoff koennen die Parity-Reports als Auswertungsformat verwenden.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json
```
