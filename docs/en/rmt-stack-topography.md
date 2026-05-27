# RMT Stack Topography

The RMT stack topography explains how RMT source, compiler, kernel, Fabric and UI layers work together. It helps you treat XTendRMT not only as a document language, but as a building block for larger applications.

![RMT stack topography](../assets/rmt-stack-topography.svg)

## Layers

RMT source describes app structure, state, selectors, actions, events, resources, surfaces and scheduling intent. The compiler turns that description into stable core records.

The RMT kernel processes those records in a host-neutral way. It schedules work, manages runtime state, triggers actions, publishes diagnostics and stays independent from DOM, CSS and frameworks.

XTend Fabric translates scheduling intent into lanes, hydration decisions, telemetry and backpressure signals. Host adapters connect those signals to browser, server, worker or app shell environments.

XTend UI, React, Vue or VanillaJS render at the edge of the system. They receive props, attributes, slots, events and hydration tasks through adapters, so the concrete UI layer remains replaceable.

## Integration Models

In an XTend-only model, RMT describes the app shell, Fabric coordinates the work and XTend UI renders the visible Web Components.

In an MFE model, an XTend shell can provide surfaces for other teams. Those surfaces can use XTend UI, React, Vue or VanillaJS as long as they are connected through clear DOM and adapter boundaries.

In a scheduler model, the RMT kernel runs as an orchestration layer beside existing frontends. The app then uses RMT for state, actions, resources and scheduling while the concrete UI can stay in an existing framework.

## Next Steps

- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [XTend UI Runtime Layer](./xtend-ui-runtime-layer.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)

## Public contract

RMT Stack Topography is the public RMT runtime contract for `docs/en/rmt-stack-topography.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT records, compiler output, runtime adapters, events, actions and scheduler lanes.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/rmt-stack-topography.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/rmt-stack-topography.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`

Commands:
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If runtime behavior differs, separate compiler record, host adapter and scheduler signal before changing the docs.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
