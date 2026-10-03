# RMT Language Server

Editor integration for completion, hover, definition and code actions.

## What it covers

The RMT language server provides diagnostics, navigation, completion, and code actions from the same source model as the CLI and compiler. Editor feedback is therefore an early view of the same errors, not a separate grammar.

## Public building blocks

- `tools/rmt-language-server/server.js` processes documents and requests.
- `tools/rmt-language-server/protocol.js` defines public message shapes.
- `tools/rmt-language/diagnostics.js` supplies normalized RMT diagnostics.

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

Open an `.rmt` file through the editor integration, resolve parser errors before semantic diagnostics, and confirm critical changes with the CLI gate. Restarting the editor must not produce a different diagnostic set.

## Shared project index

Workspace symbols (`workspace/symbol`), definitions, import navigation and
`textDocument/references` use a shared in-memory index. It includes closed RMT
files in every workspace folder. Open buffers take precedence over disk content;
closing a buffer reloads the file. Clients should send
`workspace/didChangeWatchedFiles` for external changes and
`workspace/didChangeWorkspaceFolders` when roots change. Older document versions
are ignored. Positions use UTF-16, as required by the existing source model.

Symbol identities contain the project, relative file, domain and declared scope.
Inserting lines preserves identity. Moving a file changes identity; impact
reports compare both snapshots so deleted relationships remain visible.

```js
const { createProjectIndex, computeImpact } = require('@ccslabs/xtend-compiler/project-index');
const index = createProjectIndex({ rootDir: '/absolute/project', profile: 'rmt' });
index.build();
const matches = index.searchSymbols('orders');
const references = matches.length ? index.references({ symbolId: matches[0].id }) : [];
const snapshot = index.snapshot();
index.dispose();
```

The same API is exported as `@ccslabs/xtend/project-index`. `updateDocument`
accepts a URI, text and increasing version; `closeDocument`, `refreshDocument`
and `removeDocument` manage subsequent changes. Snapshots contain concrete
document, symbol, reference, relationship and coverage records with provenance.

```bash
xt index build --root /absolute/project --profile rmt --json
xt index symbols orders --root /absolute/project --json
xt index references --symbol '<symbol-id-from-symbols>' --root /absolute/project --json
xt index build --root /absolute/repository --profile repository --out /tmp/base-index.json --json
xt index impact --root /absolute/repository --base /tmp/base-index.json --changed tests/fixtures/input.json --json
```

The `repository` profile adds static JS/TS imports, package exports, curated
schema contracts and suite registrations from `scripts/run_xtend_tests.js`.
TypeScript is optional for RMT navigation; install it in the project to enable
module analysis. The editor profile does not load TypeScript, the schema inventory
or test modules. Neither profile executes project modules or resolves over the
network. The repository report lists browser, Node and type export targets
separately, together with missing targets and computed dependencies.

RMT compilation remains file-local. Import paths navigate to files within the
existing resolver boundaries. A matching declaration in an imported file may
appear as a candidate in the index report; it does not become a confirmed
definition/reference and cannot remove compiler diagnostics. Incomplete input
offers declarations retained by the parser, with an explicit incomplete status.

Impact reports retain explanation paths from the base and current snapshots,
unknown mappings and possible duplicate suite implementations. They never skip,
select or merge gates. A report with no identified suite does not establish that
no tests are required. Rename, formatting, semantic tokens and full JS/TS symbol
analysis remain separate work.

`--cache` explicitly enables `.project-index-cache/snapshot.json`. The cache is
ignored by source scans and invalidated by source, configuration, inventory or
analyzer-version changes. It can be deleted and rebuilt at any time; distributable
packages contain no repository snapshot. For measurements and verification run
`npm run test:project-index`; runtime values are observations, not timing gates.

## Related guides

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Linter](./rmt-linter.md)
