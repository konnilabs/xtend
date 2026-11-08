# XTend 0.9 release preparation

**RMTX and XTensions 2.0 are required scope for 0.9.0.** Both features are being prepared. The package version identifies the development branch, not completed feature acceptance.

## Status and acceptance

| Component | Status | Required evidence |
| --- | --- | --- |
| RMT Classic | Renaming and shared compiler contract implemented | Compatibility and regressions |
| RMTX | Backend prepared; syntax and frontend pending | Parser/lowering, editor, mixed projects, browser/SSR |
| XTensions 2.0 | Static instance/state/Action integration through compiler and Maraca implemented | Dynamic hosts, URL/history, cooperative kernel jobs, automatic adapter/provider/host chain and SSR/resume remain pending |

A02.2 takes a Classic document through to two actual React roots. Current versions: Maraca plan/configuration v2, runtime v4, browser/host/compiler API 2.0.0. The Classic AST remains 1.0.0; RMTX syntax is still pending. See the [contract and evidence](../../development/rmtx-a02/README.md).

## Release checks

`scripts/release/feature-scope.json` requires both features. `npm run check:release-preparation` checks contract drift, inventory, package versions, and scope in PR, push, and nightly gates. `release:features:check` currently blocks as expected. CI candidates may contain pending features. Sealing and publishing require source-bound feature evidence and existing release gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Next steps

The [inventory](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) describes next steps and limitations. The [Classic contract](./rmt-classic-contract.md) provides the shared compiler foundation. Concrete RMTX syntax and individual framework adapter capabilities require their own implementation and verification.
