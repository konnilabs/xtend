# XTend Policy Types

- Contract: `xtend.type-exports.policy-declarations.v1`
- Workpackage: `WP-TypeExports-05`
- Gate: `node scripts/run_xtend_tests.js type-exports-policy --json`
- Report: `.xtend-test-results/xtend-type-exports-policy-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Zweck

`WP-TypeExports-05` macht die Fabric-, A11y- und Security-Policy-APIs fuer TypeScript-Consumer importierbar. Die JS-Runtime bleibt unveraendert; `package.json#exports` ergaenzt nur package-native `types`-Conditions.

## Declaration Pack

| Bereich | Package Export | Declaration |
| --- | --- | --- |
| Fabric Runtime | `./fabric` | `./fabric/xtend-fabric.d.ts` |
| Fabric/RMT Policy | `./fabric/rmt-lane-mapping`, `./fabric/hydration-policy` | `./fabric/*.d.ts` |
| A11y Policies | `./a11y/screenreader-signals`, `./a11y/motion-contrast-policy`, `./a11y/runtime-a11y-contract` | `./a11y/*.d.ts` |
| Security Policies | `./security/manifest-import-policy`, `./security/trusted-dom-policy`, `./security/supply-chain-gate-policy` | `./security/*.d.ts` |

Der gemeinsame Typkern liegt in `fabric/xtend-policy-public-types.d.ts` und enthaelt `XtendPolicyDiagnostic`, `XtendPolicyReport`, `XtendFabricFiberInput`, `XtendA11ySignal` und `XtendSecurityClassification`.

## Drift Gate

Der Gate prueft:

- jede Policy Package-Export-Condition zeigt auf die erwartete `.d.ts`
- jede Declaration-Datei existiert und exportiert die Runtime-Symbole des zugehoerigen JS-Moduls
- zentrale Diagnostic-, Report-, Fiber-, A11y- und Security-Klassifikationstypen bleiben vorhanden
- Fabric/A11y/Security Runtime-Dateien importieren keine `.d.ts`
- keine Policy fuehrt Runtime-Abhaengigkeiten in Komponenten, Loader, API oder RMT-Kernel ein

## Handoff

`WP-TypeExports-06` kann nun Builder-, Scaffold- und Component-Lab-Programm-APIs typisieren. Das Policy-Pack setzt das Muster fuer Integrationsmodule fort: bestehende JS-Runtime, schmale Declaration-Facades, package-native `types`-Conditions und ein Drift-Gate gegen Export-Abweichungen.
