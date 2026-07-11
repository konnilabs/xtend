# RMT Next Steps

You now know the core RMT-vNext flow: templates define boundaries, surfaces define renderable units, state and selectors define data, actions handle intent, resources describe lifecycle ownership and lanes express scheduling priority.

## Where To Go Next

Use [RMT vNext Authoring](./rmt-vnext-authoring.md) as the guided entry point and [RMT Reference](./rmt-reference.md) for the complete operator syntax. Read the [App DSL](./xtendrmt-app-dsl.md) when you want to model full applications, then continue with [XTend Maraca](./xtend-maraca.md), the [Runtime Bridge](./xtendrmt-runtime-bridge.md), [RMT Linter](./rmt-linter.md) and [Language Server](./rmt-language-server.md).

For UI integration, read [SurfaceManager Authoring](./surface-manager-authoring-guide.md) and [XTend Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md).

## Practice

Open the [RMT Playground](./learn-rmt-playground.md), add a second surface and give it a lower lane weight. Then compare the compiled output with the reference docs.

## Production Path

When your practice document contains state, actions, validation or surface transitions, continue it as a Maraca app. Start with [XTend Maraca](./xtend-maraca.md), then check [Maraca Orchestration](./xtend-maraca-orchestration.md) and compare your document with `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`. The decisive local check is the strict build, because it proves public app orchestration rather than only the parser path.

## Local completion check

Verify the learning path, playground, and reference together. The JSON report identifies the failing suite and remains machine-readable in CI:

```bash
node scripts/run_xtend_tests.js rmt-playground-docs rmt-reference-docs --json
```

If the run fails, correct the RMT source against `tools/rmt-language/vnext-parser.js` first, then rerun the command unchanged.
