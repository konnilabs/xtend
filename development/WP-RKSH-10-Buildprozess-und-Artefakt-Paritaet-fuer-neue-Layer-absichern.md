# RKSH-WP-10 - Buildprozess und Artefakt-Paritaet fuer neue Layer absichern

- Status: `completed`
- Prioritaet: `P2`
- Schema: `xtend.rmt.kernel-artifact-parity.v1`
- Baseline-Gate: `xtend.rmt.artifact-parity.v1`
- Pflichtgate: `node scripts/verify_xtendrmt_artifact_parity.js --json`
- Package Script: `npm run test:rmt-artifact-parity`

## Ziel

WP-10 haertet die Build- und Artefaktparitaet fuer die Kernel-Sicherheitswelle. Die Trust-, Panic-, Recovery-, Scheduler-, Policy- und Regression-Layer sind jetzt als Pflichtoberflaechen im bestehenden XTendRMT-Artifact-Parity-Gate verankert.

## Umgesetzte Artefakte

- `development/XTendRMT-Kernel-Artifact-Parity-Contract.md`
- `scripts/verify_xtendrmt_artifact_parity.js`
- `xtendrmt/rmt.schema.json`
- `xtendrmt/rmt-manifest.json`
- `xtendrmt/rmt-core.d.ts`
- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`

## Source-of-Truth-Handoff

- Upstream RMT-Source bleibt die Source of Truth fuer produktive Generierung.
- `xtendrmt/` bleibt lokale Build-, Demo- und Regression-Referenz.
- Kernel-Hardening-Tooling liegt in `tools/rmt-language/kernel-*.js` und `tools/rmt-language/kernel-*.d.ts`.
- Runtime-Hardening ist in den synchronisierten Artefakten als Trust-Sink-, Panic-, Recovery-, Escalation-, Scheduler- und Policy-Parity-Hooks sichtbar.
- Jede bewusste Synchronisierung muss das Artifact-Parity-Gate passieren.

## Umgesetzte Aufgaben

- `scripts/verify_xtendrmt_artifact_parity.js` kennt die Kernel-Hardening-Contracts und Runtime-Hooks.
- Schema, Manifest und generated Product Manifests listen die Kernel-Hardening-Contracts.
- `createRmtKernelPolicyParity` ist als Manifest-Factory, ESM-Export und Type-Factory abgesichert.
- `rmt-core.d.ts` typisiert die Trust-, Panic- und Recovery-Surfaces.
- Runtime- und Browser-Artefakte werden auf `commitTrustedHtml`, `commitTrustedAttribute`, `commitTrustedProperty`, `getPanicSnapshot`, `recoverFromPanic` und `listRecoveryOutcomes` geprueft.

## Akzeptanz

- Kein manuelles Bundle-Patching ohne Source-Modul-Handoff.
- Artifact-Parity-Gate kennt neue Kernel-Hardening-Exports, Hooks, Contracts und Types.
- Runtime- und Type-Artefakte bleiben synchron.
- `node scripts/verify_xtendrmt_artifact_parity.js --json` ist gruen.

## Pflichtgate

```bash
node scripts/verify_xtendrmt_artifact_parity.js --json
```
