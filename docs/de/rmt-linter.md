# RMT Linter

Diagnostik, JSON-Ausgabe und Agent Repair Reports für RMT Quellen.

## Worum es geht

RMT beschreibt App-Struktur, Interaktion und Laufzeitabsicht. Der Kernel bleibt host-neutral; Adapter verbinden die Records mit XTend UI, XRouter, Fabric und deiner Umgebung.

## Öffentliche Bausteine

- `xt rmt lint app.rmt`.
- `--json` für Tools.
- `--agent` für Repair Reports.
## CLI

```bash
xt rmt lint app.rmt
xt rmt lint app.rmt --json
xt rmt lint app.rmt --agent
xt rmt lint app.rmt --fail-on warning
node scripts/run_xtend_tests.js rmt-language-regression --json
```

Der Agent Report enthält `repairPlan`, `fixOrder`, `relatedDiagnostics`, erklärte `No-Op` Einträge und Diagnostiken wie `rmt.document.extension.fallback-used`. Das öffentliche Schema ist `xtend.rmt.tooling-docs.v1`; Reports können `xtend.rmt.linter.report.v1` und `xtend.rmt.ai-agent-repair-report.v1`.

## Empfohlener Ablauf

Modelliere zuerst Shell, State und Interaktion. Prüfe die Quelle mit dem Linter, binde anschließend Adapter an und halte Host-spezifischen Code außerhalb des Kernels.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Language Server](./rmt-language-server.md)
