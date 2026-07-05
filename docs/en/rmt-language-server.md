# RMT Language Server

Editor integration for completion, hover, definition and code actions.

## What it covers

RMT Language Server describes the public RMT surface for this page: which records are involved, which adapters exercise them and which scheduler signals a host should verify.

## Public building blocks

- `node tools/rmt-language-server/server.js`.
- Completion, hover, definition and Code Actions.
- Snippets for app, component and route structures.
## Editor setup

```bash
node tools/rmt-language-server/server.js
```

The server supports VS Code, JetBrains, Neovim and Helix through stdio. Snippets such as `rmt-app`, `rmt-component`, `rmt-route` and `rmt-template-dom` speed up new files. The relevant schemas are `xtend.rmt.language-server.v1`, `xtend.rmt.editor-packaging.v1` and `xtend.rmt.snippet-catalog.v1`.

VS Code also contributes `XTendRMT: Show vNext Primitive Apply Experience` and `XTendRMT: Run Active RMT Lint`. Problem-matcher workflows use `xt rmt lint app.rmt --format problem-matcher --fail-on warning`; debug configurations are available as a template at `tools/rmt-editor/vscode/templates/launch.json`.

## Orchestration DX

The language server adds completion, hover and document symbols for `validation`, `animation` and `transition`. That works for native `.rmt` files and for JSON/Core-like documents with `validations`, `animations` and `transitions`. Effects such as `fade`, `crossfade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scale`, `pop`, `zoom`, `flip`, `fade-blur`, `shared-element`, `layout-flip` and `none`, plus validation rules such as `required`, `email`, `minLength`, `maxLength` and `pattern`, are explained in the editor.

The complete keyword and operator contexts live in the [RMT Reference](./rmt-reference.md).

New snippets:

- `rmt-vnext-validation`
- `rmt-vnext-animation`
- `rmt-vnext-transition`
- `rmt-vnext-maraca-orchestration-app`

```bash
node scripts/run_xtend_tests.js rmt-completions rmt-navigation rmt-vnext-tooling rmt-editor-packaging --json
```

## Recommended workflow

Start RMT Language Server with the smallest record example, validate it with the linter and only then attach adapters for host data, routing or components.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Linter](./rmt-linter.md)

## Public contract

RMT Language Server is the public RMT runtime contract for `docs/en/rmt-language-server.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT records, compiler output, runtime adapters, events, actions and scheduler lanes.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/rmt-language-server.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `tools/rmt-editor/vscode/templates/launch.json`
- `docs/en/rmt-language-server.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`

Commands:
- `node tools/rmt-language-server/server.js`
- `node scripts/run_xtend_tests.js rmt-completions rmt-navigation rmt-vnext-tooling rmt-editor-packaging --json`
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-reference-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
node tools/rmt-language-server/server.js
node scripts/run_xtend_tests.js rmt-completions rmt-navigation rmt-vnext-tooling rmt-editor-packaging --json
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-reference-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If runtime behavior differs, separate compiler record, host adapter and scheduler signal before changing the docs.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
