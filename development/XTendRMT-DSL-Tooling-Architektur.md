# XTendRMT DSL Tooling Architektur

- Status: Accepted
- Datum: 8. Mai 2026
- Contract: `xtend.rmt.dsl-tooling-architecture.v1`
- Diagnostic Catalog: `xtend.rmt.linter.diagnostic-catalog.v1`
- Workpackage: `WP-E14-01`, `WP-E14-02`, `WP-E14-03`, `WP-E14-04`, `WP-E14-05`, `WP-E14-06`, `WP-E14-07`, `WP-E14-08`, `WP-E14-09`, `WP-E14-10`, `WP-E14-11`, `WP-E14-12`, `WP-E14-13`, `WP-E14-14`, `WP-E14-15`, `WP-E14-16`
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Primaerer Dateityp: `.rmt`
- Fallback-Dateitypen: `.rmt.json` und `.json` nur als Edge-Case-Kompatibilitaet
- Boundary: `no-rmt-kernel-import-of-xtend-types`

## Zweck

Dieses Dokument friert die Architektur fuer den nativen RMT-Linter und den spaeteren RMT Language Server ein. Es definiert die Paketgrenzen, das Diagnosemodell, die ersten Regeln und die Reihenfolge, in der der Sprachkern aufgebaut wird.

Das Tooling macht RMT fuer Menschen, IDEs und AI-Agenten schreibbar. Es fuehrt aber keine XTend-Komponenten aus und erweitert nicht den RMT Kernel.

## Architekturentscheidung

RMT Tooling wird als dreischichtige Architektur aufgebaut:

| Paket | Aufgabe | Oeffentliche Konsumenten |
|-------|---------|--------------------------|
| `tools/rmt-language` | Source Model, Parser Adapter, Semantic Graph, Diagnostics, Completions und Code Actions | Linter, LSP, Tests, spaetere Editor-Packages |
| `tools/rmt-linter` | CLI, Reporter, Exit Codes, JSON/Text-Ausgabe | `xt rmt lint`, CI, AI-Agenten |
| `tools/rmt-language-server` | LSP-Transport, Document Sync, LSP Request/Response Mapping | IDEs, Editor-Plugins, AI-Coding-Tools |

Die fachliche Analyse liegt ausschliesslich in `tools/rmt-language`. Linter und Language Server duerfen diese Schicht nutzen, aber keine eigene zweite Semantik implementieren.

## Kernel Boundary

Die Tooling-Schicht darf:

- `.rmt` Dateien lesen
- JSON-Struktur parsen
- `createRmtFormat().parseDocument(...)` und `normalizeDocument(...)` verwenden
- RMT-Domains, IDs und Referenzen semantisch indexieren
- Manifest-, Catalog-, Type- und Contract-Metadaten lesen
- Diagnosen, Completions und Repair-Hints erzeugen

Die Tooling-Schicht darf nicht:

- XTend-Komponenten ausfuehren
- Custom Elements registrieren
- XRouter importieren oder starten
- DOM materialisieren
- Browser-Seiteneffekte erzeugen
- den RMT Kernel um XTend-spezifische Typen erweitern
- externe CDNs oder Netzwerkpfade fuer lokale Analyse voraussetzen

## Dateityp-Policy

`.rmt` ist der kanonische Authoring-Dateityp.

| Dateityp | Policy | Diagnose |
|----------|--------|----------|
| `.rmt` | empfohlen und default | keine |
| `.rmt.json` | lesbarer Fallback fuer Sonderhosts | `rmt.document.extension.fallback-used` |
| `.json` | generischer Legacy-/Interop-Fallback | `rmt.document.extension.fallback-used` |

Der Linter darf Fallback-Dateien verarbeiten, soll aber in neuen Projekten aktiv auf `.rmt` migrieren helfen.

## Datenfluss

```text
.rmt Text
  -> Source Model
  -> JSON Parser
  -> RMT Format Adapter
  -> Normalized RMT Document
  -> Semantic Graph
  -> Linter Rules
  -> Diagnostics / Completion / Hover / Definition / Code Actions
  -> CLI Reporter oder LSP Response
```

## Source Model

Das Source Model ist die Grundlage fuer alle spaeteren Editor-Funktionen.

Pflichten:

- Datei-URI und Workspace-Root halten
- Text-Snapshot versionieren
- Offset, Line und Character gegenseitig mappen
- JSON Pointer zu Ranges mappen
- Ranges fuer Syntaxfehler und Property-Werte liefern
- Dirty-Dokumente fuer LSP ohne Dateisystemzugriff halten

Nicht-Ziele:

- keine Formatierung
- keine semantische Bewertung
- keine Runtime-Normalisierung

Implementierungsstand nach `WP-E14-02`:

- Modul: `tools/rmt-language/source-model.js`
- Suite: `tests/rmt-language/rmt_source_model_suite.js`
- Contract: `xtend.rmt.source-model.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-source-model --json`
- Status: `completed`

## Parser- und Format-Adapter

Der Parser trennt drei Ebenen:

1. Text ist syntaktisch nicht parsebar
2. Text ist JSON, aber kein gueltiges RMT-Dokument
3. Text ist RMT und kann normalisiert werden

Der Format Adapter ruft bestehende RMT-Funktionen auf:

- `createRmtFormat().parseDocument(sourceText, { sourceUrl })`
- `createRmtFormat().normalizeDocument(document, options)`
- `createRmtFormat().createRuntimeRegistries(document, options)`

Damit bleibt der bestehende RMT-Format-Contract die Wahrheit fuer Normalisierung und Runtime-Registry-Shape.

Implementierungsstand nach `WP-E14-03`:

- Parser: `tools/rmt-language/parser.js`
- Format Adapter: `tools/rmt-language/format-adapter.js`
- Suite: `tests/rmt-language/rmt_parser_suite.js`
- Parser Contract: `xtend.rmt.parser.v1`
- Format Adapter Contract: `xtend.rmt.format-adapter.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-parser --json`
- Status: `completed`

## Semantic Graph

Der Semantic Graph erzeugt ein indexiertes Dokumentmodell.

Pflichtindizes:

- `adapters.byId`
- `components.byId`
- `components.byTag`
- `routes.byId`
- `routes.byPath`
- `schedules.byId`
- `templates.byId`
- `references.bySourcePointer`
- `references.byTargetId`

Pflichtbeziehungen:

- Route -> Component
- Route -> Template
- Route -> Schedule
- Route -> Router Adapter
- Component -> Adapter
- Component -> Schedule
- Component Slot -> Template/Component
- Template Node -> Component/Template/Schedule
- Schedule -> Endpoint Name
- Fabric Lane -> RMT Lane Mapping

Der Graph liefert die Grundlage fuer Diagnosen, Completion, Definition, Rename und Code Actions.

Implementierungsstand nach `WP-E14-04`:

- Modul: `tools/rmt-language/semantic-graph.js`
- Suite: `tests/rmt-language/rmt_semantic_graph_suite.js`
- Contract: `xtend.rmt.semantic-graph.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-semantic-graph --json`
- Status: `completed`
- Source-Prinzip: Raw Document ist die autoritative Pointer- und Range-Quelle; die normalisierte Runtime-Ansicht bleibt als Kontext am Graph haengen.

## Diagnosemodell

Eine Diagnose ist ein stabiler Contract:

```json
{
  "schema": "xtend.rmt.linter.diagnostic.v1",
  "code": "rmt.ref.schedule.unresolved",
  "severity": "error",
  "message": "Schedule \"route.visible.render\" ist nicht definiert.",
  "source": "rmt-linter",
  "file": "app.rmt",
  "range": {
    "start": { "line": 18, "character": 17 },
    "end": { "line": 18, "character": 39 }
  },
  "jsonPointer": "/routes/0/schedule",
  "repair": {
    "kind": "create-schedule",
    "title": "Schedule Record anlegen",
    "safe": true
  }
}
```

Pflichtfelder:

- `schema`
- `code`
- `severity`
- `message`
- `source`
- `file`
- `range` oder `jsonPointer`

Optionale Felder:

- `repair`
- `relatedInformation`
- `docsUrl`
- `confidence`
- `impact`

## Severity Policy

| Severity | Bedeutung | Exit Code Default |
|----------|-----------|-------------------|
| `error` | Dokument ist nicht zuverlaessig ausführbar oder referenziell defekt | failed |
| `warning` | Dokument funktioniert eventuell, verletzt aber Authoring- oder PROD-Policy | passed, ausser `--fail-on warning` |
| `info` | Qualitaets-, SEO- oder Ergonomiehinweis | passed |
| `hint` | optionale Verbesserung ohne Gate-Relevanz | passed |

Implementierungsstand nach `WP-E14-05`:

- Modul: `tools/rmt-language/diagnostics.js`
- Rules: `tools/rmt-language/rules/`
- Suite: `tests/rmt-language/rmt_linter_rules_suite.js`
- Rule Engine Contract: `xtend.rmt.linter.rule-engine.v1`
- Report Contract: `xtend.rmt.linter.report.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-linter-rules --json`
- Status: `completed`
- Report-Prinzip: deterministische JSON-Ausgabe ohne direkte Graph-Interna; Graph-Hints werden ueber `graphStatus`, `manifestHints` und `catalogHints` exponiert.

## Diagnosekatalog v1

| Code | Severity | Kategorie | Repair-Hint |
|------|----------|-----------|-------------|
| `rmt.syntax.invalid-json` | error | Syntax | JSON-Struktur korrigieren |
| `rmt.document.kind.missing` | error | Document | `kind: "rmt_document"` ergaenzen |
| `rmt.document.extension.fallback-used` | warning | File Policy | Datei nach `.rmt` migrieren |
| `rmt.domain.unknown` | error | Schema | unbekannte Top-Level-Domain entfernen oder registrieren |
| `rmt.domain.required.missing` | warning | Schema | fehlende produktive Domain ergaenzen |
| `rmt.id.missing` | error | Identity | stabile ID setzen |
| `rmt.id.duplicate` | error | Identity | ID umbenennen oder Referenzen zusammenfuehren |
| `rmt.adapter.unknown` | error | Adapter | Adapter Record anlegen oder ID korrigieren |
| `rmt.ref.component.unresolved` | error | References | Component Record anlegen oder Ref korrigieren |
| `rmt.ref.template.unresolved` | error | References | Template Record anlegen oder Ref korrigieren |
| `rmt.ref.schedule.unresolved` | error | References | Schedule Record anlegen oder Ref korrigieren |
| `rmt.ref.route.duplicate-path` | warning | Routing | Route Path eindeutig machen |
| `rmt.route.path.invalid` | error | Routing | gueltigen Pfad setzen |
| `rmt.route.document-title.missing` | info | SEO | `documentTitle` oder `titleTemplate` ergaenzen |
| `rmt.template.mode.unsupported` | error | Templates | auf `dom_descriptor`, `html_fragment` oder `text` umstellen |
| `rmt.template.dom-descriptor.invalid-node` | error | Templates | Node-Shape korrigieren |
| `rmt.template.html-fragment.trust-boundary-missing` | warning | Security | Trusted-DOM-Boundary setzen |
| `rmt.template.inline-script.refused` | error | Security | Script aus RMT entfernen |
| `rmt.xtend.kernel-boundary.violation` | error | Boundary | Runtime Import aus Kernel-/RMT-Record entfernen |
| `rmt.fabric.lane.unknown` | warning | Fabric | bekannte Lane nutzen |
| `rmt.fabric.lane.conflict` | warning | Fabric | RMT Schedule und Component Metadata angleichen |
| `rmt.hydration.policy.unknown` | warning | Hydration | bekannte Hydration Policy nutzen |
| `rmt.schedule.endpoint.missing` | warning | Scheduler | `endpointName` ergaenzen |
| `rmt.a11y.route-announcement.missing` | info | A11y | Route Announcement Metadata ergaenzen |
| `rmt.deprecated.field.used` | warning | Migration | Feld auf aktuellen Domain-Contract migrieren |

## Repair-Hint Contract

Repair-Hints sind bewusst klein und sicher.

```json
{
  "kind": "rename-file-extension",
  "title": "Datei nach .rmt umbenennen",
  "safe": true,
  "edits": []
}
```

Pflicht:

- `kind`
- `title`
- `safe`

Erlaubte MVP-Kinds:

- `rename-file-extension`
- `add-document-kind`
- `create-adapter`
- `create-component-stub`
- `create-template-stub`
- `create-schedule`
- `replace-field-value`
- `add-route-title`

Nicht erlaubt im MVP:

- automatische Runtime-Imports
- automatische Component-Implementierungen
- Cross-file Rename ohne Preview
- Formatter-Grossumbauten

## Completion Contract

Completion Items verwenden dasselbe Wissen wie Diagnosen.

Pflichtquellen:

- `xtendrmt/rmt.schema.json`
- `xtendrmt/rmt-core.d.ts`
- `components/manifest.json`
- Component Contract v2 Artefakte
- Design Token Contract
- Fabric/RMT Lane Mapping
- vorhandene IDs im aktiven Dokument

Completion darf nie eine externe Quelle voraussetzen.

Implementierungsstand nach `WP-E14-07`:

- Modul: `tools/rmt-language/completions.js`
- Suite: `tests/rmt-language/rmt_completion_suite.js`
- Provider Contract: `xtend.rmt.completion-provider.v1`
- Report Contract: `xtend.rmt.completion-report.v1`
- Item Contract: `xtend.rmt.completion-item.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-completions --json`
- Status: `completed`
- Quellen: Semantic Graph, Graph Catalog-Hints, lokale `components/manifest.json`, statische Domain-, Lane-, Hydration- und Template-Mode-Kataloge
- Kontext-Prinzip: Pointer, Domain und Field koennen Completion-Kontexte inferieren; LSP kann spaeter dieselbe API direkt nutzen.

## Navigation Provider Contract

Hover, Document Symbols und Definition Provider verwenden dieselbe Sprachebene wie Completion und Linter.

Pflichtquellen:

- Semantic Graph aus `WP-E14-04`
- Source Model Ranges aus `WP-E14-02`
- Completion-Kataloge aus `WP-E14-07`
- lokale `components/manifest.json`

Die Navigation Provider duerfen keine Runtime starten und keine XTend-Komponenten laden. Sie liefern maschinenlesbare Reports, die ein LSP-Server direkt auf `textDocument/hover`, `textDocument/documentSymbol` und `textDocument/definition` mappen kann.

Implementierungsstand nach `WP-E14-08`:

- Hover Modul: `tools/rmt-language/hover.js`
- Document Symbols Modul: `tools/rmt-language/symbols.js`
- Definition Modul: `tools/rmt-language/definitions.js`
- Suite: `tests/rmt-language/rmt_navigation_suite.js`
- Navigation Contract: `xtend.rmt.navigation-provider.v1`
- Hover Contract: `xtend.rmt.hover-provider.v1`
- Document Symbols Contract: `xtend.rmt.document-symbols-provider.v1`
- Definition Contract: `xtend.rmt.definition-provider.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-navigation --json`
- Status: `completed`
- Handoff: `WP-E14-09` kann den LSP Server als duenne stdio-Transport- und Document-Sync-Schicht bauen.

## LSP Contract

Der Language Server ist Transport und Workspace-Schicht. Er enthaelt keine eigene Fachlogik.

MVP-Capabilities:

- diagnostics
- completion
- hover
- document symbols
- go-to-definition
- code actions

Implementierungsstand nach `WP-E14-09`:

- Server Modul: `tools/rmt-language-server/server.js`
- Protocol Modul: `tools/rmt-language-server/protocol.js`
- Suite: `tests/rmt-language/rmt_language_server_suite.js`
- Language Server Contract: `xtend.rmt.language-server.v1`
- Protocol Contract: `xtend.rmt.language-server.protocol.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-language-server --json`
- Status: `completed`
- Transport: stdio JSON-RPC mit `Content-Length` Framing
- Document Sync: Full Sync mit `didOpen`, `didChange`, `didClose`
- Provider Mapping: Diagnostics, Completion, Hover, Document Symbols und Definition werden auf `tools/rmt-language` Provider gemappt
- Code Actions: seit `WP-E14-10` als Quick-Fix-Mapping aktiviert

## Code Action Contract

Code Actions sind sichere Reparaturvorschlaege auf Basis der vorhandenen Linter-Diagnosen.

Pflichten:

- Quick Fixes muessen deterministisch sortiert und dedupliziert sein.
- In-Dokument-Reparaturen werden als Workspace-Edits modelliert.
- Operationen ausserhalb des Dokuments bleiben Commands.
- Der Language Server mappt nur auf LSP CodeAction; die fachliche Fix-Logik liegt in `tools/rmt-language`.

Implementierungsstand nach `WP-E14-10`:

- Modul: `tools/rmt-language/code-actions.js`
- Suite: `tests/rmt-language/rmt_code_actions_suite.js`
- Provider Contract: `xtend.rmt.code-action-provider.v1`
- Report Contract: `xtend.rmt.code-action-report.v1`
- Action Contract: `xtend.rmt.code-action.v1`
- Edit Contract: `xtend.rmt.workspace-edit.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-code-actions --json`
- Status: `completed`
- Reparaturen: fehlende Schedules, fehlende Templates, `.rmt.json` Rename-Command, unbekannte Fabric Lanes, unbekannte Hydration Policies, fehlende Route Titles und fehlende Schedule Endpoints
- LSP: `textDocument/codeAction` aktiviert und auf Quick Fixes gemappt

## AI-Agent Repair Report Contract

Der Agent Repair Report serialisiert Linter-Diagnosen und Code Actions in eine fuer AI-Agenten stabile Reparaturanweisung.

Pflichten:

- keine neue Diagnose- oder Fix-Semantik
- Fix-Reihenfolge deterministisch
- Confidence und Impact pro Schritt
- Related Diagnostics fuer Pointer-Kontext
- No-Op-Erklaerungen fuer bewusst nicht automatisierte Diagnosen
- CLI-Ausgabe ueber `xt rmt lint <target> --agent`

Implementierungsstand nach `WP-E14-11`:

- Contract: `development/XTendRMT-AI-Agent-Lint-Repair-Contract.md`
- Modul: `tools/rmt-linter/reporter.js`
- Suite: `tests/rmt-language/rmt_agent_repair_report_suite.js`
- Report Contract: `xtend.rmt.ai-agent-repair-report.v1`
- File Contract: `xtend.rmt.ai-agent-repair-file.v1`
- Step Contract: `xtend.rmt.ai-agent-repair-step.v1`
- No-Op Contract: `xtend.rmt.ai-agent-noop.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-agent-report --json`
- Status: `completed`
- CLI: `xt rmt lint <target> --agent`

## Editor Packaging und Snippet Contract

Editor Packaging ist eine duenne Anschluss-Schicht. Sie darf Snippets, Syntax-Highlighting, Dateityp-Zuordnung und LSP-Startinformationen liefern, aber keine RMT-Analyse duplizieren.

Pflichten:

- `.rmt` als primaere Authoring-Endung registrieren
- Snippets editor-agnostisch versionieren
- VS-Code-kompatible Snippets aus demselben Katalog ableiten
- LSP-Startbefehl fuer VS Code, JetBrains, Neovim und Helix dokumentieren
- keine Netzwerk- oder Runtime-Pflicht fuer lokales Authoring

Implementierungsstand nach `WP-E14-12`:

- Snippet-Modul: `tools/rmt-language/snippets/index.js`
- VS-Code-Snippets: `tools/rmt-language/snippets/rmt.code-snippets`
- VS-Code-Bridge: `tools/rmt-editor/vscode/extension.js`
- Doku: `docs/rmt-language-server.md`
- Suite: `tests/rmt-language/rmt_editor_packaging_suite.js`
- Packaging Contract: `xtend.rmt.editor-packaging.v1`
- Snippet Catalog: `xtend.rmt.snippet-catalog.v1`
- VS-Code Bridge Contract: `xtend.rmt.editor.vscode-bridge.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-editor-packaging --json`
- Status: `completed`
- Source-of-Truth-Regel: Editor Packages starten oder konsumieren den LSP; sie implementieren keine eigene Diagnose-, Completion- oder Repair-Logik.

## Regression Matrix Contract

Die Regression Matrix haertet den Long Tail der Sprachebene. Sie prueft valide und defekte Dokumente ueber Parser, Linter, CLI, LSP und Agent-Report hinweg.

Pflichten:

- negative Fixtures pruefen konkrete Diagnosecodes
- Fuzz-Mutanten duerfen keine Throws ausloesen
- CLI-Directory-Scan muss dieselbe Matrix deterministisch ausgeben
- LSP-Diagnostics muessen dieselben Codes publizieren
- Agent-Report muss sichere Reparaturen und No-Ops fuer dieselbe Matrix serialisieren

Implementierungsstand nach `WP-E14-13`:

- Fixtures: `tests/rmt-language/fixtures/`
- Suite: `tests/rmt-language/rmt_language_regression_suite.js`
- Regression Contract: `xtend.rmt.language-regression.v1`
- Matrix Contract: `xtend.rmt.language-regression-matrix.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-language-regression --json`
- Status: `completed`
- Abdeckung: valid-native, missing-refs, duplicates, broken-syntax, legacy-fallback, large-native, fuzz-mutants, CLI, LSP und Agent-Report

## Tooling Docs Contract

Die Entwicklerdokumentation verbindet `.rmt` Authoring, Linter, LSP, Snippets, Agent Report und Regression Gates zu einem sichtbaren Standardpfad.

Pflichten:

- Quick Start verweist von HTML-only Einstieg auf RMT-first Ausbau
- Native Authoring Guide dokumentiert Linter, LSP, Snippets und Regression Gate
- Linter Guide dokumentiert `xt rmt lint`, `--json`, `--fail-on` und `--agent`
- Language Server Guide dokumentiert stdio-LSP und Editor-Setups
- Docs-Menue macht Linter und LSP auffindbar

Implementierungsstand nach `WP-E14-14`:

- Linter Guide: `docs/rmt-linter.md`
- Language Server Guide: `docs/rmt-language-server.md`
- Quick Start: `docs/quick-start-guide.md`
- Native Authoring Guide: `docs/xtendrmt-native-authoring.md`
- Suite: `tests/docs/rmt_tooling_docs_suite.js`
- Docs Contract: `xtend.rmt.tooling-docs.v1`
- Report Contract: `xtend.rmt.tooling-docs-report.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-tooling-docs --json`
- Status: `completed`

## Release Gate Contract

Das RMT Tooling besitzt ab `WP-E14-15` eine eigene releasefaehige Gate-Surface. Sie ergaenzt den globalen XTend Release-Gate, ohne die Default-PR-Linie automatisch zu verlaengern.

Pflichten:

- optionaler PR-Gate fuer RMT-nahe Aenderungen
- vollstaendiger Release-Bundle-Gate fuer alle Epic-14-Sprachwerkzeuge
- Package Export Surface fuer RMT Tooling sichtbar halten
- Scaffold Config und Reference Registry aktualisieren
- Self-Gate fuer Package-Scripts, Exports und CI-Handoff bereitstellen

Implementierungsstand nach `WP-E14-15`:

- Gate Contract: `xtend.epic14.rmt-tooling.v1`
- Gate Record Contract: `xtend.epic14.rmt-tooling-gate.record.v1`
- Report Contract: `xtend.epic14.rmt-tooling-report.v1`
- Gate Source: `catalog/epic14-rmt-tooling.js`
- Suite: `tests/platform/epic14_rmt_tooling_release_gates_suite.js`
- Docs: `docs/en/rmt-tooling-release-gates.md`
- Optionaler PR-Gate: `npm run test:pr:rmt`
- Optionaler PR-Report: `npm run test:pr:rmt:report`
- Release-Bundle-Gate: `npm run test:rmt-tooling`
- Release-Bundle-Report: `npm run test:rmt-tooling:report`
- Self-Gate: `node scripts/run_xtend_tests.js epic14-rmt-tooling --json`
- Status: `completed`

## Epic 14 LSP Handoff Contract

Der Abschluss-Handoff akzeptiert RMT Tooling als naechste Produktreifestufe und friert ein, welche LSP-Funktionen produktiv vorbereitet sind und welche Folgearbeiten bewusst ausserhalb des MVP bleiben.

Implementierungsstand nach `WP-E14-16`:

- Handoff Contract: `xtend.epic14.lsp-handoff.v1`
- Report Contract: `xtend.epic14.lsp-handoff-report.v1`
- Handoff Source: `catalog/epic14-lsp-handoff.js`
- Abschlussdokument: `development/XTendRMT-Epic14-Abschluss-und-LSP-Handoff.md`
- Suite: `tests/platform/epic14_lsp_handoff_suite.js`
- Doku: `docs/rmt-language-server.md`
- Gate: `node scripts/run_xtend_tests.js epic14-lsp-handoff --json`
- Package Script: `npm run test:epic14-lsp-handoff`
- Status: `completed`

Implementiert:

- Diagnostics
- Completion
- Hover
- Document Symbols
- Definition
- Code Actions
- Agent Repair Report
- Snippets

Geplant fuer Folge-Epics:

- `workspace/symbol`
- `textDocument/rename`
- `textDocument/references`
- `textDocument/semanticTokens`
- `textDocument/formatting`

Spaetere Capabilities:

- rename
- references
- workspace symbols
- semantic tokens
- formatting

## CLI Contract

Der CLI-Linter bekommt zwei Pfade:

```bash
xtend rmt lint app.rmt
xt rmt lint app.rmt
```

Default:

- Textausgabe fuer Menschen
- Exit Code `1` bei `error`
- Exit Code `0` bei nur `warning`, `info` oder `hint`

Maschinenmodus:

```bash
xt rmt lint app.rmt --json
```

Report Schema:

```json
{
  "schema": "xtend.rmt.linter.report.v1",
  "status": "passed",
  "files": 1,
  "errorCount": 0,
  "warningCount": 0,
  "diagnostics": []
}
```

Implementierungsstand nach `WP-E14-06`:

- Modul: `tools/rmt-linter/cli.js`
- Suite: `tests/rmt-language/rmt_linter_cli_suite.js`
- CLI Contract: `xtend.rmt.linter.cli.v1`
- Report Contract: `xtend.rmt.linter.report.v1`
- Gate: `node scripts/run_xtend_tests.js rmt-linter-cli --json`
- Status: `completed`
- Commands: `xt rmt lint <target>`, `xtend rmt lint <target>`, `xtend-scaffold rmt lint <target>`
- Reporter: Text fuer Menschen, JSON fuer CI und AI-Agenten
- Target Support: Datei, Directory und einfache Globs
- Exit-Code-Prinzip: `0` bei passed, `1` bei blockierenden Diagnosen nach `--fail-on`

## Paketgrenzen fuer WP-E14-02

`WP-E14-02` darf nur den Source-Model-Kern bauen:

- Text Snapshot
- Line/Character Mapping
- JSON Pointer Range Mapping Vorbereitung
- minimale Tests

Es soll noch keinen vollstaendigen Linter, keine CLI und keinen LSP bauen. Diese Trennung verhindert, dass spaetere Editor-Funktionen an einer unklaren Source-Abstraktion haengen.

## Definition of Done fuer diese Architektur

| Kriterium | Status |
|-----------|--------|
| Paketgrenzen sind definiert | accepted |
| Diagnosekatalog v1 ist definiert | accepted |
| `.rmt` ist primaerer Authoring-Dateityp | accepted |
| `.rmt.json` bleibt nur Fallback | accepted |
| RMT Kernel Boundary ist dokumentiert | accepted |
| WP-E14-02 ist startbar | accepted |
