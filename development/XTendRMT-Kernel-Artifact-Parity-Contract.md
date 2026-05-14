# XTendRMT Kernel Artifact Parity Contract

- Schema: `xtend.rmt.kernel-artifact-parity.v1`
- Baseline: `xtend.rmt.artifact-parity.v1`
- Workpackage: `RKSH-WP-10`
- Status: `completed-kernel-artifact-parity`
- Lokales Gate: `node scripts/verify_xtendrmt_artifact_parity.js --json`
- Package Script: `npm run test:rmt-artifact-parity`

## Zweck

Dieser Contract erweitert die bestehende XTendRMT-Artefaktparitaet um die neuen Trust-, Panic-, Recovery- und Regression-Layer aus `RKSH-WP-00` bis `RKSH-WP-09`.

Das Ziel ist bewusst konservativ: `xtendrmt/` bleibt synchronisierte Build- und Regression-Referenz, aber die neuen Kernel-Sicherheitsoberflaechen duerfen nicht mehr still zwischen Schema, Manifest, Types und Runtime-Bundles driften.

## Source of Truth

- Upstream RMT-Source bleibt die primaere Source of Truth fuer produktive Bundle-Generierung.
- Dieses Repository haelt die synchronisierten Artefakte als Regression-Referenz.
- `development/WP-RKSH-10-Buildprozess-und-Artefakt-Paritaet-fuer-neue-Layer-absichern.md` ist das lokale Handoff fuer Kernel-Hardening-Paritaet.
- Manuelles Bundle-Patching ist nur als bewusst synchronisierte Handoff-Aktion akzeptabel und muss `scripts/verify_xtendrmt_artifact_parity.js` passieren.

## Pflichtoberflaechen

Das Parity-Gate kennt jetzt:

- Kernel-Hardening-Contracts wie `xtend.rmt.kernel-trust-authority.v1`, `xtend.rmt.kernel-panic-monitor.v1`, `xtend.rmt.kernel-recovery.v1`, `xtend.rmt.kernel-policy-parity.v1` und `xtend.rmt.kernel-security-regression.v1`
- Runtime-Hooks wie `commitTrustedHtml`, `commitTrustedAttribute`, `commitTrustedProperty`, `getPanicSnapshot`, `recoverFromPanic` und `createRmtKernelPolicyParity`
- Type-Surfaces wie `RmtKernelRuntimeTrustVerdict`, `RmtKernelRuntimePanicSnapshot` und `RmtKernelRuntimeRecoveryOutcome`
- Tooling-Module unter `tools/rmt-language/kernel-*.js`

## Akzeptanz

- `rmt.schema.json`, `rmt-manifest.json` und generated Product Manifests listen dieselben Kernel-Hardening-Contracts.
- `rmt-core.d.ts` exportiert die Trust-/Panic-/Recovery-Typoberflaechen.
- `rmt-core.esm.js`, `rmt-runtime.esm.js` und `rmt-runtime.browser.js` enthalten die Trust-, Panic-, Recovery- und Policy-Parity-Hooks.
- `createRmtKernelPolicyParity` ist als ESM-Export, AppModules-Factory, Manifest-Factory und Type-Factory sichtbar.

## Gate

```bash
node scripts/verify_xtendrmt_artifact_parity.js --json
```
