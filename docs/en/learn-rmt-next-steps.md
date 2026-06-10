# RMT Next Steps

You now know the core RMT-vNext flow: templates define boundaries, surfaces define renderable units, state and selectors define data, actions handle intent, resources describe lifecycle ownership and lanes express scheduling priority.

## Where To Go Next

Use [RMT vNext Authoring](./rmt-vnext-authoring.md) as the guided entry point and [RMT Reference](./rmt-reference.md) for the complete operator syntax. Read the [App DSL](./xtendrmt-app-dsl.md) when you want to model full applications, then continue with [XTend Maraca](./xtend-maraca.md), the [Runtime Bridge](./xtendrmt-runtime-bridge.md), [RMT Linter](./rmt-linter.md) and [Language Server](./rmt-language-server.md).

For UI integration, read [SurfaceManager Authoring](./surface-manager-authoring-guide.md) and [XTend Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md).

## Practice

Open the [RMT Playground](./learn-rmt-playground.md), add a second surface and give it a lower lane weight. Then compare the compiled output with the reference docs.

## Production Path

When your practice document contains state, actions, validation or surface transitions, continue it as a Maraca app. Start with [XTend Maraca](./xtend-maraca.md), then check [Maraca Orchestration](./xtend-maraca-orchestration.md) and compare your document with `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`. The decisive local check is the strict build, because it proves public app orchestration rather than only the parser path.

## Public contract

RMT Next Steps is the public learning path contract for `docs/en/learn-rmt-next-steps.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT sources, parser behavior, linter diagnostics and playground output.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/learn-rmt-next-steps.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/learn-rmt-next-steps.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-reference-docs --json`

Commands:
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-reference-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If an example does not compile, check token order, record names and linter output first.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
