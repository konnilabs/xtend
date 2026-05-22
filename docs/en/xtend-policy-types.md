# XTend Policy Types

- Contract: `xtend.type-exports.policy-declarations.v1`
- Workpackage: `WP-TypeExports-05`
- Gate: `node scripts/run_xtend_tests.js type-exports-policy --json`
- Report: `.xtend-test-results/xtend-type-exports-policy-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Purpose

`WP-TypeExports-05` makes the Fabric, a11y and security policy APIs importable for TypeScript consumers. The JS runtime remains unchanged; `package.json#exports` only adds package-native `types` conditions.

## Declaration Pack

| Area | Package export | Declaration |
| --- | --- | --- |
| Fabric Runtime | `./fabric` | `./fabric/xtend-fabric.d.ts` |
| Fabric/RMT Policy | `./fabric/rmt-lane-mapping`, `./fabric/hydration-policy` | `./fabric/*.d.ts` |
| A11y Policies | `./a11y/screenreader-signals`, `./a11y/motion-contrast-policy`, `./a11y/runtime-a11y-contract` | `./a11y/*.d.ts` |
| Security Policies | `./security/manifest-import-policy`, `./security/trusted-dom-policy`, `./security/supply-chain-gate-policy` | `./security/*.d.ts` |

The shared type core is in `fabric/xtend-policy-public-types.d.ts` and includes `XtendPolicyDiagnostic`, `XtendPolicyReport`, `XtendFabricFiberInput`, `XtendA11ySignal` and `XtendSecurityClassification`.

## Drift Gate

The gate verifies:

- every policy package export condition points to the expected `.d.ts`
- every declaration file exists and exports the runtime symbols of the corresponding JS module
- central diagnostic, report, fiber, a11y and security classification types remain present
- Fabric/a11y/security runtime files import no `.d.ts`
- no policy introduces runtime dependencies into components, loader, API or RMT kernel

## Handoff

`WP-TypeExports-06` can now type Builder, Scaffold and Component Lab program APIs. The policy pack continues the pattern for integration modules: existing JS runtime, narrow declaration facades, package-native `types` conditions and a drift gate against export deviations.
