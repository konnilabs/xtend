# XTend 0.9 release preparation

**RMTX and XTensions 2.0 are required scope for 0.9.0.** Both features are being prepared. The package version identifies the development branch, not completed feature acceptance.

## Status and acceptance

| Component | Status | Required evidence |
| --- | --- | --- |
| RMT Classic | Renaming and shared compiler contract implemented | Compatibility and regressions |
| RMTX | A06.2 v1 default and opt-in A06.3.1 selector profile v2 implemented | Further operators/expressions, native UI, semantic editor, mixed projects and complete browser/SSR acceptance |
| XTensions 2.0 | State/Actions, URL/history, kernel/Fabric, provider chain and React/Vue SSR/adoption implemented | Additional frameworks, cross-framework ownership and full 0.9 acceptance |

[A05](../../development/rmtx-a05/README.md) adds actual Node SSR and signed Model restore before adoption and intent replay for exclusive React/Vue containers. The additional [keyed component SSR profile](../../development/rmtx-a06/scoped-components.md) supports nested typed keys, common owners and separate render targets: build API 12, composition/browser API 9, CSR/SSR plan runtime v11/v12 and SSR data profile v2. Previous profiles, including A05 SSR v1, remain supported; Classic AST 1.0.0 and resume registry 3 retain their existing contracts.

[A06.2](../../development/rmtx-a06/frontend/README.md) provides separate parser/compiler APIs 1.0.0 through the explicit Maraca compiler port. The actual `.rmtx` two-host reference runs through the regular build/boot with React and Vue. This limited productive CSR acceptance is not complete RMTX or 0.9 release acceptance.

[A06.3.1](../../development/rmtx-a06/selector-profile/README.md) adds five selector operators, a closed boolean expression profile and static dependency reports. Module APIs 2.0.0 retain v1 as the default; syntax profile 2.0.0 is selected explicitly. This does not introduce incremental selector runtime evaluation or complete A06.3 acceptance.

## Release checks

`scripts/release/feature-scope.json` requires both features. `npm run check:release-preparation` checks contract drift, inventory, package versions, and scope in PR, push, and nightly gates. `release:features:check` currently blocks as expected. CI candidates may contain pending features. Sealing and publishing require source-bound feature evidence and existing release gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Next steps

The [inventory](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) and [Classic contract](./rmt-classic-contract.md) describe scope and the shared compiler foundation. A06.3 remains in progress after its selector/readset slice; conditions, repetitions and typed keys form the next coherent slice; native UI, tooling and joint release acceptance follow in A06.4–A06.6. Additional framework and ownership profiles require explicit decisions and evidence.
