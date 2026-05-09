# WP-E14-05 - Linter Rule Engine und Basisregeln erstellen

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.linter.rule-engine.v1`
- Report Schema: `xtend.rmt.linter.report.v1`
- Diagnostic Schema: `xtend.rmt.linter.diagnostic.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-linter-rules --json`
- Package Script: `npm run test:rmt-linter-rules`
- Zielzustand: `rmt-linter-rules-ready`

## Ziel

`WP-E14-05` fuehrt eine stabile Rule Engine fuer RMT ein. Sie baut auf dem Semantic Graph aus `WP-E14-04` auf und erzeugt deterministische Linter-Reports fuer CLI, CI und spaetere LSP-Diagnostics.

Die Rule Engine dupliziert keine Referenzanalyse. Graph-Diagnosen werden normalisiert, mit Severity Policy und Repair-Hints angereichert und zusammen mit Basisregeln in einem einheitlichen Report ausgegeben.

## Umgesetzt

- `tools/rmt-language/diagnostics.js` als Rule-Engine- und Report-Schicht angelegt
- `tools/rmt-language/rules/` als modulare Rule Registry angelegt
- Basisregeln umgesetzt:
  - `rmt.document-policy`
  - `rmt.route-policy`
  - `rmt.template-policy`
  - `rmt.scheduler-policy`
  - `rmt.boundary-policy`
- Severity Policy umgesetzt:
  - `error`
  - `warning`
  - `info`
  - `hint`
- Repair-Hints fuer MVP-Kinds umgesetzt:
  - `rename-file-extension`
  - `add-document-kind`
  - `create-adapter`
  - `create-component-stub`
  - `create-template-stub`
  - `create-schedule`
  - `replace-field-value`
  - `add-route-title`
- Native `.rmt` Policy ueber Parser-Diagnosen in den Linter-Report uebernommen
- Deterministische Diagnose-Sortierung nach Severity, Datei, Range, Code und Pointer umgesetzt
- JSON-Report ohne nichtdeterministische Graph-Interna erzeugt
- `tests/rmt-language/rmt_linter_rules_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-linter-rules` erweitert

## Basisdiagnosen

Die Engine deckt die Diagnosecodes aus dem Architektur-Katalog v1 fuer den MVP ab:

- `rmt.document.kind.missing`
- `rmt.document.extension.fallback-used`
- `rmt.domain.unknown`
- `rmt.domain.required.missing`
- `rmt.id.missing`
- `rmt.id.duplicate`
- `rmt.adapter.unknown`
- `rmt.ref.component.unresolved`
- `rmt.ref.template.unresolved`
- `rmt.ref.schedule.unresolved`
- `rmt.ref.route.duplicate-path`
- `rmt.route.path.invalid`
- `rmt.route.document-title.missing`
- `rmt.template.mode.unsupported`
- `rmt.template.dom-descriptor.invalid-node`
- `rmt.template.html-fragment.trust-boundary-missing`
- `rmt.template.inline-script.refused`
- `rmt.xtend.kernel-boundary.violation`
- `rmt.fabric.lane.unknown`
- `rmt.fabric.lane.conflict`
- `rmt.hydration.policy.unknown`
- `rmt.schedule.endpoint.missing`
- `rmt.a11y.route-announcement.missing`
- `rmt.deprecated.field.used`

## Architekturentscheidung

Der Report enthaelt keine direkte `graph`-Property. Stattdessen werden `graphStatus`, `manifestHints`, `catalogHints` und normalisierte Diagnosen ausgegeben.

Das ist absichtlich so:

- CLI- und CI-Reports bleiben deterministisch
- LSP-Diagnostics bekommen stabile Shape-Daten
- Completion, Hover und Definition koennen den Graph weiterhin direkt nutzen
- Die Rule Engine bleibt Side-Effect-frei und framework-agnostisch

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Rule Registry ist vorhanden | erfuellt: `tools/rmt-language/rules/index.js` |
| Severity Policy ist vorhanden | erfuellt: `SEVERITY_ORDER`, `severityPolicy` |
| Diagnosekatalog ist vorhanden | erfuellt: `DIAGNOSTIC_CATALOG` |
| Repair-Hints sind vorhanden | erfuellt: alle MVP-Kinds |
| Native `.rmt` Policy ist im Report sichtbar | erfuellt: Fallback-Diagnosen werden normalisiert |
| Basisdiagnosen sind implementiert | erfuellt |
| JSON-Report ist deterministisch | erfuellt: Wiederholungstest in Suite |
| keine Runtime-/XTend-Kopplung im Sprachkern | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-linter-rules --json
npm run test:rmt-linter-rules -- --json
```

## Handoff

`WP-E14-05` ist abgeschlossen. `WP-E14-06` kann nun die CLI-Schicht `xt rmt lint` bauen.

Die CLI soll ausschliesslich `lintRmtSource(...)` bzw. `createRmtLinter(...)` nutzen und keine eigene Rule- oder Referenzlogik implementieren.
