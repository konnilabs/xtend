# RMT Linter

Diagnostics, JSON output and agent repair reports for RMT sources.

## What it covers

The RMT linter reads source, parser diagnostics, and semantic rules, then returns stable machine-readable findings. It does not modify source files or compile an apparently valid app after a severe error.

## Public building blocks

- `tools/rmt-linter/cli.js` is the command-line entry point.
- `tools/rmt-language/diagnostics.js` normalizes codes, fields, and severity.
- `tools/rmt-language/rules/` contains rule-based checks.

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

AnimationEngine diagnostics cover unknown effects, invalid `interrupt` or `reducedMotion` policies, missing `layoutKey` for `shared-element`/`layout-flip`, unsafe keyframe properties and missing filter opt-in for `fade-blur`. Code actions can replace unsafe enum values with safe defaults and add missing motion policy fields when the diagnostic points at a concrete record.

## Recommended workflow

Lint source before compiling. Resolve syntax errors first, then unknown references and policies; apply an automatic fix only when the report identifies the exact text edit.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Language Server](./rmt-language-server.md)
