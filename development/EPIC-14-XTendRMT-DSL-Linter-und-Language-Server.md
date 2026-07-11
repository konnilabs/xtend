# XTend Epic 14 - RMT DSL Linter und Language Server

- Status: Completed
- Datum: 8. Mai 2026
- Typ: Epic / Implementierungsplan und Tooling-Backlog
- Contract: `xtend.epic14.rmt-dsl-tooling-linter-lsp.v1`
- Zielreife: `rmt-authoring-tooling-ready`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Primaerer Dateityp: `.rmt`
- Fallback-Dateitypen: `.rmt.json` und `.json` nur als Edge-Case-Kompatibilitaet
- Bezug:
  - `development/XTendRMT-DSL-Tooling-Architektur.md`
  - `development/WP-E14-01-RMT-Tooling-Scope-Architektur-und-Diagnosemodell-einfrieren.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-core.esm.js`
  - `xtendrmt/rmt-core.d.ts`
  - `xtendrmt/rmt-manifest.json`
  - `docs/xtendrmt-native-authoring.md`
  - `docs/xtendrmt-app-dsl.md`
  - `docs/rmt-dsl-authoring-polish.md`
  - `development/XTend-RMT-DSL-Authoring-Polish-fuer-Component-Shells.md`
  - `development/XTend-RMT-First-Class-App-Authoring.md`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `tests/fixtures/*.rmt`
  - `scripts/run_xtend_tests.js`

## Zweck

RMT ist nach Epic 13 nicht mehr nur ein Datenformat fuer Scheduler- und Template-Fixtures, sondern der strategische Authoring-Pfad fuer XTendRMT Apps. Damit RMT als Sprache wachsen kann, braucht es ein natives Tooling-Fundament:

- einen RMT-Linter mit stabilen Diagnosecodes, Severity, Repair-Hints und optionalen Fixes
- eine Sprachebene, die `.rmt` Dokumente parst, normalisiert und semantisch indexiert
- einen Language Server nach LSP, der IDEs, AI-Agenten und CLI-Tools mit denselben Fakten versorgt
- Autocomplete, Hover, Go-to-Definition, Symbolsuche, Code Actions und Refactor-Hilfen fuer RMT
- einen maschinenlesbaren Output, der AI-Agenten nicht nur Fehler, sondern konkrete Reparaturpfade gibt

Epic 14 macht RMT damit editor-, agenten- und CI-faehig, ohne den RMT Kernel mit XTend Runtime-Typen zu koppeln.

## Leitentscheidung

Der RMT-Linter und der Language Server werden als eigene Tooling-Schicht gebaut. Sie duerfen RMT-Dokumente lesen, normalisieren, statisch analysieren und auf XTend-Adapter-Contracts referenzieren. Sie duerfen aber keine XTend-Komponenten ausfuehren, kein XRouter-Modul importieren und keine DOM-/Browser-Seiteneffekte erzeugen.

Die Tooling-Schicht wird auf `.rmt` als kanonischem Dateityp aufgebaut. `.rmt.json` bleibt lesbar, darf aber in Docs, Snippets und neuen Fixtures nicht mehr als Normalpfad empfohlen werden.

## Produktziel

Nach Abschluss dieses Epics soll ein Entwickler oder AI-Agent eine neue RMT-first XTend-App in einer IDE schreiben koennen und dabei erhalten:

- Syntax- und Strukturdiagnostik direkt beim Tippen
- Schema- und Contract-basierte Completion fuer Domains, Felder, Adapter, Komponenten, Routes, Schedules und Templates
- semantische Validierung von Referenzen zwischen `components`, `routes`, `schedules`, `templates` und `adapters`
- Quick Fixes fuer fehlende IDs, unbekannte Adapter, nicht aufgeloeste Schedule-Refs und veraltete `.rmt.json` Pfade
- Hover-Dokumentation fuer RMT-Keywords, XTend Adapter Records, Fabric Lanes, Hydration Policies und XRouter-Metadaten
- Go-to-Definition und Rename fuer lokale RMT-IDs
- CLI- und CI-Linting mit JSON-Report fuer Release Gates

## In Scope

- native `.rmt` Source-Model-Schicht
- Parser-/Document-Abstraktion fuer JSON-basierte RMT-Dokumente
- Linter Rule Engine mit Diagnosekatalog
- Integration mit `createRmtFormat().parseDocument(...)` und `normalizeDocument(...)`
- semantischer RMT-Graph fuer IDs, Referenzen und Domains
- CLI-Befehl fuer RMT-Linting, perspektivisch `xt rmt lint` und `xtend rmt lint`
- maschinenlesbare Reports fuer AI-Agenten
- LSP-Server ueber stdio
- Completion, Hover, Document Symbols, Go-to-Definition und Code Actions
- Editor-agnostische Snippets und optionaler VS-Code-Adapter als duenne Packaging-Schicht
- Testfixtures fuer valide, unvollstaendige, legacy und bewusst fehlerhafte `.rmt` Dateien
- Docs fuer RMT Tooling, Linter-Regeln und IDE/AI-Agent-Integration

## Out of Scope

- Einbettung von XTend UI in den RMT Kernel
- Ausfuehrung von XTend-Komponenten im Linter oder Language Server
- Pflichtabhaengigkeit auf VS Code, JetBrains oder einen bestimmten Editor
- Netzwerkpflicht fuer lokale Tests oder Completions
- neuer proprietaerer Editor statt LSP
- vollstaendige neue RMT-Syntax jenseits des bestehenden JSON-basierten `.rmt` Formats
- automatische Migration aller historischen Development-Dokumente
- produktiver Formatter als Muss im MVP; Formatierung wird vorbereitet, aber separat freigegeben

## Architekturziel

```text
tools/
  rmt-language/
    source-model.js
    parser.js
    semantic-graph.js
    diagnostics.js
    rules/
    completions.js
    code-actions.js
  rmt-linter/
    cli.js
    reporter.js
  rmt-language-server/
    server.js
    protocol.js
tests/
  rmt-language/
    fixtures/
    rmt_linter_suite.js
    rmt_language_server_suite.js
docs/
  rmt-linter.md
  rmt-language-server.md
```

Die konkrete Ordnerstruktur kann im ersten Workpackage angepasst werden. Entscheidend ist die Trennung:

- `rmt-language` enthaelt die reine Sprachebene.
- `rmt-linter` nutzt diese Sprachebene fuer CLI und CI.
- `rmt-language-server` adaptiert dieselbe Sprachebene auf LSP.
- Editor-Erweiterungen sind nur Packaging, nicht Source of Truth.

## Tooling-Schichten

| Schicht | Verantwortung | Nicht-Verantwortung |
|---------|----------------|---------------------|
| Source Model | Datei, Text, Offsets, JSON Pointer, Range Mapping | Runtime-Normalisierung |
| Parser | `.rmt` Text in AST/JSON + Syntaxdiagnostik | XTend-Komponenten laden |
| Format Adapter | `createRmtFormat().parseDocument` und Normalisierung anbinden | Kernel erweitern |
| Semantic Graph | IDs, Domains, Referenzen, Adapter, Schedules, Templates indexieren | DOM materialisieren |
| Linter Rules | Diagnosecodes, Severity, Fix-Hints | Editor-Protokoll |
| Completion Engine | Kontextabhaengige Vorschlaege | Editor-spezifische UI |
| Code Actions | Quick Fixes und sichere Edits | unkontrollierte Auto-Refactors |
| LSP Server | LSP-Events, Documents, Diagnostics, Completion, Hover | eigene Analyse-Logik |
| CLI | Lint-Gates, JSON/Text-Reports, Exit-Codes | interaktive IDE-Funktionen |

## Diagnosemodell

Diagnosen werden stabil versioniert:

```json
{
  "schema": "xtend.rmt.linter.diagnostic.v1",
  "code": "rmt.ref.schedule.unresolved",
  "severity": "error",
  "message": "Schedule \"route.visible.render\" ist nicht definiert.",
  "source": "rmt-linter",
  "range": {
    "start": { "line": 18, "character": 17 },
    "end": { "line": 18, "character": 39 }
  },
  "jsonPointer": "/routes/0/schedule",
  "repair": {
    "kind": "create-schedule",
    "title": "Schedule Record anlegen",
    "targetDomain": "schedules"
  }
}
```

Pflichtfelder:

- `schema`
- `code`
- `severity`
- `message`
- `source`
- `range` oder `jsonPointer`
- optional `repair`
- optional `relatedInformation`

## Erste Diagnosecodes

| Code | Severity | Zweck |
|------|----------|-------|
| `rmt.syntax.invalid-json` | error | `.rmt` kann nicht geparst werden |
| `rmt.document.kind.missing` | error | `kind: "rmt_document"` fehlt |
| `rmt.document.extension.fallback-used` | warning | `.rmt.json` oder `.json` wird als Fallback genutzt |
| `rmt.domain.unknown` | error | unbekannte Top-Level-Domain |
| `rmt.adapter.unknown` | error | Adapter-Ref nicht definiert |
| `rmt.ref.component.unresolved` | error | Component-Ref nicht aufloesbar |
| `rmt.ref.template.unresolved` | error | Template-Ref nicht aufloesbar |
| `rmt.ref.schedule.unresolved` | error | Schedule-Ref nicht aufloesbar |
| `rmt.ref.route.duplicate-path` | warning | mehrere Routes mit gleichem Pfad |
| `rmt.template.mode.unsupported` | error | nicht unterstuetzter Template Mode |
| `rmt.template.html-fragment.trust-boundary-missing` | warning | `html_fragment` ohne Trusted-DOM-Boundary |
| `rmt.xtend.kernel-boundary.violation` | error | XTend/XRouter Runtime-Import im RMT-Kernel-Kontext |
| `rmt.fabric.lane.unknown` | warning | unbekannte Lane oder nicht gemappte Fabric-Lane |
| `rmt.hydration.policy.unknown` | warning | unbekannte Hydration Policy |
| `rmt.seo.route-title.missing` | info | Route ohne `title`/`documentTitle` |

## Completion-Modell

Completion soll schrittweise wachsen:

| Kontext | Beispiele |
|---------|-----------|
| Top-Level | `adapters`, `components`, `routes`, `schedules`, `templates`, `manifest` |
| Adapter IDs | `xtend.component`, `xtend.xrouter`, `rmt.state-scheduler-diagnostics`, `xtend.fabric-telemetry` |
| Component Tags | aus `components/manifest.json` und Component Catalog |
| Component Props | aus `.d.ts`, Component Contract v2 und Metadata |
| Route Felder | `path`, `component`, `template`, `schedule`, `documentTitle`, `metaDescription` |
| Schedule Lanes | `critical`, `visible`, `user-blocking`, `background`, `idle`, `diagnostics` |
| Hydration Policies | `runtime_render`, `hydrate_prerendered`, `worker_prerender_hydrate`, `server_prerender_hydrate`, `prerender_only` |
| Template Modes | `dom_descriptor`, `html_fragment`, `text` |
| Design Tokens | produktive `--xtend-*` Tokens |

## CLI-Zielbild

Minimaler MVP:

```bash
xt rmt lint app.rmt
xt rmt lint docs/xtendrmt-parsedown-docs.rmt --json
xt rmt lint tests/fixtures --fail-on warning
```

Kompatibler Langpfad:

```bash
xtend rmt lint app.rmt
```

Report:

```json
{
  "schema": "xtend.rmt.linter.report.v1",
  "status": "failed",
  "files": 3,
  "diagnostics": []
}
```

## LSP-Zielbild

MVP-Funktionen:

- `initialize`
- `textDocument/didOpen`
- `textDocument/didChange`
- `textDocument/didClose`
- `textDocument/publishDiagnostics`
- `textDocument/completion`
- `textDocument/hover`
- `textDocument/documentSymbol`
- `textDocument/definition`
- `textDocument/codeAction`

Spaetere Funktionen:

- `workspace/symbol`
- `textDocument/rename`
- `textDocument/references`
- `textDocument/semanticTokens`
- `textDocument/formatting`
- `workspace/didChangeConfiguration`

## Workpackage-Uebersicht

| ID | Prioritaet | Status | Workstream | Titel | Abhaengigkeiten |
|----|------------|--------|------------|-------|-----------------|
| `WP-E14-01` | P0 | completed | WS0 | RMT Tooling Scope, Architektur und Diagnosemodell einfrieren | - |
| `WP-E14-02` | P0 | completed | WS1 | Native `.rmt` Source Model und Range Mapping bauen | `WP-E14-01` |
| `WP-E14-03` | P0 | completed | WS1 | Parser- und Format-Adapter an `createRmtFormat` anbinden | `WP-E14-02` |
| `WP-E14-04` | P0 | completed | WS2 | Semantic Graph fuer RMT-Domains und Referenzen implementieren | `WP-E14-03` |
| `WP-E14-05` | P0 | completed | WS2 | Linter Rule Engine und Basisregeln erstellen | `WP-E14-04` |
| `WP-E14-06` | P0 | completed | WS3 | CLI `xt rmt lint` und JSON/Text-Reporter integrieren | `WP-E14-05` |
| `WP-E14-07` | P1 | completed | WS4 | Completion Provider fuer Domains, Adapter, Tags, Routes und Schedules bauen | `WP-E14-04` |
| `WP-E14-08` | P1 | completed | WS4 | Hover, Document Symbols und Definition Provider implementieren | `WP-E14-07` |
| `WP-E14-09` | P1 | completed | WS5 | LSP Server MVP ueber stdio bereitstellen | `WP-E14-05`, `WP-E14-07`, `WP-E14-08` |
| `WP-E14-10` | P1 | completed | WS5 | Code Actions und Quick Fixes fuer sichere Reparaturen bauen | `WP-E14-09` |
| `WP-E14-11` | P1 | completed | WS6 | AI-Agent-Report und Repair-Hint Contract stabilisieren | `WP-E14-10` |
| `WP-E14-12` | P2 | completed | WS7 | Snippets, Editor Packaging und optionale VS-Code-Bridge vorbereiten | `WP-E14-09`, `WP-E14-11` |
| `WP-E14-13` | P2 | completed | WS8 | Fixtures, Regression, Fuzzing und negative Testmatrix erweitern | `WP-E14-06`, `WP-E14-09` |
| `WP-E14-14` | P2 | completed | WS9 | Doku, Quick Start und Authoring-Guides aktualisieren | `WP-E14-11` |
| `WP-E14-15` | P2 | completed | WS10 | Release-Gates, Package-Metadaten und CI-Handoff vorbereiten | `WP-E14-13`, `WP-E14-14` |
| `WP-E14-16` | P2 | completed | WS11 | Epic-Abschlussreview und Upstream-Handoff erstellen | `WP-E14-15` |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS0 | Scope, Architektur, Diagnosemodell |
| WS1 | Source Model, Parser und RMT Format Adapter |
| WS2 | Semantic Graph und Linter Rules |
| WS3 | CLI und CI-Reports |
| WS4 | Completion, Hover, Symbols und Definitions |
| WS5 | LSP Server und Code Actions |
| WS6 | AI-Agent Integration und Repair-Hints |
| WS7 | Editor Packaging und Snippets |
| WS8 | Testmatrix, Fixtures und Robustheit |
| WS9 | Doku und Authoring Guides |
| WS10 | Release Gates und CI-Handoff |
| WS11 | Abschlussreview und Upstream-Handoff |

## Workpackages im Detail

### WP-E14-01 - RMT Tooling Scope, Architektur und Diagnosemodell einfrieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - dieses Epic in konkrete Tooling-Contracts ueberfuehren
- Zielartefakte:
  - `development/XTendRMT-DSL-Tooling-Architektur.md`
  - `development/WP-E14-01-RMT-Tooling-Scope-Architektur-und-Diagnosemodell-einfrieren.md`
  - erster Diagnosekatalog `xtend.rmt.linter.diagnostic-catalog.v1`
- Gate:
  - `node scripts/run_xtend_tests.js references --json`
- Definition of Done:
  - Diagnosemodell ist stabil
  - Package-Grenzen sind benannt
  - `.rmt` ist als primaerer Authoring-Dateityp festgelegt
  - `WP-E14-02` ist startbar

## Handoff nach WP-E14-01

`WP-E14-01` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.dsl-tooling-architecture.v1`.

Erledigt:

- `development/XTendRMT-DSL-Tooling-Architektur.md` friert Source Model, Parser Adapter, Semantic Graph, Linter, CLI und LSP als getrennte Tooling-Schichten ein.
- `xtend.rmt.linter.diagnostic-catalog.v1` definiert den ersten Diagnosekatalog fuer Syntax, Document Shape, File Policy, Domains, Identity, References, Routing, Templates, Security, Fabric, Hydration, Scheduler und A11y.
- `.rmt` ist als primaerer Authoring-Dateityp bestaetigt; `.rmt.json` und `.json` bleiben nur Fallback-Dateitypen.
- `development/WP-E14-01-RMT-Tooling-Scope-Architektur-und-Diagnosemodell-einfrieren.md` dokumentiert die Abnahme und den Handoff.
- `WP-E14-02` ist `ready`.

Naechstes primaeres Paket:

- `WP-E14-02` Native `.rmt` Source Model und Range Mapping bauen

### WP-E14-02 - Native `.rmt` Source Model und Range Mapping bauen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - Textpositionen, JSON Pointer und RMT-Dokumentbereiche stabil verbinden
- Scope:
  - Line/Column Mapping
  - Offset Mapping
  - JSON Pointer Mapping
  - Dirty Document Snapshots fuer LSP
- Zielartefakte:
  - `tools/rmt-language/source-model.js`
  - `tests/rmt-language/rmt_source_model_suite.js`
- Gate:
  - `node scripts/run_xtend_tests.js rmt-source-model --json`
- Definition of Done:
  - Diagnosen koennen stabile Ranges auf `.rmt` Dateien zeigen
  - Parserfehler besitzen verwertbare Positionen

## Handoff nach WP-E14-02

`WP-E14-02` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.source-model.v1`.

Erledigt:

- `tools/rmt-language/source-model.js` stellt Datei-URI, Text-Snapshot, Version, Snapshot-ID und Dateityp-Policy bereit.
- LF- und CRLF-Dokumente koennen stabil zwischen Offset und Line/Character gemappt werden.
- JSON Pointer koennen auf Wert-, Key- und Property-Ranges in nativen `.rmt` Dokumenten zeigen.
- Syntaxfehler liefern `rmt.syntax.invalid-json` mit verwertbarer Range statt Throw im Tooling-Pfad.
- Dirty-/In-Memory-Dokumente sind ueber `uri` und `version` ohne Dateisystemzugriff vorbereitet.
- `tests/rmt-language/rmt_source_model_suite.js` prueft echte `.rmt` Fixtures aus Docs, Demo-App und Tests.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-source-model`.

Naechstes primaeres Paket:

- `WP-E14-03` Parser- und Format-Adapter an `createRmtFormat` anbinden

`WP-E14-03` ist `ready`.

### WP-E14-03 - Parser- und Format-Adapter an `createRmtFormat` anbinden

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - bestehende RMT-Normalisierung als Authoring-Wahrheit nutzen
- Scope:
  - `.rmt` Text parsebar machen
  - `createRmtFormat().parseDocument` einbinden
  - Syntaxfehler von Normalisierungsfehlern trennen
  - `.rmt.json` als Fallback-Warnung erkennen
- Zielartefakte:
  - `tools/rmt-language/parser.js`
  - `tools/rmt-language/format-adapter.js`
  - `tests/rmt-language/rmt_parser_suite.js`
- Gate:
  - `node scripts/run_xtend_tests.js rmt-parser --json`
- Definition of Done:
  - valide Fixtures normalisieren
  - defekte Fixtures liefern Diagnose statt Throw im CLI/LSP-Pfad

## Handoff nach WP-E14-03

`WP-E14-03` ist abgeschlossen und akzeptiert die Contracts `xtend.rmt.parser.v1` und `xtend.rmt.format-adapter.v1`.

Erledigt:

- `tools/rmt-language/parser.js` trennt `.rmt` Text, Syntaxdiagnostik, Raw Document und File-Policy-Diagnosen.
- `tools/rmt-language/format-adapter.js` bindet die bestehende RMT-Wahrheit ueber `createRmtFormat().parseDocument(...)` ein.
- Syntaxfehler bleiben in der Phase `syntax`; Adapter- und Normalisierungsfehler bleiben in der Phase `format`.
- `.rmt.json` und `.json` bleiben parsebar, erzeugen aber `rmt.document.extension.fallback-used`.
- Defekte Quellen liefern Diagnoseergebnisse statt Throws im Tooling-Pfad.
- `tests/rmt-language/rmt_parser_suite.js` prueft valide Fixtures, Fallback-Warnungen, Syntaxfehler, Adapter-Ausfall und Normalisierungsfehler.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-parser`.

Naechstes primaeres Paket:

- `WP-E14-04` Semantic Graph fuer RMT-Domains und Referenzen implementieren

`WP-E14-04` ist `ready`.

### WP-E14-04 - Semantic Graph fuer RMT-Domains und Referenzen implementieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - alle RMT-IDs, Referenzen und Domain-Beziehungen indexieren
- Scope:
  - `adapters`
  - `components`
  - `routes`
  - `schedules`
  - `templates`
  - Manifest- und XTend-Component-Catalog-Hints
- Zielartefakte:
  - `tools/rmt-language/semantic-graph.js`
  - `tests/rmt-language/rmt_semantic_graph_suite.js`
- Gate:
  - `node scripts/run_xtend_tests.js rmt-semantic-graph --json`
- Definition of Done:
  - unresolved, duplicate und cross-domain References sind erkennbar
  - Graph kann Completion und Definition Provider bedienen

## Handoff nach WP-E14-04

`WP-E14-04` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.semantic-graph.v1`.

Erledigt:

- `tools/rmt-language/semantic-graph.js` indexiert `adapters`, `components`, `routes`, `schedules` und `templates`.
- Pflichtindizes wie `components.byTag`, `routes.byPath`, `schedules.byEndpointName`, `references.bySourcePointer` und `references.byTargetId` sind verfuegbar.
- Cross-Domain-Referenzen fuer Routes, Components, Slots, Template Nodes, Hydration Endpoint Hints und Fabric Lane Mapping werden gesammelt.
- Unresolved References, Duplicate IDs, Duplicate Route Paths und Fabric/RMT Lane-Konflikte erzeugen stabile Diagnosen.
- Completion- und Definition-Grundlagen sind ueber `listCompletions`, `getDefinition` und `getDefinitionForReference` vorhanden.
- `tests/rmt-language/rmt_semantic_graph_suite.js` prueft valide Graphen, Missing-Refs, Duplicates, Fabric-Konflikte und Syntax-Fallbacks.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-semantic-graph`.

Naechstes primaeres Paket:

- `WP-E14-05` Linter Rule Engine und Basisregeln erstellen

`WP-E14-05` ist `ready`.

### WP-E14-05 - Linter Rule Engine und Basisregeln erstellen

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - stabile, testbare Linter-Regeln fuer RMT bereitstellen
- Scope:
  - Rule Registry
  - Severity Policy
  - Diagnosecodes
  - Repair-Hints
  - Native `.rmt` Policy
- Zielartefakte:
  - `tools/rmt-language/diagnostics.js`
  - `tools/rmt-language/rules/*.js`
  - `tests/rmt-language/rmt_linter_rules_suite.js`
- Definition of Done:
  - Basisdiagnosen aus diesem Plan sind implementiert
  - JSON-Report ist deterministisch

## Handoff nach WP-E14-05

`WP-E14-05` ist abgeschlossen und akzeptiert die Contracts `xtend.rmt.linter.rule-engine.v1` und `xtend.rmt.linter.report.v1`.

Erledigt:

- `tools/rmt-language/diagnostics.js` stellt `createRmtLinter(...)` und `lintRmtSource(...)` bereit.
- `tools/rmt-language/rules/` enthaelt die Basisregeln fuer Document, Route, Template, Scheduler und Boundary Policies.
- Graph-Diagnosen aus `WP-E14-04` werden normalisiert, mit Severity Policy und Repair-Hints angereichert und deterministisch sortiert.
- Native `.rmt` Policy und `.rmt.json` Fallback-Warnungen werden in denselben Linter-Report uebernommen.
- Der Report enthaelt `graphStatus`, `manifestHints`, `catalogHints`, Diagnosezaehler und keine nichtdeterministischen Graph-Interna.
- `tests/rmt-language/rmt_linter_rules_suite.js` prueft Rule Registry, Severity Overrides, Repair-Hints, Fallback-Policy, Basisdiagnosen und deterministische JSON-Ausgabe.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-linter-rules`.

Naechstes primaeres Paket:

- `WP-E14-06` CLI `xt rmt lint` und JSON/Text-Reporter integrieren

`WP-E14-06` ist `ready`.

### WP-E14-06 - CLI `xt rmt lint` und JSON/Text-Reporter integrieren

- Prioritaet: `P0`
- Status: `completed`
- Ziel:
  - RMT-Linting lokal und in CI ausfuehrbar machen
- Scope:
  - CLI-Integration in `xtend-builder/lib/cli.js`
  - Alias `xt rmt lint`
  - Exit Codes
  - JSON/Text Reporter
  - Glob-/Directory-Support
- Zielartefakte:
  - `tools/rmt-linter/cli.js`
  - aktualisierte CLI
  - `tests/rmt-language/rmt_linter_cli_suite.js`
- Definition of Done:
  - `xt rmt lint tests/fixtures` ist lokal ausfuehrbar
  - CI kann `--json` Report konsumieren

## Handoff nach WP-E14-06

`WP-E14-06` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.linter.cli.v1`.

Erledigt:

- `tools/rmt-linter/cli.js` stellt `runRmtLinterCli(...)`, Text-Reporter, JSON-Reporter, Target-Collection und Exit-Code-Policy bereit.
- `xtend-builder/lib/cli.js` integriert `xt rmt lint` und `xtend rmt lint` ueber die bestehende Bin-Surface.
- Datei-, Directory- und einfacher Glob-Support sind vorhanden.
- `.rmt` und `.rmt.json` werden bei Directory-/Glob-Targets erkannt; explizite `.json` Targets bleiben als Edge-Case-Fallback lintbar.
- `--json`, `--fail-on` und `--root` sind implementiert.
- `tests/rmt-language/rmt_linter_cli_suite.js` prueft direkte CLI, Builder-CLI-Integration, Reporter, Exit Codes, Directory-/Glob-Support und Package-Metadaten.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-linter-cli`.

Naechstes primaeres Paket:

- `WP-E14-07` Completion Provider fuer Domains, Adapter, Tags, Routes und Schedules bauen

`WP-E14-07` ist `ready`.

### WP-E14-07 - Completion Provider fuer Domains, Adapter, Tags, Routes und Schedules bauen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - kontextabhaengige Vorschlaege fuer RMT-Dokumente bereitstellen
- Scope:
  - Top-Level Domains
  - Domainfelder
  - Adapter IDs
  - XTend Component Tags
  - Route-, Schedule- und Template-IDs
  - Lanes, Hydration Policies, Template Modes
- Zielartefakte:
  - `tools/rmt-language/completions.js`
  - `tests/rmt-language/rmt_completion_suite.js`
- Definition of Done:
  - Completion nutzt Semantic Graph und Catalog Contracts
  - keine Runtime-Ausfuehrung notwendig

## Handoff nach WP-E14-07

`WP-E14-07` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.completion-provider.v1`.

Erledigt:

- `tools/rmt-language/completions.js` stellt `createRmtCompletionProvider(...)` und `getRmtCompletions(...)` bereit.
- Completion Items nutzen den stabilen Contract `xtend.rmt.completion-item.v1`.
- Kontext-Inferenz ueber Pointer, Domain und Field ist vorhanden.
- Top-Level-Domains, Domainfelder, Adapter IDs, XTend Component Tags, Route-/Component-/Template-/Schedule-Referenzen, Route Paths, Schedule Endpoints, Schedule Lanes, Hydration Policies und Template Modes werden vorgeschlagen.
- Component Tag Completion nutzt lokal `components/manifest.json` und Graph Catalog-Hints.
- Referenz-Completions nutzen den Semantic Graph aus `WP-E14-04`.
- Syntax-defekte Quellen koennen weiterhin statische Top-Level-Completions liefern.
- `tests/rmt-language/rmt_completion_suite.js` prueft statische Kataloge, dynamische Graph-Referenzen, Prefix-Filterung, Pointer-Inferenz und deterministische Ausgabe.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-completions`.

Naechstes primaeres Paket:

- `WP-E14-08` Hover, Document Symbols und Definition Provider implementieren

`WP-E14-08` ist `ready`.

### WP-E14-08 - Hover, Document Symbols und Definition Provider implementieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - RMT-Dokumente navigierbar und erklaerbar machen
- Scope:
  - Hover fuer Keywords, Adapter, Lanes, Hydration und Component Tags
  - Document Symbols fuer Domains und IDs
  - Go-to-Definition fuer lokale Referenzen
- Zielartefakte:
  - `tools/rmt-language/hover.js`
  - `tools/rmt-language/symbols.js`
  - `tools/rmt-language/definitions.js`
- Definition of Done:
  - Routen, Komponenten, Templates und Schedules sind im Dokument navigierbar

## Handoff nach WP-E14-08

`WP-E14-08` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.navigation-provider.v1`.

Erledigt:

- `tools/rmt-language/hover.js` stellt `createRmtHoverProvider(...)` und `getRmtHover(...)` bereit.
- `tools/rmt-language/symbols.js` stellt `createRmtDocumentSymbolsProvider(...)` und `getRmtDocumentSymbols(...)` bereit.
- `tools/rmt-language/definitions.js` stellt `createRmtDefinitionProvider(...)` und `getRmtDefinition(...)` bereit.
- Hover nutzt lokale Kataloge fuer Domains, Adapter, Lanes, Hydration Policies, Template Modes und XTend Component Tags.
- Document Symbols bilden `adapters`, `components`, `routes`, `schedules` und `templates` als Domain-Symbole mit ID-Kindern ab.
- Go-to-Definition loest lokale Referenzen ueber den Semantic Graph auf und liefert Pointer plus Range fuer Definition Targets.
- Syntax-defekte Quellen liefern kontrolliert `source_unavailable` statt Throws.
- `tests/rmt-language/rmt_navigation_suite.js` prueft Hover, Document Symbols, Definitionen, Package-Metadaten und Runner-Integration.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-navigation`.

Naechstes primaeres Paket:

- `WP-E14-09` LSP Server MVP ueber stdio bereitstellen

`WP-E14-09` ist `ready`.

### WP-E14-09 - LSP Server MVP ueber stdio bereitstellen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - editor-agnostischen Language Server bereitstellen
- Scope:
  - LSP Initialize
  - Document Sync
  - Diagnostics
  - Completion
  - Hover
  - Document Symbols
  - Definition
- Zielartefakte:
  - `tools/rmt-language-server/server.js`
  - `tests/rmt-language/rmt_language_server_suite.js`
- Definition of Done:
  - Server funktioniert ueber stdio
  - Tests koennen LSP Requests ohne echten Editor ausfuehren

## Handoff nach WP-E14-09

`WP-E14-09` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.language-server.v1`.

Erledigt:

- `tools/rmt-language-server/protocol.js` implementiert LSP/JSON-RPC Framing mit `Content-Length`.
- `tools/rmt-language-server/server.js` stellt `createRmtLanguageServer(...)` und `runStdioServer(...)` bereit.
- `initialize` liefert Capabilities fuer Document Sync, Diagnostics, Completion, Hover, Document Symbols und Definition.
- `textDocument/didOpen`, `textDocument/didChange` und `textDocument/didClose` verwalten Dirty Documents und publizieren Diagnostics.
- `textDocument/completion`, `textDocument/hover`, `textDocument/documentSymbol` und `textDocument/definition` mappen auf die Provider aus `WP-E14-07` und `WP-E14-08`.
- Position-zu-JSON-Pointer Mapping nutzt Source Model Ranges und fuehrt keine eigene RMT-Semantik ein.
- Code Actions wurden in `WP-E14-10` als Quick-Fix-Mapping aktiviert.
- `tests/rmt-language/rmt_language_server_suite.js` prueft Initialize, Document Sync, Diagnostics, Provider-Mapping und stdio-Protokoll-Harness.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-language-server`.

Naechstes primaeres Paket:

- `WP-E14-10` Code Actions und Quick Fixes fuer sichere Reparaturen bauen

`WP-E14-10` ist `ready`.

### WP-E14-10 - Code Actions und Quick Fixes fuer sichere Reparaturen bauen

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - haeufige RMT-Fehler direkt reparierbar machen
- Scope:
  - fehlende Schedule anlegen
  - fehlende Template-Stubs anlegen
  - `.rmt.json` zu `.rmt` Hinweis/Fix
  - unbekannte Lane auf bekannte Lane korrigieren
  - fehlende Route Titles ergaenzen
- Zielartefakte:
  - `tools/rmt-language/code-actions.js`
  - `tests/rmt-language/rmt_code_actions_suite.js`
- Definition of Done:
  - Quick Fixes sind deterministisch und minimal-invasiv

## Handoff nach WP-E14-10

`WP-E14-10` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.code-action-provider.v1`.

Erledigt:

- `tools/rmt-language/code-actions.js` stellt `createRmtCodeActionProvider(...)` und `getRmtCodeActions(...)` bereit.
- Quick Fixes fuer fehlende Schedules, fehlende Templates, `.rmt.json` Fallback-Dateien, unbekannte Fabric Lanes, unbekannte Hydration Policies, fehlende Route Titles und fehlende Schedule Endpoints sind vorhanden.
- In-Dokument-Reparaturen werden als minimale Workspace-Edits ausgegeben.
- Dateiumbenennungen bleiben ein expliziter Command `xtend.rmt.renameFileExtension`.
- Der RMT Language Server aktiviert `textDocument/codeAction` und mappt Code Actions auf LSP Quick Fixes.
- LSP-Diagnostic-Kontext kann Code Actions filtern.
- `tests/rmt-language/rmt_code_actions_suite.js` prueft Fix-Erzeugung, Edit-Anwendbarkeit, Fallback-Commands, LSP-Mapping und Package-Metadaten.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-code-actions`.

Naechstes primaeres Paket:

- `WP-E14-11` AI-Agent-Report und Repair-Hint Contract stabilisieren

`WP-E14-11` ist `ready`.

### WP-E14-11 - AI-Agent-Report und Repair-Hint Contract stabilisieren

- Prioritaet: `P1`
- Status: `completed`
- Ziel:
  - AI-Agenten koennen RMT-Probleme maschinenlesbar verstehen und reparieren
- Scope:
  - Agent-optimierter JSON-Report
  - Fix-Reihenfolge
  - Confidence/Impact
  - Related Diagnostics
  - No-Op-Erklaerung bei nicht sicher fixbaren Fehlern
- Zielartefakte:
  - `development/XTendRMT-AI-Agent-Lint-Repair-Contract.md`
  - `tools/rmt-linter/reporter.js`
- Definition of Done:
  - Report ist fuer Agenten stabil versioniert
  - LSP und CLI nutzen denselben Diagnosekern

## Handoff nach WP-E14-11

`WP-E14-11` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.ai-agent-repair-report.v1`.

Erledigt:

- `development/XTendRMT-AI-Agent-Lint-Repair-Contract.md` dokumentiert Report Shape, Repair Steps, No-Ops, Fix-Reihenfolge, Confidence und Impact.
- `tools/rmt-linter/reporter.js` stellt `createRmtAgentRepairReport(...)` und `createRmtAgentRepairReportForFiles(...)` bereit.
- Der Agent-Report nutzt `lintRmtSource(...)` und `getRmtCodeActions(...)` statt eigener RMT-Regeln.
- `xt rmt lint <target> --agent` erzeugt den Agent Repair Report und respektiert `--fail-on`.
- `fixOrder`, `repairPlan`, `noOps`, `relatedDiagnostics`, `confidence` und `impact` sind enthalten.
- Nicht sicher reparierbare Diagnosen erhalten No-Op-Erklaerungen.
- `tests/rmt-language/rmt_agent_repair_report_suite.js` prueft Report Shape, CLI-Agent-Modus, Deduplizierung, No-Op-Gruende und Package-Metadaten.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-agent-report`.

Naechstes primaeres Paket:

- `WP-E14-12` Snippets, Editor Packaging und optionale VS-Code-Bridge vorbereiten

`WP-E14-12` ist `ready`.

### WP-E14-12 - Snippets, Editor Packaging und optionale VS-Code-Bridge vorbereiten

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - RMT Tooling in realen IDEs leicht anschliessbar machen
- Scope:
  - editor-agnostische Snippets
  - optionaler VS-Code Extension Stub
  - README fuer JetBrains/Neovim/Helix ueber LSP
- Zielartefakte:
  - `tools/rmt-language/snippets/`
  - `docs/rmt-language-server.md`
- Definition of Done:
  - LSP bleibt die einzige fachliche Source of Truth

## Handoff nach WP-E14-12

`WP-E14-12` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.editor-packaging.v1`.

Erledigt:

- `tools/rmt-language/snippets/index.js` stellt den editor-agnostischen Snippet-Katalog und Packaging-Manifest bereit.
- `tools/rmt-language/snippets/rmt.code-snippets` exportiert die RMT-Snippets fuer VS Code.
- `tools/rmt-editor/vscode/` enthaelt einen duennen Bridge-Stub fuer Language ID, Grammar, Snippets und LSP-Startinformationen.
- `docs/rmt-language-server.md` dokumentiert VS Code, JetBrains, Neovim und Helix Setup ueber den RMT Language Server.
- `tests/rmt-language/rmt_editor_packaging_suite.js` prueft Snippets, VS-Code-Bridge, Doku, Package-Metadaten und Source-of-Truth-Boundary.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-editor-packaging`.

Naechstes primaeres Paket:

- `WP-E14-13` Fixtures, Regression, Fuzzing und negative Testmatrix erweitern

`WP-E14-13` ist `ready`.

### WP-E14-13 - Fixtures, Regression, Fuzzing und negative Testmatrix erweitern

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Tooling robust gegen reale und fehlerhafte RMT-Dateien machen
- Scope:
  - valide Fixtures
  - defekte Syntax
  - fehlende Referenzen
  - Duplikate
  - Legacy Fallback-Dateien
  - grosse Dokumente
- Zielartefakte:
  - `tests/rmt-language/fixtures/*.rmt`
  - `tests/rmt-language/rmt_language_regression_suite.js`
- Definition of Done:
  - negative Tests pruefen Diagnosecodes statt nur Failure

## Handoff nach WP-E14-13

`WP-E14-13` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.language-regression.v1`.

Erledigt:

- `tests/rmt-language/fixtures/` enthaelt valide, Missing-Refs-, Duplicate-, Syntaxfehler-, Legacy-Fallback- und Large-Dokument-Fixtures.
- `tests/rmt-language/rmt_language_regression_suite.js` prueft Parser, Linter, CLI, LSP und Agent-Report gegen dieselbe Matrix.
- Fuzz-Mutanten pruefen fehlendes `kind`, unbekannte Top-Level-Domain, invaliden Route Path, unbekannten Template Mode und unbekannte Fabric Lane.
- Negative Tests erwarten konkrete Diagnosecodes statt pauschaler Failure-Signale.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-language-regression`.

Naechstes primaeres Paket:

- `WP-E14-14` Doku, Quick Start und Authoring-Guides aktualisieren

`WP-E14-14` ist `ready`.

### WP-E14-14 - Doku, Quick Start und Authoring-Guides aktualisieren

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - RMT Tooling fuer Entwickler sichtbar machen
- Scope:
  - RMT Linter Guide
  - RMT Language Server Guide
  - Native Authoring Guide erweitern
  - Quick Start Guide um Linting ergaenzen
- Zielartefakte:
  - `docs/rmt-linter.md`
  - `docs/rmt-language-server.md`
  - aktualisierte `docs/quick-start-guide.md`
  - aktualisierte `docs/menu.json`
- Definition of Done:
  - neue Entwickler sehen `.rmt` + Linting + LSP als Standardpfad

## Handoff nach WP-E14-14

`WP-E14-14` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.tooling-docs.v1`.

Erledigt:

- `docs/rmt-linter.md` dokumentiert Linter, JSON-Report, Fail Policy, Agent Report, Diagnosecodes, Quick Fixes und Regression Gate.
- `docs/rmt-language-server.md` dokumentiert LSP, Snippets, VS Code, JetBrains, Neovim und Helix Setup.
- `docs/quick-start-guide.md` zeigt `.rmt`, `xt rmt lint`, `--json`, `--agent` und den LSP-Start als Ausbaupfad.
- `docs/xtendrmt-native-authoring.md` beschreibt Authoring Tooling, Snippet-Prefixes und Regression Gate.
- `docs/en/README.md` und `docs/menu.json` verlinken Linter und Language Server.
- `tests/docs/rmt_tooling_docs_suite.js` prueft Doku, Menue, Package-Metadaten, Runner und Epic-Handoff.
- `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-tooling-docs`.

Naechstes primaeres Paket:

- `WP-E14-15` Release-Gates, Package-Metadaten und CI-Handoff vorbereiten

`WP-E14-15` ist abgeschlossen.

### WP-E14-15 - Release-Gates, Package-Metadaten und CI-Handoff vorbereiten

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Tooling in lokale und spaetere CI-Gates integrieren
- Scope:
  - `package.json` Scripts
  - `scripts/run_xtend_tests.js`
  - Scaffold Config
  - Reference Registry
  - Package Export Surface
- Zielartefakte:
  - `test:rmt-linter`
  - `test:rmt-language-server`
  - `xtend.epic14.rmt-tooling`
- Definition of Done:
  - PR-Gate kann RMT-Linter optional aufnehmen
  - Release-Gate kann RMT Tooling pruefen

## Handoff nach WP-E14-15

`WP-E14-15` ist abgeschlossen und akzeptiert den Contract `xtend.epic14.rmt-tooling.v1`.

Erledigt:

- `catalog/epic14-rmt-tooling.js` definiert die maschinenlesbare Gate-Surface fuer optionale PR-Laeufe, Release-Bundle und Package-Surface-Self-Gate.
- `tests/platform/epic14_rmt_tooling_release_gates_suite.js` prueft Package-Scripts, Exports, Scaffold Config, Reference Registry, Docs, Epic-Status und CI-Handoff.
- `package.json` bietet `test:rmt-linter`, `test:rmt-tooling`, `test:rmt-tooling:report`, `test:pr:rmt`, `test:pr:rmt:report` und `test:epic14-rmt-tooling`.
- `xtend.epic14RmtTooling` und `xtend.releaseGates` machen RMT Tooling als releasefaehige Oberflaeche sichtbar.
- `xtend-builder/scaffold.config.js` kennt `epic14RmtTooling` als Scaffold-/CI-Handoff-Metadatum.
- `docs/en/rmt-tooling-release-gates.md` dokumentiert PR-, Release- und Self-Gates.
- `WP-E14-16` ist abgeschlossen.

Naechstes primaeres Paket:

- `WP-E14-16` Epic-Abschlussreview und Upstream-Handoff erstellen

### WP-E14-16 - Epic-Abschlussreview und Upstream-Handoff erstellen

- Prioritaet: `P2`
- Status: `completed`
- Ziel:
  - Epic 14 abschliessen und upstream-freundlich dokumentieren
- Scope:
  - Handoff an XTendRMT DSL-Ausbau
  - offene Syntax-/Formatter-Entscheidungen
  - LSP Capability Matrix
  - Known Limitations
- Zielartefakte:
  - `development/XTendRMT-Epic14-Abschluss-und-LSP-Handoff.md`
  - `docs/rmt-language-server.md`
- Definition of Done:
  - RMT Tooling ist als naechste Produktreifestufe akzeptiert
  - Folge-Epic fuer Formatter/DSL-Syntax kann sauber geplant werden

## Handoff nach WP-E14-16

`WP-E14-16` ist abgeschlossen und akzeptiert den Contract `xtend.epic14.lsp-handoff.v1`.

Erledigt:

- `development/XTendRMT-Epic14-Abschluss-und-LSP-Handoff.md` dokumentiert Abschlussbewertung, LSP Capability Matrix, Known Limitations, akzeptierte Contracts und Folge-Epic-Kandidaten.
- `catalog/epic14-lsp-handoff.js` macht den Abschluss maschinenlesbar.
- `tests/platform/epic14_lsp_handoff_suite.js` prueft Handoff, Package-Metadaten, Runner, Scaffold Config, Architektur, Referenzregistry und Language-Server-Doku.
- `docs/rmt-language-server.md` enthaelt nun Capability Matrix, Known Limitations und Handoff-Link.
- `package.json` bietet `test:epic14-lsp-handoff` und `xtend.epic14LspHandoff`.
- Epic 14 ist abgeschlossen.

Naechster sinnvoller Produktpfad:

- Folge-Epic fuer RMT DSL Syntax, Formatter, Writer API, Project Index und editorseitige Distribution planen.

## Abnahmekriterien

Epic 14 ist erfolgreich, wenn:

- `.rmt` Dateien lokal gelintet werden koennen
- Linter-Diagnosen stabile Codes, Ranges und Repair-Hints besitzen
- RMT-Referenzen semantisch geprueft werden
- ein LSP Server Diagnostics, Completion, Hover, Symbols und Definition bereitstellt
- AI-Agenten denselben Diagnose- und Repair-Contract wie IDEs nutzen koennen
- keine XTend Runtime in den RMT Kernel oder in die Sprachebene eingebettet wird
- Docs und Quick Start RMT Tooling als Standardpfad zeigen

## Risiken und Entscheidungen

| Risiko | Entscheidung |
|--------|--------------|
| LSP wird editor-spezifisch | LSP ueber stdio ist Source of Truth; Editor-Packages sind duenn |
| Linter dupliziert Kernel-Logik | Normalisierung laeuft ueber `createRmtFormat`; Linter ergaenzt nur Authoring-Diagnostik |
| Diagnostics werden instabil | Diagnosecodes werden versioniert und getestet |
| `.rmt.json` kehrt als Normalpfad zurueck | Linter warnt bei Fallback-Dateitypen |
| Completion braucht Runtime Imports | Completion nutzt Manifest, Types, Contracts und Catalog-Artefakte, keine Runtime-Ausfuehrung |
| Formatter wird zu frueh bindend | Formatter bleibt vorbereitet, aber nicht MVP-pflichtig |

## Abschlussstatus

Epic 14 ist abgeschlossen. Die technische Kernkette wurde ohne zweite Semantik neben dem RMT Format umgesetzt: Source Model, Parser/Format Adapter, Semantic Graph, Linter Rules, CLI, LSP, Code Actions, Agent Report, Editor Packaging, Regression Matrix, Doku, Release Gates und Handoff nutzen dieselbe Sprachebene.
