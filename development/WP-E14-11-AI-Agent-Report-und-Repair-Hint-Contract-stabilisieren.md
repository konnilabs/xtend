# WP-E14-11 - AI-Agent-Report und Repair-Hint Contract stabilisieren

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.ai-agent-repair-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-agent-report --json`
- Package Script: `npm run test:rmt-agent-report`
- Zielzustand: `rmt-agent-repair-report-ready`

## Ziel

`WP-E14-11` stabilisiert einen Agentenbericht, der RMT-Linter-Diagnosen und Code Actions in einen umsetzbaren Reparaturplan ueberfuehrt.

Der Bericht ist fuer AI-Agenten, IDEs und CI-Handoffs gedacht und enthaelt:

- Diagnosen
- Fix-Reihenfolge
- Confidence
- Impact
- Related Diagnostics
- No-Op-Erklaerungen

## Umgesetzt

- `development/XTendRMT-AI-Agent-Lint-Repair-Contract.md` angelegt
- `tools/rmt-linter/reporter.js` angelegt
- `createRmtAgentRepairReport(...)` und `createRmtAgentRepairReportForFiles(...)` bereitgestellt
- CLI `xt rmt lint <target> --agent` ergaenzt
- `--agent` impliziert JSON-Ausgabe
- Repair Steps aus `xtend.rmt.code-action-provider.v1` abgeleitet
- No-Op-Erklaerungen fuer nicht sicher reparierbare Diagnosen ergaenzt
- `fixOrder` als flache, agentenfreundliche Reihenfolge eingefuehrt
- `confidence`, `impact` und `relatedDiagnostics` ergaenzt
- `tests/rmt-language/rmt_agent_repair_report_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-agent-report` erweitert

## Architekturentscheidung

Der Agent-Reporter ist keine neue Analyse.

Er nutzt:

- `lintRmtSource(...)` fuer Diagnosen
- `getRmtCodeActions(...)` fuer sichere Reparaturen
- bestehende Workspace-Edits und Commands

Damit bleiben CLI, LSP und Agent-Bericht auf demselben Diagnosekern.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Agent-Report ist stabil versioniert | erfuellt |
| Fix-Reihenfolge ist deterministisch | erfuellt |
| Confidence und Impact sind vorhanden | erfuellt |
| Related Diagnostics sind vorhanden | erfuellt |
| No-Op-Erklaerungen sind vorhanden | erfuellt |
| CLI kann Agent-Report ausgeben | erfuellt |
| keine Runtime-/Netzwerkpflicht | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-agent-report --json
npm run test:rmt-agent-report -- --json
```

## Handoff

`WP-E14-11` ist abgeschlossen. `WP-E14-12` kann Snippets, Editor Packaging und optionale VS-Code-Bridge vorbereiten.

Die Editor-Packages sollen den LSP und den Agent-Report konsumieren, nicht eigene RMT-Regeln implementieren.
