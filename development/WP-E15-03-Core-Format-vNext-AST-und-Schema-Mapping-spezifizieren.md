# WP-E15-03 - Core Format vNext, AST und Schema Mapping spezifizieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Epic Contract: `xtend.rmt.vnext-syntax.v1`
- Grammar Contract: `xtend.rmt.vnext.grammar.v1`
- Core Contract: `xtend.rmt.core-format.vnext.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-core-ast-schema-ready`
- Gate: JSON-Core-Probe mit minimaler und komplexer Fixture

## Ziel

`WP-E15-03` uebersetzt die in `WP-E15-02` eingefrorene Authoring-Grammatik in ein JSON-kompatibles Core-Ziel. Das Paket implementiert noch keinen produktiven Lexer, Parser oder Compiler. Es stabilisiert die Zieltypen, damit `WP-E15-04` den Parser gegen feste AST Node Types bauen kann und `WP-E15-05` anschliessend deterministisch von AST nach Core kompiliert.

## Umgesetzt

- `development/XTendRMT-vNext-Core-Format-Contract.md` als Core-Contract `xtend.rmt.core-format.vnext.v1` angelegt
- vNext-Core-Dokumentform mit `schema`, `kind`, `version`, `manifest`, `templates`, `surfaces`, `lanes`, `operations` und `sourceMap` festgelegt
- AST Node Types fuer alle MVP-Grammar-Forms definiert
- Core-Domains fuer `imports`, `templates`, `surfaces`, `lanes`, `operations`, `slots`, `events`, `dataSources`, `securityPolicies` und `sourceMap` spezifiziert
- stabile ID-Regeln fuer Templates, Surfaces, Lanes, Operations, Slots, Events, Sources und Policies dokumentiert
- Source-Map-Regeln fuer `sourceRef`, AST Pointer, Core JSON Pointer und zero-based Ranges definiert
- Minimal-Core-Fixture fuer Template, Surface, Lane und Lifecycle-Operation erstellt
- Complex-Core-Fixture fuer Imports, Conditions, Slots, Events, Data Sources, Trust Boundary, Sanitizing und Streaming erstellt
- additive Schema-Deltas zu `xtendrmt/rmt.schema.json` dokumentiert
- Epic-Backlog aktualisiert: `WP-E15-03` completed, `WP-E15-04` ready

## AST- und Core-Entscheidung

| Grammar Form | AST Node Type | Core Domain |
|--------------|---------------|-------------|
| Document | `RmtVNextDocument` | document root |
| ImportDecl | `RmtImportDeclaration` | `imports[]` |
| TemplateDecl | `RmtTemplateDeclaration` | `templates[]` |
| SurfaceDecl | `RmtSurfaceDeclaration` | `surfaces[]` |
| LaneDecl | `RmtLaneDeclaration` | `lanes[]` |
| LifecycleStmt | `RmtLifecycleStatement` | `operations[]` |
| StreamStmt | `RmtStreamStatement` | `operations[]` |
| SourceClause | `RmtSourceClause` | `dataSources[]` |
| ConditionClause | `RmtConditionClause` | inline `condition` |
| Expression | `RmtConditionExpression` | inline expression tree |
| PolicyBlock | `RmtPolicyBlock` | owner `policyRefs` |
| SlotDecl | `RmtSlotDeclaration` | `slots[]` |
| EventBinding | `RmtEventBinding` | `events[]` |
| TrustPolicy | `RmtTrustBoundaryPolicy` | `securityPolicies[]` |
| SanitizePolicy | `RmtSanitizePolicy` | `securityPolicies[]` |

## Schema-Delta-Entscheidung

Das bestehende Produktionsschema `xtendrmt/rmt.schema.json` bleibt die Quelle fuer aktuelle JSON-nahe RMT-Dokumente. vNext wird additiv ergaenzt.

Dokumentierte Deltas:

- `schema: "xtend.rmt.core-format.vnext.v1"`
- `version: "2.0-vnext"`
- neue optionale Top-Level-Domains `imports`, `lanes`, `operations`, `slots`, `events`, `dataSources`, `securityPolicies`, `sourceMap`
- `manifest.sourceSyntax`
- `manifest.contracts`
- `templates[].mode: "orchestration"`
- `templates[].surfaceRefs`
- `surfaces[].scope`
- `surfaces[].laneRefs`
- `surfaces[].sourceRef`

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| jede MVP-Syntaxform hat eine eindeutige Core-Repraesentation | erfuellt: AST/Core-Mapping-Tabelle und Domain-Spezifikation |
| Parser-MVP kann gegen stabile Node-Typen parsen | erfuellt: Node-Type-Liste fuer `WP-E15-04` fixiert |
| Schema-Delta zu bestehendem RMT-Schema ist dokumentiert | erfuellt |
| Source Map und JSON Pointer sind definiert | erfuellt |
| Minimal- und Complex-Fixture sind vorhanden | erfuellt |
| Core-Fixtures sind JSON-parsebar | erfuellt |
| bestehende JSON-nahe RMT-Dokumente bleiben kompatibel | erfuellt: vNext ist additive Schema-Erweiterung |

## Verifikation

JSON-Core-Probe fuer alle eingebetteten JSON-Beispiele im Core Contract:

```bash
node -e 'const fs=require("fs"); const file="development/XTendRMT-vNext-Core-Format-Contract.md"; const text=fs.readFileSync(file,"utf8"); const re=/```json\n([\s\S]*?)```/g; const blocks=[...text.matchAll(re)]; blocks.forEach((m,i)=>{try{JSON.parse(m[1]);}catch(e){console.error("JSON block "+i+" failed: "+e.message); process.exit(1);}}); console.log(JSON.stringify({status:"passed", file, jsonBlocks: blocks.length}));'
```

Ergebnis:

- Status: `passed`
- JSON Blocks: `16`

Referenzpfad-Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `7472`
- Failures: `0`
- Warnings: `0`

## Handoff

`WP-E15-03` ist abgeschlossen. `WP-E15-04` kann den Lexer/Parser MVP fuer Templates, Surfaces, Lanes und Lifecycle Operations bauen.

Die naechste Umsetzung soll bewusst bei Syntax und AST bleiben:

- Tokenizer fuer Grammar MVP
- Parser fuer `RmtVNextDocument`, `RmtImportDeclaration`, `RmtTemplateDeclaration`, `RmtSurfaceDeclaration`, `RmtLaneDeclaration`, `RmtLifecycleStatement` und `RmtStreamStatement`
- Syntaxdiagnostics mit Line/Column und Recoverability
- AST Pointer und Source Ranges fuer spaetere Source Maps
- positive und negative Parser-Fixtures

Noch nicht Teil von `WP-E15-04`:

- vollstaendige AST-to-Core Compilation
- Import-Aufloesung
- Adapter- oder Reference-Validation
- Runtime-Ausfuehrung
- LSP-Integration
