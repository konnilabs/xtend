# RMT State Selector Runtime

Typed state, selectors and reducers as a runtime foundation.

## What it covers

The state selector runtime separates canonical RMT state from derived view models. Selectors read known paths; reducers change state through actions, while renderers consume results only.

## Public building blocks

- `xtendrmt/rmt-state-selector-runtime.js` implements state, selectors, and reducers without a DOM capability.
- `xtendrmt/rmt-state-binding-view-projector.js` projects frozen model snapshots through the shared DOM renderer; the former binding helpers remain compatibility delegates for 0.6.
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

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)
