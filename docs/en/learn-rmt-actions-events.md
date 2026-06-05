# Actions and Events

Actions describe state changes and emitted domain events. Surfaces can bind DOM or component events to those actions without embedding executable JavaScript in the RMT source.

## Safe Event Flow

Keep event selectors declarative, pass payload values through the action input and let the runtime apply reducers.

```rmt
template learn.rmt.interactions {
  state page.counter type object preserve {
    initial {
      value 0
      status "ready"
    }
  }

  action page.increment {
    input label string
    reduce state.page.counter.status = "incremented"
    emit page.counter.incremented with label input.label
  }

  surface counter.card kind card component x-status {
    lane visible weight 90 {
      mount counter-card
    }

    on click "[data-action=increment]" -> action page.increment {
      payload label from target.dataset.label
    }
  }
}
```

## Maraca Action Gates

Maraca connects actions with validation, scheduler targets and telemetry. An `emit` record is useful in the strict path only when payload names stay stable and the surface binding points to an existing action. For form flows, [Maraca Orchestration](./xtend-maraca-orchestration.md) checks whether the `target action` from a `validation` group really matches that action.

## Collection And Command Events

The owned RMT surface extends the same rule to data display and command/search:

- `event.collection.select` sends `$event.key` to `action.orders.select`.
- `event.collection.sort` sends `$event.sort` to `action.orders.sort`.
- `event.command.query` sends `$event.value` to `action.command.query`.
- `event.command.execute` sends `$event.commandId` to a policy-bound effect action.

Command execution must stay registered and action-referenced. A search result selection should route through `action.command.execute`, and that action should use `policy: "registered-command-required"` before reaching the host effect.

See [RMT Event Routing Runtime](./rmt-event-routing-runtime.md) and [RMT Action Effect Runtime](./rmt-action-effect-runtime.md) for the full contract.

## Next Step

Add external data and lifecycle cleanup with [Data and Resources](./learn-rmt-data-resources.md).

## Public contract

Actions and Events is the public learning path contract for `docs/en/learn-rmt-actions-events.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT sources, parser behavior, linter diagnostics and playground output.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/learn-rmt-actions-events.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/learn-rmt-actions-events.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `x-status`

Commands:
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`
- `node scripts/run_xtend_tests.js rmt-event-routing-runtime rmt-action-effect-runtime --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If an example does not compile, check token order, record names and linter output first.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
