# RMT Linter and AI-Agent Repair Report

- Status: productively prepared since `WP-E14-14`
- Contract: `xtend.rmt.tooling-docs.v1`
- Linter Report: `xtend.rmt.linter.report.v1`
- Agent Report: `xtend.rmt.ai-agent-repair-report.v1`
- Primary file type: `.rmt`
- Local gate: `node scripts/run_xtend_tests.js rmt-tooling-docs --json`

## Purpose

The RMT Linter makes native `.rmt` documents verifiable locally, in CI, and for
AI agents. It uses the same language layer as the RMT Language Server:

- Source Model
- Parser and Format Adapter
- Semantic Graph
- Linter Rules
- Code Actions
- Agent Repair Report

The linter does not execute XTend components, start XRouter, or materialize DOM.
It analyzes RMT as a language.

## Default Command

```bash
xt rmt lint app.rmt
```

The long command path remains valid as well:

```bash
xtend rmt lint app.rmt
```

Directory targets and simple glob targets are supported:

```bash
xt rmt lint tests/rmt-language/fixtures
xt rmt lint "tests/rmt-language/fixtures/*.rmt" --json
```

## JSON Report

```bash
xt rmt lint app.rmt --json
```

The report is intended for CI and other tools:

```json
{
  "schema": "xtend.rmt.linter.report.v1",
  "status": "failed",
  "files": 1,
  "diagnostics": []
}
```

## Fail Policy

The default is `--fail-on error`. Warnings do not break the local run in that
mode.

```bash
xt rmt lint app.rmt --fail-on warning
xt rmt lint app.rmt --fail-on info
```

CI can therefore run stricter checks than local authoring loops.

## Agent Report

AI agents use the repair report:

```bash
xt rmt lint app.rmt --agent
```

`--agent` implies JSON and returns:

- `diagnostics`
- `repairPlan`
- `fixOrder`
- `noOps`
- `confidence`
- `impact`
- `relatedDiagnostics`

Diagnostics that cannot be safely automated are intentionally explained as
no-ops. Examples include syntax recovery, inline-script removal, or component
stubs that need authoring context.

## Diagnostic Codes

Important codes:

| Code | Meaning |
|------|---------|
| `rmt.syntax.invalid-json` | the document cannot be parsed syntactically |
| `rmt.document.extension.fallback-used` | `.rmt.json` or `.json` is used only as a fallback |
| `rmt.document.kind.missing` | `kind: "rmt_document"` is missing |
| `rmt.adapter.unknown` | adapter reference is not defined |
| `rmt.ref.component.unresolved` | component reference cannot be resolved |
| `rmt.ref.template.unresolved` | template reference cannot be resolved |
| `rmt.ref.schedule.unresolved` | schedule reference cannot be resolved |
| `rmt.ref.route.duplicate-path` | route path is defined more than once |
| `rmt.fabric.lane.unknown` | Fabric/RMT lane is unknown |
| `rmt.template.inline-script.refused` | inline script violates the Trusted DOM/kernel boundary |

## Quick Fixes

Safe repairs come from `xtend.rmt.code-action-provider.v1`.

The MVP supports:

- creating missing schedules
- creating missing templates as `dom_descriptor` stubs
- changing unknown Fabric lanes to `visible`
- changing unknown hydration policies to `runtime_render`
- adding missing route `documentTitle`
- adding missing schedule `endpointName`
- renaming `.rmt.json` to `.rmt` via command

## Regression Gate

The tooling matrix lives in:

```bash
node scripts/run_xtend_tests.js rmt-language-regression --json
```

This gate checks valid, broken, legacy, and larger RMT documents across parser,
linter, CLI, LSP, and agent report.

## Editor Workflow

For IDEs, see [RMT Language Server and Editor Setup](./rmt-language-server.md).

Recommended flow:

1. Create a new document with the `rmt-app` snippet.
2. Use diagnostics and completion in the IDE.
3. Check locally with `xt rmt lint app.rmt`.
4. Use `xt rmt lint app.rmt --agent` for agents or CI.
