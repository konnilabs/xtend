# XTend 0.9 release preparation

**RMTX and XTensions 2.0 are required scope for 0.9.0.** Both remain `preparing`; the package version identifies development progress, not completed release acceptance.

## Implemented scope

| Component | Available | Remaining acceptance |
| --- | --- | --- |
| RMT Classic | Renaming, shared compiler and retained `.rmt` contracts | Compatibility at the final release candidate |
| RMTX | Raw source profiles 1–8, native Views and managed catalog, mixed projects and semantic CLI/MCP/editor tooling | Complete role and target matrix, joint release evidence |
| XTensions 2.0 | Controlled State/Actions, URL/history, kernel/Fabric, provider chain, React/Vue SSR and the explicit RMTX handoff | Complete joint 0.9 acceptance |

The [working document](../../development/XTend-0.9-RMTX-und-XTensions-2.0-Bestandsaufnahme.md) tracks overall progress. [A06.5](../../development/rmtx-a06/project-tooling/implementation.md) is implemented and locally tested. The confirmed [A06.6 target decision](../../development/rmtx-a06/release-acceptance/implementation.md) selects native RMTX content and React/Vue with CSR and synchronous Node SSR for 0.9.

[A06.6.2](../../development/rmtx-a06/release-acceptance/rmtx-ssr-contract.md) adds separate SSR build/browser API1, signed source/project identity, SSR wire3, resume4, composition port11, plan runtime18 and renderer2.5. Actual Source8/Classic production cases with native content and React/Vue hosts, plus native-only apps, jointly pass 50 checks per lane on Node 24.18.0/26.5.0 and Chromium. Restore precedes adoption and validated provider-intent replay; typed keys, ownership, integrity, fallback and cancellation are checked. [Execution summary](../../development/rmtx-a06/release-acceptance/ssr-execution-summary.md).

Retained CSR entries gain no implicit SSR permission. [A05 SSR v1](../../development/rmtx-a05/README.md) and [scoped/component SSR v2](../../development/rmtx-a06/scoped-components.md) retain their contracts. Native SSR emits Light DOM and stable managed host shells; component internals and resource activation remain client owned. External assets require the actual configured deployed entry URL in the new Node `moduleBaseURL` option.

Native Source6/Source7/Source8 runtimes use separate API1 modules: `@ccslabs/xtend-maraca/native-lifecycle-ssr-runtime`, `native-orchestration-ssr-runtime` and `native-managed-ssr-runtime`. Retained CSR modules preserve their API versions and exact export sets; both paths share private integration ports. [Module boundary](../../development/rmtx-a06/release-acceptance/rmtx-ssr-contract.md#getrennte-native-runtimeeinstiege).

Portable RMTX Node/PHP page output, additional frameworks, streaming, cross-ownership portals and universal native DOM-event replay remain separate follow-up profiles. Authors own containers and styles; lanes and byte budgets provide no layout guarantee. The new handoff changes neither the `.rmtx` grammar nor the raw compiler's default source profile1.

## Release checks and next steps

A06.6.3 next accepts all 47 catalog roles. A06.6.4 completes the 120 selected framework/source/project-mode combinations and quality runs. Profile/ExecutionEvidence binding, final source/package/authority closure and sealing follow under A06.6.5/6. Individual successful vertical cases do not complete those requirements.

`scripts/release/feature-scope.json` requires both features. Preparation checks include the new focused SSR tests; the actual XTensions runtime gate additionally executes the v3 browser case as a separate run. Feature readiness remains blocked until complete bound evidence exists. Prepare and publish remain separate approvals.

```sh
npm run check:release-preparation
npm run release:features:plan
npm run release:features:check
```
