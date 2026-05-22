# RMT Tooling Release Gates

- Status: productively prepared as of `WP-E14-15`
- Contract: `xtend.epic14.rmt-tooling.v1`
- Gate record contract: `xtend.epic14.rmt-tooling-gate.record.v1`
- Report contract: `xtend.epic14.rmt-tooling-report.v1`
- Local gate: `node scripts/run_xtend_tests.js epic14-rmt-tooling --json`

## Purpose

The RMT Tooling Gates bundle the native `.rmt` authoring path for pull requests, release candidates and AI agents. They do not check the RMT runtime, but the language layer: source model, parser, semantic graph, linter, CLI, completion, navigation, LSP, code actions, agent report, editor packaging, regression fixtures and documentation.

## Commands

```bash
npm run test:rmt-linter
npm run test:rmt-language-server
npm run test:pr:rmt
npm run test:pr:rmt:report
npm run test:rmt-tooling
npm run test:rmt-tooling:report
node scripts/run_xtend_tests.js epic14-rmt-tooling --json
```

`npm run test:pr:rmt` is an optional add-on gate for RMT-close pull requests. The global PR gate stays lean, but can be extended specifically for DSL, linter, LSP or agent-report changes.

`npm run test:rmt-tooling` is the release bundle gate for Epic 14. It runs without network access and uses only repo-local fixtures, docs and tooling modules.

## Release Bundle

The release bundle covers:

- `rmt-source-model`
- `rmt-parser`
- `rmt-semantic-graph`
- `rmt-linter-rules`
- `rmt-linter-cli`
- `rmt-completions`
- `rmt-navigation`
- `rmt-language-server`
- `rmt-code-actions`
- `rmt-agent-report`
- `rmt-editor-packaging`
- `rmt-language-regression`
- `rmt-tooling-docs`

## Package Surface

The package surface for RMT tooling is exported through `package.json`. Especially relevant for tooling consumers are:

- `xtend/rmt-language/source-model`
- `xtend/rmt-language/parser`
- `xtend/rmt-language/diagnostics`
- `xtend/rmt-language/completions`
- `xtend/rmt-language/code-actions`
- `xtend/rmt-language-server`
- `xtend/rmt-linter/cli`
- `xtend/rmt-linter/reporter`
- `xtend/rmt-language/snippets`

The gate `epic14-rmt-tooling` checks that this surface does not drift unnoticed and that `xtend.epic14RmtTooling` contains the active scripts, suites and handoff metadata.

## CI Handoff

The global full release line remains:

```bash
npm run test:release:full:report
```

RMT Tooling is additionally registered as its own release gate in `xtend.releaseGates`:

```bash
npm run test:rmt-tooling
```

This lets release owners, CI systems and AI agents prove the RMT language tools separately without coupling the RMT kernel to XTend runtime types.
