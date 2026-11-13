# XTend 0.9 release preparation

**RMTX and XTensions 2.0 are required scope for 0.9.0.** Both features are being prepared. The package version identifies the development branch, not completed feature acceptance.

## Status and acceptance

| Component | Status | Required evidence |
| --- | --- | --- |
| RMT Classic | Renaming and shared compiler contract implemented | Compatibility and regressions |
| RMTX | Backend prepared; syntax and frontend pending | Parser/lowering, editor, mixed projects, browser/SSR |
| XTensions 2.0 | State/Actions, URL/history, kernel/Fabric, provider chain and React/Vue SSR/adoption implemented | Additional frameworks, cross-framework ownership and full 0.9 acceptance |

[A05](../../development/rmtx-a05/README.md) adds actual Node SSR and signed Model restore before adoption and intent replay for exclusive React/Vue containers. Build API 10; composition/browser/host API 7; SSR plan runtime v9 and resume registry 3. Previous contracts remain supported. Regular composition still uses plan runtime v8 and registry 2.4.0; Classic AST 1.0.0 remains unchanged.

## Release checks

`scripts/release/feature-scope.json` requires both features. `npm run check:release-preparation` checks contract drift, inventory, package versions, and scope in PR, push, and nightly gates. `release:features:check` currently blocks as expected. CI candidates may contain pending features. Sealing and publishing require source-bound feature evidence and existing release gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Next steps

The [inventory](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) describes next steps and limitations. The [Classic contract](./rmt-classic-contract.md) provides the shared compiler foundation. A06 addresses RMTX syntax and developer experience next; additional framework and ownership profiles require their own implementation and evidence.
