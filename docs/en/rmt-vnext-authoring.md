# RMT Authoring Guide

Write app shells, routes, surfaces and interactions in one RMT source.

## What it covers

RMT vNext authoring moves from readable `.rmt` source to validated core records. The language separates declarative app structure from host services and makes references, ownership, and scheduling checkable before runtime.

## Public building blocks

- `tools/rmt-language/vnext-parser.js` reads vNext records.
- `tools/rmt-language/vnext-compiler.js` emits the core document.
- `docs/xtendrmt-docs-shell-vnext.rmt` is a larger real-world source fixture.

## Recommended workflow

Write a template, state, and one surface first. Run parser and linter, then add actions, resources, and policies, checking each step through the core diff rather than accidental browser behavior.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT AnimationEngine](./rmt-animation-engine.md)
- [RMT Reference](./rmt-reference.md)
- [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT vNext Release contract](./rmt-vnext-migration-notes.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Orchestration Primitives

RMT vNext can now describe the full app orchestration that Maraca materializes into a loaderless bundle. In addition to `state`, `selector`, `action`, `resource`, `event`, `surface`, `portal` and `overlay`, `validation`, `animation` and `transition` are native authoring blocks. The compiler lowers them into `xtend.rmt.app-orchestration.v1`, `xtend.rmt.form-validation.v1`, `xtend.rmt.surface-transitions.v1` and `xtend.rmt.animation-engine.v1`, then emits scheduler targets, patch plans, source maps and redacted diagnostics.

```rmt
validation product.service.contact {
  mode blocking
  target action product.service.nextContact
  field product.service.email required email message "Enter a valid email address."
}

transition product.service.contactToIssue {
  trigger action product.service.nextContact
  from surfaces [product.service.email product.service.nextContact]
  to surfaces [product.service.subject product.service.nextIssue]
  effect crossfade
  durationMs 240
  easing "ease-out"
  lane transition
}
```

Strict builds expect complete payload contracts, resource ownership, hydration policies, known component capabilities, messages for every validation field and resolvable transition surfaces. Maraca turns this into kernel, hydration, validation and transition runtimes; host code stays adapter logic.

The [Hydration Policies](./hydration-policies.md) deep dive separates execution mode, scheduling policy, and DOM ownership, with compilable examples for client rendering, SSR hydration, resume, and worker prerender.

## Reference demo and release contract

The RMT vNext Authoring Guide is bound to the release handoff `xtend.rmt.vnext-release-handoff.v1`. The reference source `demos/xtendrmt/fixtures/vnext-reference/source.rmt` shows the smallest complete combination of `template`, `surface`, `lane`, `when`, `slot`, `stream`, `trust boundary`, `sanitize html` and event-action binding. The expected Core output lives in `demos/xtendrmt/fixtures/vnext-reference/generated/core.json`.

```rmt
template xtend.vnext.reference {
  surface root {
    lane critical weight 10 {
      hydrate app-shell
      hydrate hero-panel when route.visible == true
    }
  }
}
```

When an example in this guide grows, it must either stay compatible with the reference demo or be covered as a new fixture in `tests/rmt-language`. The [RMT vNext Release contract](./rmt-vnext-migration-notes.md) page describes which gates are authoritative for this contract.

Continue with the [AnimationEngine guide](./rmt-animation-engine.md) for a focused path through AOT presets, transitions, keyframes and reduced-motion policies.
