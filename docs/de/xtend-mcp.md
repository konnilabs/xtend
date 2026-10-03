# XTend MCP 0.1

XTend MCP macht die kanonische XTend-Dokumentation, das kuratierte RMT AI Developer Kit und die deterministischen RMT-Werkzeuge über das Model Context Protocol verfügbar. Der Server ist eine Zugriffsschicht, keine neue Wahrheitsquelle.

## Wahrheitsquellen

- `docs/de`, `docs/en` und `docs/menu.json` bleiben die Dokumentationsquellen.
- Das generierte AI Developer Kit bleibt die kuratierte RMT-Wissensquelle.
- Compiler, Linter, Repair-Reporter und Maraca definieren ausführbares Verhalten.
- `@ccslabs/xtend-mcp/knowledge` ist die gemeinsame Retrieval- und Kontextimplementierung für MCP und XTend LLM.

Der deterministische Knowledge-Build übernimmt vollständige Markdown-Dateien einschließlich Überschriften und Codeblöcken. Jede Ressource trägt Locale, Slug, Quellpfad und SHA-256. Der verkürzte Browser-Suchindex wird nicht als MCP-Quelle verwendet.

Für RMT-Authoring-Konventionen und die zugrunde liegende Sprachgrenze folgt der [RMT-vNext-Authoring-Guide](rmt-vnext-authoring.md).

## Installation und stdio

XTend MCP benötigt Node.js 24 oder neuer.

```bash
npm install --global @ccslabs/xtend-mcp
xtend-mcp stdio --workspace /pfad/zum/projekt
```

`stdout` ist ausschließlich für MCP-Frames reserviert; Verbindungs- und Fehlerausgaben gehen nach `stderr`. Ohne `--allow-workspace-write` wird das schreibende Repair-Tool nicht registriert.

## VS Code

Die XTendRMT-VSIX bündelt dasselbe npm-Artefakt und registriert den stdio-Server automatisch. Die Einstellungen sind:

- `xtend.mcp.enabled` – standardmäßig aktiv;
- `xtend.mcp.nodePath` – optionaler Pfad zu Node.js 24 oder neuer;
- `xtend.mcp.allowWorkspaceWrites` – standardmäßig deaktiviert.

Für ein global installiertes Binary kann `.vscode/mcp.json` so aussehen:

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

## Ressourcen und Prompts

Der Server veröffentlicht paginierte DE/EN-Kataloge unter `xtend://docs/catalog/{locale}`, kanonisches Markdown unter `xtend://docs/{locale}/{slug}` sowie Manifest, Referenzen, Rezepte und Kompaktdarstellung des AI Kits unter `xtend://rmt/kit/...`. Weitere Katalogseiten werden über den gelieferten `nextUri` gelesen.

Die sechs MCP-Prompts werden aus den sechs Kit-Rezepten abgeleitet. Ihre fachlichen Inhalte werden nicht im Server dupliziert.

## Tools

- `xtend_knowledge_search` und `xtend_knowledge_context` liefern begrenzte Treffer beziehungsweise RAG-Kontext mit Provenienz.
- `xtend_rmt_diagnostics` und `xtend_rmt_compile_check` prüfen RMT-Quellen ohne Build-Ausgabe.
- `xtend_maraca_plan` erzeugt einen deterministischen Plan.
- `xtend_rmt_repair_plan` plant sichere, gehashte Reparaturen.
- `xtend_rmt_apply_safe_repairs` wendet explizit ausgewählte Reparaturen transaktional an, sofern der Server mit Write-Opt-in gestartet wurde und der Host die Ausführung bestätigt.

Quellwerkzeuge akzeptieren genau `source` oder einen workspace-relativen `path`. Absolute Pfade, Traversal und Symlink-Ausbrüche werden abgewiesen. XTend-Anwendungscode wird nicht ausgeführt.

## Lokales Streamable HTTP

```bash
XTEND_MCP_HTTP_TOKEN="ein-langes-zufaelliges-token" \
  xtend-mcp http --port 31415 --workspace /pfad/zum/projekt
```

Der Server bindet ausschließlich an `127.0.0.1`. `/mcp` verlangt ein pro Prozess gültiges Bearer-Token und prüft Host sowie Origin. Ohne Umgebungsvariable wird ein Token sicher erzeugt und einmalig auf `stderr` ausgegeben. Remote-Betrieb und OAuth gehören nicht zu Version 0.1.

## XTend-LLM-Catfooding

`XTEND_LLM_KNOWLEDGE_MODE=direct|mcp|shadow` steuert den Knowledge-Zugriff. `direct` verwendet den gemeinsamen Kern im Prozess, `mcp` ausschließlich den gebündelten stdio-Server und `shadow` vergleicht beide Wege, verwendet aber die direkte Antwort. Der Wechsel des Standards auf `mcp` erfolgt erst nach den definierten Paritäts- und Stabilitäts-Gates.
