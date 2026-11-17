# XTend 0.9 release preparation

**RMTX and XTensions 2.0 are required scope for 0.9.0.** Both features are being prepared. The package version identifies the development branch, not completed feature acceptance.

## Status and acceptance

| Component | Status | Required evidence |
| --- | --- | --- |
| RMT Classic | Renaming and shared compiler contract implemented | Compatibility and regressions |
| RMTX | A06.2 v1 default plus opt-in selector-v2 and host-scope-v3 profiles implemented | Further operators/expressions, native UI, semantic editor, mixed projects and complete browser/SSR acceptance |
| XTensions 2.0 | State/Actions, URL/history, kernel/Fabric, provider chain and React/Vue SSR/adoption implemented | Additional frameworks, cross-framework ownership and full 0.9 acceptance |

[A05](../../development/rmtx-a05/README.md) adds actual Node SSR and signed Model restore before adoption and intent replay for exclusive React/Vue containers. The additional [keyed component SSR profile](../../development/rmtx-a06/scoped-components.md) supports nested typed keys, common owners and separate render targets: build API 12, composition/browser API 9, CSR/SSR plan runtime v11/v12 and SSR data profile v2. Previous profiles, including A05 SSR v1, remain supported; Classic AST 1.0.0 and resume registry 3 retain their existing contracts.

[A06.2](../../development/rmtx-a06/frontend/README.md) provides separate parser/compiler APIs 1.0.0 through the explicit Maraca compiler port. The actual `.rmtx` two-host reference runs through the regular build/boot with React and Vue. This limited productive CSR acceptance is not complete RMTX or 0.9 release acceptance.

[A06.3.1](../../development/rmtx-a06/selector-profile/README.md) adds selectors and static readsets. [A06.3.2](../../development/rmtx-a06/keyed-profile/README.md) connects nested RMTX repeats, boolean presence and stable typed keys to the existing React/Vue bindings; native event guards use explicit payload mapping. [A06.3](../../development/rmtx-a06/orchestration-profile/README.md) now adds explicit syntax profile4 with 110 tags, validated Action inputs, closed props projections and pinned inline React/Vue hosts. Module APIs4 retain default1 and unchanged profiles1/2/3. The closed A06.3 contract is implemented.

## Release checks

`scripts/release/feature-scope.json` requires both features. `npm run check:release-preparation` checks contract drift, inventory, package versions, and scope in PR, push, and nightly gates. `release:features:check` currently blocks as expected. CI candidates may contain pending features. Sealing and publishing require source-bound feature evidence and existing release gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Next steps

The [inventory](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) and [Classic contract](./rmt-classic-contract.md) describe scope and the shared compiler foundation. After A06.3, native UI including typed DOM loops and lifecycle conditions, semantic tooling and joint target/release acceptance follow in A06.4–A06.6. Source4 SSR/adoption is explicitly blocked until its own acceptance. Additional framework and ownership profiles require explicit decisions and evidence.
