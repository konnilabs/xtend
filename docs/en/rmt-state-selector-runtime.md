# RMT State Selector Runtime

Typed state, selectors and reducers as a runtime foundation.

## What it covers

The state selector runtime separates canonical RMT state from derived view models. Selectors read known paths; reducers change state through actions, while renderers consume results only.

## Public building blocks

- `xtendrmt/rmt-state-selector-runtime.js` implements state, selectors, and reducers without a DOM capability.
- `xtendrmt/rmt-state-host-adapter.js` provides the explicitly injected state projection boundary.
- `xtendrmt/rmt-state-binding-view-projector.js` projects frozen model snapshots through the shared DOM renderer.
- `xtendrmt/rmt-state-selector-runtime.d.ts` describes the public runtime surface.
- `tests/fixtures/rmt-state-selector-runtime.rmt` covers compile and host integration.

```txt
runtime contract: xtend.epic18.rmt-state-selector-runtime.v2
stateProjectionPort: injected-host-adapter
preservePatchPlan: selection updates keep the existing DOM patch plan
next workpackage: WP-E18-08
```

## Recommended workflow

Define state and selector in source, compile references, and only then inject the host-state adapter. A selector must not perform DOM work or side effects; missing paths produce diagnostics.

The Model entrypoint imports neither a host adapter nor a View projector. When using `stateProjectionTarget`, explicitly inject `createStateProjectionPort: createRmtStateHostAdapter`; alternatively supply a ready-made `stateProjectionPort` implementing `batchUpdate()`. A port instance alone does not provide a factory for later `connectStateProjection()` calls. Strict connections continue to require atomic host batches.

For DOM bindings, use `createRmtStateBindingViewProjector().project(root, bindings, runtime.modelReader.snapshot())`. The `rmt-state-selector-runtime.compat.js` facade and its `applyRmtStateBindings` and `createRmtStateBindingAdapter` functions were removed with RMT 0.8 and are not current runtime exports. Declarations and tests follow the existing Model, host and View interfaces.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
