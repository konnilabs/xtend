# RMT Cross Surface Events

Events between surfaces without loose global event coupling.

## What it covers

RMT Cross Surface Events describes the public RMT surface for this page: which records are involved, which adapters exercise them and which scheduler signals a host should verify.

## Public building blocks

- `.rmt` sources.
- Core records and source maps.
- Host adapters for DOM, router and components.

## Recommended workflow

Start RMT Cross Surface Events with the smallest record example, validate it with the linter and only then attach adapters for host data, routing or components.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [RMT vNext Enterprise MFE contract](./rmt-vnext-enterprise-mfe-handoff.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Event protocol

Cross-surface events use `xtend.rmt.vnext-cross-surface-event-protocol.v1`. Governance rules, owners, versions and allowed target scopes are checked through `xtend.rmt.vnext-event-governance-policy.v1`. That keeps the boundary clear: surfaces may signal each other, but there is `no implicit global Event Bus`.

The Enterprise fixture uses two stable event names:

- `checkout.cart.updated.v1`
- `user.session.changed.v1`

These names are part of the public contract because host adapters, telemetry and regression gates must find them again. If an event is renamed, update the fixture, Core output, governance policy and browser smoke together.

## Minimal event path

```rmt
event checkout.cart.updated.v1 {
  from surface checkout.cart
  to surface commerce.summary
  payload contract checkout.cart.payload.v1
}
```

Check event changes locally:

```bash
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events rmt-vnext-event-governance --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

If the governance gate fails, fix the owner, payload contract or target surface first. A host-side event bus must not hide the error.

## Public contract

RMT Cross Surface Events is the public RMT runtime contract for `docs/en/rmt-vnext-cross-surface-events.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT records, compiler output, runtime adapters, events, actions and scheduler lanes.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/rmt-vnext-cross-surface-events.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/rmt-vnext-cross-surface-events.md`
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
