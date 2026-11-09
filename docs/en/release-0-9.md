# XTend 0.9 release preparation

**RMTX and XTensions 2.0 are required scope for 0.9.0.** Both features are being prepared. The package version identifies the development branch, not completed feature acceptance.

## Status and acceptance

| Component | Status | Required evidence |
| --- | --- | --- |
| RMT Classic | Renaming and shared compiler contract implemented | Compatibility and regressions |
| RMTX | Backend prepared; syntax and frontend pending | Parser/lowering, editor, mixed projects, browser/SSR |
| XTensions 2.0 | Instance/state/Action integration, conditional and repeated hosts implemented | Router/Maraca integration of the URL contract, kernel jobs, automatic provider/host chain and SSR/resume pending |

A02.5.1 defines the [URL/history contract](../../development/rmtx-a02/url-history/README.md), reference API 1.0.0 and four new v1 formats. Production integration remains pending. Existing versions: binding v2, sidecar v3, Maraca plan/configuration v4, runtime v6, compiler/browser API 4.0.0, Classic AST 1.0.0.

## Release checks

`scripts/release/feature-scope.json` requires both features. `npm run check:release-preparation` checks contract drift, inventory, package versions, and scope in PR, push, and nightly gates. `release:features:check` currently blocks as expected. CI candidates may contain pending features. Sealing and publishing require source-bound feature evidence and existing release gates.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```

## Next steps

The [inventory](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) describes next steps and limitations. The [Classic contract](./rmt-classic-contract.md) provides the shared compiler foundation. Concrete RMTX syntax and individual framework adapter capabilities require their own implementation and verification.
