# Learn RMT

Learn RMT is the guided path for writing RMT-vNext documents. It starts with the language model, then builds toward state, actions, resources, scheduling and the integrated playground. For shipped applications, Maraca is the orchestration path that follows.

## What RMT Is

RMT describes application structure as a compileable document. Instead of wiring every surface by hand, you declare the app template, the state it owns, the selectors that expose view models, the actions that change state and the surfaces that XTend should render or hydrate.

The compiler turns that source into a stable core document that the XTend runtime, SSR adapters and tooling can inspect.

```rmt
template learn.rmt.hello {
  surface root {
    lane visible weight 80 {
      mount hello-card
    }
  }
}
```

## Learning Path

Start with [syntax basics](./learn-rmt-syntax-basics.md), then continue through templates, state, actions, data, scheduling and security. Use the [RMT Playground](./learn-rmt-playground.md) whenever you want to compile a small example without leaving the Developer Center.

## From RMT To Maraca

The learning path teaches the language; [XTend Maraca](./xtend-maraca.md) explains how the same source ships as an app bundle. The handoff matters once the document contains real runtime work: `validation` groups, `transition` blocks, action gates, hydration policies or kernel-scheduled lanes. At that point the Maraca build checks more than syntax; it materializes browser-ready app orchestration.

## Next Step

Open [Syntax Basics](./learn-rmt-syntax-basics.md) and compile the first complete document.

## Public contract

Learn RMT is the public learning path contract for `docs/en/learn-rmt.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT sources, parser behavior, linter diagnostics and playground output.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/learn-rmt.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/learn-rmt.md`
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

- If an example does not compile, check token order, record names and linter output first.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
