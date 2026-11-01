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

### Request limits and compatibility

Every tool call has a fixed aggregate budget of **256 object keys and array entries**, counted recursively across all arguments, including unknown fields, before schema validation or tool execution. This guard applies to both stdio and HTTP. Oversized calls return an MCP tool error; the server remains available. Existing per-field limits still apply, including at most 100 repair IDs, two scopes and six domains. Unknown nested input that was previously discarded by a schema can now be rejected by this budget.

HTTP POST bodies are limited to **4 MiB (4,194,304 UTF-8 bytes)**, including the complete JSON-RPC envelope, whitespace and JSON escaping. Bodies over the limit receive HTTP 413, whether Content-Length is supplied or the body is streamed. Host, Origin and Bearer-token checks run before the SDK reads the body. The byte limit is separate from the inline-source limit of 2,000,000 JavaScript string code units: multibyte text or escaped characters can fit the source schema but exceed the HTTP limit. Use a workspace-relative `path` for large sources, subject to the existing workspace and file safeguards. Stdio has the aggregate tool-input budget but not this HTTP body limit.

The server SDK 2.3.0 upgrade alone does not enable its optional input guard. XTend explicitly configures `maxToolInputElements: 256` and `maxRequestBodySize: 4194304` to address the validation-allocation risk described in [GHSA-46jr-4wx8-v453](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-46jr-4wx8-v453). These bounds do not promise immunity to every memory-exhaustion scenario or change authentication, workspace-write permissions or network exposure.

### Anfragegrenzen und Kompatibilität

Jeder Tool-Aufruf hat ein festes Gesamtbudget von **256 Objektschlüsseln und Array-Einträgen**. Es wird rekursiv über alle Argumente einschließlich unbekannter Felder gezählt, bevor Schema-Validierung oder Tool-Ausführung beginnen. Die Grenze gilt für stdio und HTTP. Zu große Aufrufe liefern einen MCP-Tool-Fehler; der Server bleibt verfügbar. Bestehende Feldgrenzen gelten weiterhin, darunter maximal 100 Repair-IDs, zwei Scopes und sechs Domains. Unbekannte verschachtelte Eingaben, die ein Schema bisher verworfen hat, können nun am Gesamtbudget scheitern.

HTTP-POST-Bodies sind auf **4 MiB (4.194.304 UTF-8-Bytes)** begrenzt, einschließlich des gesamten JSON-RPC-Umschlags, Leerraums und JSON-Escapings. Größere Bodies erhalten HTTP 413, mit Content-Length ebenso wie beim Streaming. Host-, Origin- und Bearer-Token-Prüfungen erfolgen vor dem Lesen des Bodys durch das SDK. Die Byte-Grenze ist unabhängig von der Inline-Quelltextgrenze von 2.000.000 JavaScript-String-Codeeinheiten: Mehrbytezeichen oder escapte Zeichen können das Quelltextschema erfüllen und dennoch die HTTP-Grenze überschreiten. Für große Quellen kann ein Workspace-relativer `path` unter den bestehenden Workspace- und Dateischutzregeln verwendet werden. Für stdio gilt das Gesamtbudget der Tool-Argumente, aber nicht diese HTTP-Body-Grenze.

Das Upgrade auf Server-SDK 2.3.0 allein aktiviert dessen optionale Eingabeschutzfunktion nicht. XTend setzt ausdrücklich `maxToolInputElements: 256` und `maxRequestBodySize: 4194304` gegen das in [GHSA-46jr-4wx8-v453](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-46jr-4wx8-v453) beschriebene Speicherallokationsrisiko bei der Validierung. Diese Grenzen garantieren keinen Schutz gegen jede Form der Speichererschöpfung und ändern weder Authentifizierung noch Workspace-Schreibrechte oder Netzwerkfreigaben.
