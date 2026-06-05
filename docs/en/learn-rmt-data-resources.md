# Data and Resources

RMT can describe host data sources and runtime resources next to the surfaces that use them. The runtime still owns execution; the RMT document declares the contract.

## Data Contracts

Use `datasource` for host calls and `resource` for things that must be released, such as timers, subscriptions or object URLs.

```rmt
template learn.rmt.dataflow {
  state app.items type object preserve {
    initial {
      id "inbox"
      count 3
    }
  }

  selector app.itemsView from state app.items {
    output ItemsView
  }

  datasource app.items from endpoint "/api/items" {
    method GET
    contract ItemList
    result records
    fallback fixture app.items.fixture
  }

  resource app.refreshTimer kind timer owner surface.inbox.card {
    dispose on surface.destroy
  }

  surface inbox.card kind card component x-status {
    source selector app.itemsView
    key items.id
    bounds x 16 y 16 width 320 height 100
    destroy releases resource app.refreshTimer

    lane visible weight 75 {
      hydrate inbox-card from selector app.itemsView
    }
  }
}
```

## Maraca Resource Ownership

Resources are more than runtime notes for Maraca. `owner surface.inbox.card` and `destroy releases resource app.refreshTimer` are used in the orchestration plan so the kernel runtime and surface lifecycle share the same ownership rule. If the build cannot resolve a resource owner, treat that as a real app problem, not as missing prose in the docs.

## Collection And Search Resources

The owned RMT surface uses the same data and resource model for data display and command/search:

- `resource.orders` feeds `selector.visibleOrders`, which feeds `collection.orders`.
- `resource.commands` feeds `selector.visibleCommands`, which feeds `search.commands`.
- Dashboard resources stay owner-scoped to their surface.
- Popover resources can use `release: "on-surface-close"` so query data is cleaned up when the overlay closes.

Use [Native-First RMT Recipes](./native-first-rmt-recipes.md) for the full collection and command/search records, and [RMT Surface Resource Graph Runtime](./rmt-surface-resource-graph-runtime.md) for cleanup rules.

## Next Step

Control render priority with [Scheduling and Lanes](./learn-rmt-scheduling-lanes.md).

## Public contract

Data and Resources is the public learning path contract for `docs/en/learn-rmt-data-resources.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT sources, parser behavior, linter diagnostics and playground output.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/learn-rmt-data-resources.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/learn-rmt-data-resources.md`
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
- `node scripts/run_xtend_tests.js rmt-owned-data-display-primitives rmt-owned-command-search-primitives --json`

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
