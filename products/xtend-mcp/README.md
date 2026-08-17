# XTend MCP

**English (primary)** | [Deutsch](#deutsch)

<a id="english"></a>

## English

`@ccslabs/xtend-mcp` is XTend's local Model Context Protocol server for editors, AI hosts, and the XTend LLM product. It exposes the complete bilingual Markdown documentation, the curated RMT AI Developer Kit, and deterministic compiler, linter, repair, and Maraca capabilities without creating another source of truth. Node.js 24 or newer is required; no vector database, cloud service, or external retrieval API is used.

### Installation and startup

```bash
npm install @ccslabs/xtend-mcp
xtend-mcp stdio --workspace /path/to/project
```

The default stdio server is read-only. It reserves stdout for MCP frames and sends logs to stderr. Streamable HTTP binds only to `127.0.0.1`, validates Host and Origin, and requires a process-scoped Bearer token.

```bash
XTEND_MCP_HTTP_TOKEN="replace-with-a-random-secret" xtend-mcp http --port 31415 --workspace /path/to/project
```

### Knowledge and tooling contract

Canonical Markdown is available at `xtend://docs/{locale}/{slug}` and the cursor-based catalog at `xtend://docs/catalog/{locale}`. AI Kit resources live below `xtend://rmt/kit/`; all six prompts are derived from the Kit recipes. Search and context results retain URI, locale, document type, source path, and SHA-256 provenance.

`xtend_knowledge_search` and the context tool use one shared ranking implementation. `xtend_rmt_diagnostics`, compile checks, and Maraca planning call the existing executable truth sources. `xtend_rmt_apply_safe_repairs` is registered only with `--allow-workspace-write`; it requires fresh source and plan hashes, selected stable repair IDs, workspace containment, and normal host confirmation before an atomic write.

### Verification

```bash
npm run build:knowledge --workspace @ccslabs/xtend-mcp
npm run check:knowledge --workspace @ccslabs/xtend-mcp
npm run test:xtend-mcp
npm run test:scoped-package-readmes
```

Generated knowledge files are build artifacts and must not be edited manually. The drift gate regenerates the complete DE/EN documentation and AI Kit data in a temporary directory and verifies hashes and coverage.

### License

Licensed under the Apache License 2.0. See [LICENSE](../../LICENSE).

[Back to top](#xtend-mcp) · [Deutsch](#deutsch)

---

<a id="deutsch"></a>

## Deutsch

[English](#english) | **Deutsch**

`@ccslabs/xtend-mcp` ist XTends lokaler Model-Context-Protocol-Server für Editoren, AI-Hosts und das XTend-LLM-Produkt. Er stellt die vollständige zweisprachige Markdown-Dokumentation, das kuratierte RMT AI Developer Kit sowie deterministische Compiler-, Linter-, Repair- und Maraca-Funktionen bereit, ohne eine weitere Wahrheitsquelle zu schaffen. Node.js 24 oder neuer ist erforderlich; eine Vektordatenbank, ein Cloud-Dienst oder eine externe Retrieval-API werden nicht verwendet.

### Installation und Start

```bash
npm install @ccslabs/xtend-mcp
xtend-mcp stdio --workspace /path/to/project
```

Der stdio-Server ist standardmäßig schreibgeschützt. Er reserviert stdout für MCP-Frames und schreibt Logs nach stderr. Streamable HTTP bindet ausschließlich an `127.0.0.1`, validiert Host und Origin und verlangt ein pro Prozess gültiges Bearer-Token.

```bash
XTEND_MCP_HTTP_TOKEN="replace-with-a-random-secret" xtend-mcp http --port 31415 --workspace /path/to/project
```

### Knowledge- und Tooling-Vertrag

Kanonisches Markdown ist unter `xtend://docs/{locale}/{slug}` und der cursorbasierte Katalog unter `xtend://docs/catalog/{locale}` verfügbar. AI-Kit-Ressourcen liegen unter `xtend://rmt/kit/`; alle sechs Prompts werden aus den Kit-Rezepten abgeleitet. Such- und Kontextergebnisse bewahren URI, Locale, Dokumenttyp, Quellpfad und SHA-256-Provenienz.

`xtend_knowledge_search` und das Kontextwerkzeug nutzen eine einzige gemeinsame Ranking-Implementierung. `xtend_rmt_diagnostics`, Compilerprüfungen und Maraca-Planung rufen die bestehenden ausführbaren Wahrheitsquellen auf. `xtend_rmt_apply_safe_repairs` wird nur mit `--allow-workspace-write` registriert; vor einem atomaren Schreibvorgang verlangt es aktuelle Quell- und Plan-Hashes, ausgewählte stabile Repair-IDs, Workspace-Begrenzung und die normale Host-Bestätigung.

### Verifikation

```bash
npm run build:knowledge --workspace @ccslabs/xtend-mcp
npm run check:knowledge --workspace @ccslabs/xtend-mcp
npm run test:xtend-mcp
npm run test:scoped-package-readmes
```

Generierte Wissensdateien sind Build-Artefakte und dürfen nicht manuell bearbeitet werden. Das Drift-Gate regeneriert die vollständige DE/EN-Dokumentation und die AI-Kit-Daten in einem temporären Verzeichnis und prüft Hashes und Abdeckung.

### Lizenz

Lizenziert unter der Apache License 2.0. Siehe [LICENSE](../../LICENSE).

[Zum Anfang](#xtend-mcp) · [English](#english)
