# WP-TypeExports-05 - Fabric-, A11y- und Security-Policy-APIs typisieren

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.type-exports.policy-declarations.v1`
- Report: `xtend.type-exports.policy-declarations-report.v1`
- Zielreife: `fabric-a11y-security-policy-types-ready`
- Lokaler Gate: `node scripts/run_xtend_tests.js type-exports-policy --json`
- Package Script: `npm run test:type-exports-policy`
- Report-Artefakt: `.xtend-test-results/xtend-type-exports-policy-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Ergebnis

Die Fabric-, A11y- und Security-Exports besitzen jetzt package-native `types`-Conditions. Die Runtime-Ziele bleiben unveraendert und zeigen weiterhin auf die bestehenden JS-Module.

Gelieferte Declarations:

- `fabric/xtend-policy-public-types.d.ts`
- `fabric/xtend-fabric.d.ts`
- `fabric/rmt-lane-mapping.d.ts`
- `fabric/hydration-policy.d.ts`
- `a11y/screenreader-signals.d.ts`
- `a11y/motion-contrast-policy.d.ts`
- `a11y/runtime-a11y-contract.d.ts`
- `security/manifest-import-policy.d.ts`
- `security/trusted-dom-policy.d.ts`
- `security/supply-chain-gate-policy.d.ts`

## Gate

Der neue Catalog `catalog/type-exports-policy.js` und die Suite `tests/types/policy_type_exports_suite.js` pruefen:

- alle Fabric/A11y/Security Package Exports besitzen die erwartete `types`-Condition
- alle Declaration-Dateien existieren
- Runtime-Symbole der JS-Module sind in den Facade-Declarations sichtbar
- zentrale Typen wie `XtendPolicyDiagnostic`, `XtendPolicyReport`, `XtendFabricFiberInput`, `XtendA11ySignal` und `XtendSecurityClassification` bleiben stabil
- Fabric/A11y/Security Runtime-Dateien importieren keine `.d.ts`
- keine Policy fuehrt Runtime-Abhaengigkeiten in Komponenten oder RMT-Kernel ein

## Handoff

`WP-TypeExports-06` kann nun Builder-, Scaffold- und Component-Lab-Programm-APIs typisieren. Das P1-Policy-Pack ist abgeschlossen und gatebar.
