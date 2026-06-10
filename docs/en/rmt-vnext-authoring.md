# RMT Authoring Guide

Write app shells, routes, surfaces and interactions in one RMT source.

## What it covers

RMT Authoring Guide describes the public RMT surface for this page: which records are involved, which adapters exercise them and which scheduler signals a host should verify.

## Public building blocks

- `.rmt` sources.
- Core records and source maps.
- Host adapters for DOM, router and components.

## Recommended workflow

Start RMT Authoring Guide with the smallest record example, validate it with the linter and only then attach adapters for host data, routing or components.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Reference](./rmt-reference.md)
- [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT vNext Release contract](./rmt-vnext-release-handoff.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Orchestration Primitives

RMT vNext can now describe the full app orchestration that Maraca materializes into a loaderless bundle. In addition to `state`, `selector`, `action`, `resource`, `event`, `surface`, `portal` and `overlay`, `validation` and `transition` are native authoring blocks. The compiler lowers them into `xtend.rmt.app-orchestration.v1`, `xtend.rmt.form-validation.v1` and `xtend.rmt.surface-transitions.v1`, then emits scheduler targets, patch plans, source maps and redacted diagnostics.

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

## Reference demo and release contract

The RMT vNext Authoring Guide is bound to the release handoff `xtend.rmt.vnext-release-handoff.v1`. The reference source `xtendrmt/rmt-vnext-reference-demo.rmt` shows the smallest complete combination of `template`, `surface`, `lane`, `when`, `slot`, `stream`, `trust boundary`, `sanitize html` and event-action binding. The expected Core output lives in `xtendrmt/rmt-vnext-reference-demo.core.json`.

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

When an example in this guide grows, it must either stay compatible with the reference demo or be covered as a new fixture in `tests/rmt-language`. The [RMT vNext Release contract](./rmt-vnext-release-handoff.md) page describes which gates are authoritative for this contract.

## Public contract

RMT Authoring Guide is the public RMT runtime contract for `docs/en/rmt-vnext-authoring.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT records, compiler output, runtime adapters, events, actions and scheduler lanes.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/rmt-vnext-authoring.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/rmt-vnext-authoring.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `xtend.rmt.app-orchestration.v1`

Commands:
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-reference-docs --json`
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

- If runtime behavior differs, separate compiler record, host adapter and scheduler signal before changing the docs.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
