# XTendRMT Kernel Policy Parity Contract

- Status: `completed-compile-runtime-policy-parity`
- Datum: 14. Mai 2026
- Schema: `xtend.rmt.kernel-policy-parity.v1`
- Matrix Schema: `xtend.rmt.kernel-policy-parity-matrix.v1`
- Report Schema: `xtend.rmt.kernel-policy-parity-report.v1`
- Drift Schema: `xtend.rmt.kernel-policy-parity-drift.v1`
- Workpackage: `RKSH-WP-08`
- Diagnostic Channel: `rmt.kernel.policy_parity`

## Zweck

Dieser Contract verbindet compile-time blockierende RMT-Policies mit Runtime-Gegenstuecken im Kernel. Ein Build- oder Tooling-Block darf nicht nur als statisches Ergebnis existieren; fuer denselben Scope muss die Runtime zeigen koennen, welche Policy angewendet wurde, welches Verdict entstand und welcher Panic-/Recovery-Pfad im Fehlerfall greift.

## Paritaetsmatrix

Die Matrix `xtend.rmt.kernel-policy-parity-matrix.v1` deckt diese Policy-Familien ab:

- `xtend.rmt.vnext-security-policy-contract.v1` -> `trusted-runtime-output` und `binding-output`
- `xtend.rmt.vnext-remote-security-policy.v1` -> `remote-output`
- `xtend.rmt.vnext-degradation-policy.v1` -> `degraded-or-blocked-surface`
- `xtend.rmt.vnext-streaming-contract.v1` -> `streaming-output`
- `xtend.rmt.vnext-event-governance-policy.v1` -> `event-delivery`

Jeder Matrix-Eintrag beschreibt:

- compile-time blockierende Diagnostic Codes
- Runtime Scope
- notwendige Runtime Hooks
- Runtime Schemas
- erlaubte Runtime Verdicts
- Panic Trigger
- Recovery Action

## Runtime Report

Der Runtime Report `xtend.rmt.kernel-policy-parity-report.v1` enthaelt:

- `compileTimeBlocks[]`: blockierende Compile-Time-Regeln
- `appliedPolicies[]`: gemappte Runtime-Policies mit `appliedPolicy`, `runtimeScope` und `verdict`
- `runtimeCapabilities`: erkannte oder explizit angegebene Runtime-Hooks
- `drift[]`: fehlende Mappings oder fehlende Runtime-Hooks

`status` ist `ready`, wenn alle blockierenden Regeln eine Runtime-Abdeckung haben. `status` ist `drift`, wenn eine Regel kein Mapping besitzt oder ein notwendiger Runtime-Hook fehlt.

## Runtime-Hooks

Die Matrix erwartet unter anderem:

- `recordTrustVerdict`
- `commitTrustedHtml`
- `commitTrustedAttribute`
- `commitTrustedProperty`
- `applyRemoteSurfacePolicy`
- `recoverFromPanic`
- `rememberSafeSnapshot`
- `listRecoveryOutcomes`
- `panicBlockScope`
- `reportPerformanceSample`
- `dispatchCommand`
- `recordEscalation`
- `listEscalations`

Die Runtime-Artefakte expose `createRmtKernelPolicyParity()`.

## Sicherheitsinvarianten

- Jede compile-time blockierende Security-Regel hat einen Runtime-Gegenpart.
- Remote-Security-Blocks landen im Runtime-Scope `remote-output`.
- Degradation `blocked` ist mit Panic/Recovery-Semantik verbunden.
- Streaming Error Paths werden in Scheduler-/Panic-Signale uebersetzt.
- Event-Governance Delivery Blocks sind Runtime-Signale, nicht nur Tooling-Diagnostics.
- Drift wird als `xtend.rmt.kernel-policy-parity-drift.v1` sichtbar.

## Artefakte

- `tools/rmt-language/kernel-policy-parity.js`
- `tools/rmt-language/kernel-policy-parity.d.ts`
- `tests/rmt-language/rmt_kernel_policy_parity_suite.js`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`
- `xtendrmt/rmt-core.d.ts`
- `development/WP-RKSH-08-Compile-Time-Runtime-Policy-Paritaet-herstellen.md`

## Lokales Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json
```

Package Script:

```bash
npm run test:rmt-kernel-policy-parity
```
