# RMT Linter

Diagnostics, JSON output and agent repair reports for RMT sources.

## What it covers

RMT Linter describes the public RMT surface for this page: which records are involved, which adapters exercise them and which scheduler signals a host should verify.

## Public building blocks

- `xt rmt lint app.rmt`.
- `--json` for tools.
- `--agent` for repair reports.
## CLI

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
xt rmt lint app.rmt --fail-on warning
node scripts/run_xtend_tests.js rmt-language-regression --json
```

The agent report contains `repairPlan`, `fixOrder`, `relatedDiagnostics`, explained `No-Op` entries and diagnostics such as `rmt.document.extension.fallback-used`. The public schema is `xtend.rmt.tooling-docs.v1`; Reports can use `xtend.rmt.linter.report.v1` and `xtend.rmt.ai-agent-repair-report.v1`.

## Recommended workflow

Start RMT Linter with the smallest record example, validate it with the linter and only then attach adapters for host data, routing or components.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Language Server](./rmt-language-server.md)

## Public contract

RMT Linter is the public RMT runtime contract for `docs/en/rmt-linter.md`. The stable signal is not article length; it is whether an external host can verify the named files, names and checks without private project knowledge.

- Role: explains which decision an integrator can make from this page.
- Stable surface: RMT records, compiler output, runtime adapters, events, actions and scheduler lanes.
- Not promised: Private runtime internals, generated DOM structures and internal planning terms stay outside the public contract.

## Interfaces and anchors

These anchors are concrete enough for a third-party developer to verify behavior locally:

Sources:
- `docs/en/rmt-linter.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Names:
- `docs/en/rmt-linter.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `xt rmt lint app.rmt`

Commands:
- `xt rmt lint app.rmt`
- `xt rmt lint app.rmt --json`
- `xt rmt lint app.rmt --agent`
- `xt rmt lint app.rmt --fail-on warning`

## Minimal verification path

Run this check when the article, an example or the named public surface changes:

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
xt rmt lint app.rmt --fail-on warning
```

- Expected signal: The command must finish without link errors, without known boilerplate and with concrete anchors in the article.
- Sources: If source and article disagree, source wins; then update both locales with identical code blocks.

## Specific failure modes

- If runtime behavior differs, separate compiler record, host adapter and scheduler signal before changing the docs.
- If a link from this article breaks, repair the local Markdown target path and then run `node scripts/verify_docs_public_quality.js`.
- If an example is copied, file paths, record names and commands from this section must stay runnable as written.
