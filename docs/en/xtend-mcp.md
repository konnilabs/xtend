# XTend MCP 0.1

XTend MCP exposes the canonical XTend documentation, the curated RMT AI Developer Kit, and deterministic RMT tooling through the Model Context Protocol. The server is an access layer, not a new source of truth.

## Sources of truth

- `docs/de`, `docs/en`, and `docs/menu.json` remain the documentation sources.
- The generated AI Developer Kit remains the curated RMT knowledge source.
- The compiler, linter, repair reporter, and Maraca define executable behavior.
- `@ccslabs/xtend-mcp/knowledge` is the shared retrieval and context implementation for MCP and XTend LLM.

The deterministic knowledge build copies complete Markdown files, including headings and code fences. Every resource retains its locale, slug, source path, and SHA-256. MCP does not use the shortened browser search index as a source.

For RMT authoring conventions and the underlying language boundary, continue with the [RMT vNext authoring guide](rmt-vnext-authoring.md).

## Installation and stdio

XTend MCP requires Node.js 24 or newer.

```bash
npm install --global @ccslabs/xtend-mcp
xtend-mcp stdio --workspace /path/to/project
```

`stdout` is reserved exclusively for MCP frames; connection and error logs go to `stderr`. Unless `--allow-workspace-write` is present, the write-capable repair tool is not registered.

## VS Code

The XTendRMT VSIX bundles the same npm artifact and registers its stdio server automatically. Its settings are:

- `xtend.mcp.enabled`, enabled by default;
- `xtend.mcp.nodePath`, an optional Node.js 24-or-newer path;
- `xtend.mcp.allowWorkspaceWrites`, disabled by default.

For a globally installed binary, `.vscode/mcp.json` can contain:

```json
{
  "servers": {
    "xtend": {
      "type": "stdio",
      "command": "xtend-mcp",
      "args": ["stdio", "--workspace", "${workspaceFolder}"]
    }
  }
}
```

## Resources and prompts

The server publishes paginated DE/EN catalogs at `xtend://docs/catalog/{locale}`, canonical Markdown at `xtend://docs/{locale}/{slug}`, and the AI Kit manifest, references, recipes, and compact representation below `xtend://rmt/kit/...`. Read the returned `nextUri` to fetch the next catalog page.

Six MCP prompts are derived from the six Kit recipes. Their domain content is not duplicated in the server.

## Tools

- `xtend_knowledge_search` and `xtend_knowledge_context` return bounded results or RAG context with provenance.
- `xtend_rmt_diagnostics` and `xtend_rmt_compile_check` inspect RMT sources without build output.
- `xtend_maraca_plan` creates a deterministic plan.
- `xtend_rmt_repair_plan` plans safe, fingerprinted repairs.
- `xtend_rmt_apply_safe_repairs` transactionally applies explicitly selected repairs when the server has write opt-in and the host confirms execution.

Source tools accept exactly one of `source` or a workspace-relative `path`. Absolute paths, traversal, and symlink escapes are rejected. XTend application code is never executed.

## Local Streamable HTTP

```bash
XTEND_MCP_HTTP_TOKEN="a-long-random-token" \
  xtend-mcp http --port 31415 --workspace /path/to/project
```

The server binds exclusively to `127.0.0.1`. `/mcp` requires a process-scoped Bearer token and validates Host and Origin. Without the environment variable, a token is generated securely and printed once to `stderr`. Remote operation and OAuth are outside version 0.1.

## XTend LLM catfooding

`XTEND_LLM_KNOWLEDGE_MODE=direct|mcp|shadow` controls knowledge access. `direct` uses the shared core in-process, `mcp` uses only the bundled stdio server, and `shadow` compares both while returning the direct response. The default changes to `mcp` only after the defined parity and stability gates pass.
