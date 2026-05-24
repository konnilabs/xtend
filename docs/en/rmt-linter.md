# RMT Linter

Diagnostics, JSON output and agent repair reports for RMT sources.

## What it covers

RMT describes app structure, interaction and runtime intent. The kernel stays host-neutral; adapters connect records to XTend UI, XRouter, Fabric and your environment.

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

Model shell, state and interaction first. Validate the source with the linter, connect adapters afterwards and keep host-specific code outside the kernel.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Language Server](./rmt-language-server.md)
