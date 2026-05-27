# Scheduling and Lanes

Lanes let an RMT document separate urgent UI work from visible hydration and background tasks. XTend Fabric can map those lane names and weights into runtime scheduling.

## Lane Priority

Use high weights for immediate interaction surfaces, medium weights for visible content and low weights for optional work.

```rmt
template learn.rmt.scheduling {
  surface dashboard.card kind card component x-status {
    lane critical weight 100 {
      mount dashboard-shell
    }

    lane visible weight 85 {
      hydrate dashboard-summary
    }

    lane idle weight 5 {
      hydrate analytics-panel
    }
  }
}
```

## Design Rule

Treat lanes as user experience intent. The lane says why work matters; the runtime decides how to execute it on the current platform.

## Maraca Kernel Path

In the loaderless Maraca path, lanes become scheduler entries in the bundle. `critical`, `visible`, `idle` and `transition` do not stay loose host strings; they are lowered into kernel and fiber plans. Use [Maraca Orchestration](./xtend-maraca-orchestration.md) when you need to inspect which endpoints the build creates for hydration, actions and surface transitions.

## Next Step

Before previewing arbitrary source, read [Security and Preview](./learn-rmt-security-preview.md).

## Public contract

Scheduling and Lanes is the public learning path contract for `docs/en/learn-rmt-scheduling-lanes.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT sources, parser behavior, linter diagnostics and playground output.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/learn-rmt-scheduling-lanes.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/learn-rmt-scheduling-lanes.md`
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
