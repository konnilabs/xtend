# XTend Policy Types

XTend Policy Types document the shared types for Fabric, accessibility and security policies. This surface matters for teams that process diagnostics reports, a11y signals, security classifications or Fabric fiber inputs without importing internal modules. The shared declarations live in `./fabric/xtend-policy-public-types.d.ts` and are consumed by the public Fabric types.

## Policy Surface

The package surface includes `./fabric/xtend-fabric.d.ts` and the shared policy types. Important names include `XtendPolicyDiagnostic`, `XtendPolicyReport`, `XtendFabricFiberInput`, `XtendA11ySignal` and `XtendSecurityClassification`. They describe how XTend exposes runtime decisions, accessibility preferences, security classifications and scheduler inputs as data.

For host applications this separation is useful because policy results can be processed without depending on a specific component implementation or RMT kernel. A monitoring adapter can collect reports, a test can verify accessibility signals and a shell adapter can pass Fabric fiber inputs through with type support.

## Stability Rule

Policy types must not introduce new runtime dependencies into components or the RMT kernel. The declarations describe data shapes; they do not load additional modules. That keeps the surface consistent for browser hosts, Node checks and package consumers. When new policy data is added, prefer additive fields or specific new types so existing hosts keep compiling.

The rule protects embedded environments in particular. A host can store or forward `XtendPolicyReport` without loading Fabric itself. Likewise, a security adapter can evaluate `XtendSecurityClassification` while the component that produced the signal remains unchanged.

## Local Verification

Run the policy type check whenever Fabric declarations, a11y signals, security classifications, package exports or release metadata change.

```bash
node scripts/run_xtend_tests.js type-exports-policy --json
```

```txt
schema: xtend.type-exports.policy-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-policy --json
report: .xtend-test-results/xtend-type-exports-policy-report.json
```

## Maintenance Notes

Keep policy types data-centered. A new report should make clear which source emits it, which fields are stable and how a host should handle optional missing data. If a name becomes public in `./fabric/xtend-fabric.d.ts`, it should also be visible in the shared declaration and the TypeExports plan. This keeps diagnostics, accessibility and security usable as public contracts without exposing internal scheduling details.

## Related reading

The manifest import policy shows where typed policy decisions become observable diagnostics. [Related article](./manifest-import-policy.md)
