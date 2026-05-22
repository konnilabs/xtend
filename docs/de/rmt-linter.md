# RMT Linter und AI-Agent Repair Report

- Status: produktiv vorbereitet ab `WP-E14-14`
- Contract: `xtend.rmt.tooling-docs.v1`
- Linter Report: `xtend.rmt.linter.report.v1`
- Agent Report: `xtend.rmt.ai-agent-repair-report.v1`
- Primaerer Dateityp: `.rmt`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-tooling-docs --json`

## Zweck

Der RMT Linter macht native `.rmt` Dokumente lokal, in CI und fuer AI-Agenten pruefbar. Er nutzt dieselbe Sprachebene wie der RMT Language Server:

- Source Model
- Parser und Format Adapter
- Semantic Graph
- Linter Rules
- Code Actions
- Agent Repair Report

Der Linter fuehrt keine XTend-Komponenten aus, startet keinen XRouter und materialisiert kein DOM. Er analysiert RMT als Sprache.

## Standardbefehl

```bash
xt rmt lint app.rmt
```

Der Langpfad bleibt ebenfalls gueltig:

```bash
xtend rmt lint app.rmt
```

Directory- und einfache Glob-Targets sind moeglich:

```bash
xt rmt lint tests/rmt-language/fixtures
xt rmt lint "tests/rmt-language/fixtures/*.rmt" --json
```

## JSON Report

```bash
xt rmt lint app.rmt --json
```

Der Report ist fuer CI und andere Tools gedacht:

```json
{
  "schema": "xtend.rmt.linter.report.v1",
  "status": "failed",
  "files": 1,
  "diagnostics": []
}
```

## Fail Policy

Standard ist `--fail-on error`. Warnungen brechen den lokalen Lauf dann nicht ab.

```bash
xt rmt lint app.rmt --fail-on warning
xt rmt lint app.rmt --fail-on info
```

Damit kann CI strenger laufen als lokale Authoring-Loops.

## Agent Report

AI-Agenten nutzen den Repair Report:

```bash
xt rmt lint app.rmt --agent
```

`--agent` impliziert JSON und liefert:

- `diagnostics`
- `repairPlan`
- `fixOrder`
- `noOps`
- `confidence`
- `impact`
- `relatedDiagnostics`

Nicht sicher automatisierbare Diagnosen werden bewusst als No-Op erklaert. Beispiele sind Syntax-Recovery, Inline-Script-Entfernung oder Component-Stubs, die Authoring-Kontext brauchen.

## Diagnosecodes

Wichtige Codes:

| Code | Bedeutung |
|------|-----------|
| `rmt.syntax.invalid-json` | Das Dokument ist syntaktisch nicht parsebar |
| `rmt.document.extension.fallback-used` | `.rmt.json` oder `.json` wird nur als Fallback genutzt |
| `rmt.document.kind.missing` | `kind: "rmt_document"` fehlt |
| `rmt.adapter.unknown` | Adapter-Referenz ist nicht definiert |
| `rmt.ref.component.unresolved` | Component-Referenz ist nicht aufloesbar |
| `rmt.ref.template.unresolved` | Template-Referenz ist nicht aufloesbar |
| `rmt.ref.schedule.unresolved` | Schedule-Referenz ist nicht aufloesbar |
| `rmt.ref.route.duplicate-path` | Route Path ist mehrfach definiert |
| `rmt.fabric.lane.unknown` | Fabric/RMT Lane ist nicht bekannt |
| `rmt.template.inline-script.refused` | Inline Script verletzt den Trusted-DOM-/Kernel-Boundary |

## Quick Fixes

Sichere Reparaturen kommen aus `xtend.rmt.code-action-provider.v1`.

Der MVP unterstuetzt:

- fehlende Schedules anlegen
- fehlende Templates als `dom_descriptor` Stub anlegen
- unbekannte Fabric Lanes auf `visible` setzen
- unbekannte Hydration Policies auf `runtime_render` setzen
- fehlende Route `documentTitle` ergaenzen
- fehlende Schedule `endpointName` ergaenzen
- `.rmt.json` per Command nach `.rmt` umbenennen

## Regression Gate

Die Tooling-Matrix liegt in:

```bash
node scripts/run_xtend_tests.js rmt-language-regression --json
```

Dieser Gate prueft valide, defekte, Legacy- und groessere RMT-Dokumente ueber Parser, Linter, CLI, LSP und Agent Report hinweg.

## Editor Workflow

Fuer IDEs siehe [RMT Language Server und Editor Setup](./rmt-language-server.md).

Empfohlener Ablauf:

1. Neues Dokument mit `rmt-app` Snippet erzeugen.
2. In der IDE Diagnostics und Completion nutzen.
3. Lokal mit `xt rmt lint app.rmt` pruefen.
4. Fuer Agenten oder CI `xt rmt lint app.rmt --agent` nutzen.
