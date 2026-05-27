# State and Selectors

State declares data owned by the template. Selectors expose stable view models for surfaces, actions and adapters.

## Keep State Explicit

Use `state` for durable template data and `selector` for the shape a component should consume. This keeps render contracts readable and makes compiler diagnostics more useful.

```rmt
template learn.rmt.stateflow {
  state dashboard.summary type object preserve {
    initial {
      id "summary"
      title "Orders"
      status "ready"
    }
  }

  selector dashboard.summary from state dashboard.summary {
    output DashboardSummary
  }

  surface dashboard.card kind card component x-status {
    source selector dashboard.summary
    key summary.id

    lane visible weight 80 {
      hydrate dashboard-card from selector dashboard.summary
    }
  }
}
```

## Workflow Tip

Name selectors after the view model they provide, not after the component that first consumes them. That makes the selector reusable when the UI changes.

## Maraca State Contract

In a Maraca build, `state` and `selector` become parts of the orchestration artifact. The bundle report shows which view models belong to hydration, actions and browser bridges. If a selector should later be visible through `window.XTendMaraca.orchestration.snapshot()`, keep it explicitly named in the RMT source instead of deriving it only from a component.

## Next Step

Learn how user intent flows through [Actions and Events](./learn-rmt-actions-events.md).

## Public contract

State and Selectors is the public learning path contract for `docs/en/learn-rmt-state-selectors.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT sources, parser behavior, linter diagnostics and playground output.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/learn-rmt-state-selectors.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/learn-rmt-state-selectors.md`
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
