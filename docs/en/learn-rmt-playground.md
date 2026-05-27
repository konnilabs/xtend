# RMT Playground

The RMT Playground compiles RMT-vNext source inside the Developer Center. It uses `x-surface-manager` for the workspace, `x-textarea` for the first editor version, diagnostics and JSON output panels, and a safe preview target that never renders raw compiler HTML.

## Try It

The interactive playground is rendered below this article. Change the source and the compiler runs after a short debounce. Diagnostics show line and column ranges when the compiler can provide them.

```rmt
template learn.rmt.playground {
  state preview.message type object preserve {
    initial {
      id "hello"
      text "Hello from the playground"
      tone "success"
    }
  }

  selector preview.message from state preview.message {
    output PreviewMessage
  }

  surface preview.card kind card component x-status {
    source selector preview.message
    key message.id

    lane visible weight 80 {
      hydrate preview-card from selector preview.message
    }
  }
}
```

## Safety Model

The compile endpoint accepts POST requests only, limits source size and returns JSON diagnostics plus core output. The preview surface renders a structured summary with DOM APIs, not `innerHTML`.

## Maraca Runtime Preview

Successful sources are also sent with `playgroundMode: "maraca-preview"` to `docs/index.php?xtend-rmt-playground=compile`. The response still contains `coreJson` and `preview`, and adds `maraca.schema = "xtend.docs.rmt-playground.maraca-preview.v1"` with feature status for `orchestration`, `kernel`, `hydration`, `validation` and `transitions`.

Choose the `Customer Service Kernel` preset to run the app from `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt` in the browser. The preview loads only the whitelisted runtime modules from `DOCS_RMT_PLAYGROUND_MARACA_RUNTIME_MODULES`, materializes surfaces in an isolated root, routes DOM events to RMT actions, patches validation gates such as `product.service.nextContact` and records transition events such as `xtend-maraca:surface-transition-start`.

Browser smokes can read `window.xtendDocsRmtPlaygroundLastMaraca`. A successful snapshot includes kernel, validation and transition counters; the local gate is `node scripts/run_xtend_tests.js rmt-playground-docs rmt-playground-security --json`.

## From Playground To Bundle

Use the playground for quick syntax and model tests, but rely on Maraca for production app orchestration. Copy a working example into a `.rmt` file, add real portals, validation and transitions, then build it with `xt maraca build`. That checks the same RMT expression against the bundle report, kernel plan and browser bridge instead of only the preview output.

## Next Step

Finish the guided path with [Next Steps](./learn-rmt-next-steps.md).

## Public contract

RMT Playground is the public learning path contract for `docs/en/learn-rmt-playground.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT sources, parser behavior, linter diagnostics and playground output.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/learn-rmt-playground.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/learn-rmt-playground.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `x-surface-manager`

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
