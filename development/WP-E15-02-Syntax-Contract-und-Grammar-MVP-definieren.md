# WP-E15-02 - Syntax Contract und Grammar MVP definieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Epic Contract: `xtend.rmt.vnext-syntax.v1`
- Grammar Contract: `xtend.rmt.vnext.grammar.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Primaerer Dateityp: `.rmt`
- Zielzustand: `rmt-vnext-grammar-mvp-ready`
- Gate: Grammar-Review mit mindestens je einem Beispiel pro geplantem Sprachkonzept

## Ziel

`WP-E15-02` friert die erste vNext-Authoring-Grammatik ein. Das Paket implementiert noch keinen Parser und kein Core-Format-Mapping. Es sorgt dafuer, dass `WP-E15-03` die AST- und Core-JSON-Struktur ohne Syntaxunklarheiten spezifizieren kann und `WP-E15-04` den Lexer/Parser gegen stabile Regeln baut.

## Umgesetzt

- `development/XTendRMT-vNext-Grammar-Contract.md` als Grammar-Contract `xtend.rmt.vnext.grammar.v1` angelegt
- lexikalisches Modell fuer Whitespace, Statement-Enden, Kommentare, Strings, Zahlen, Booleans und `null` festgelegt
- Identifier-, Qualified-Identifier- und Escaped-Identifier-Regeln definiert
- reservierte Woerter und bewusst ausgeschlossene imperative Woerter dokumentiert
- Dokumentstruktur auf `import`, `template` und `surface` am Top-Level begrenzt
- `surface` -> `lane` -> Lifecycle/Stream als explizites MVP-Blockmodell festgelegt
- Data Sources ueber `from endpoint`, `from sse` und `from worker` als referenzielle Capabilities beschrieben
- `when` Conditions auf ein kleines deklaratives Expression-Subset begrenzt
- `slot`, `on ... -> action`, `trust boundary`, `sanitize` und `stream` in die MVP-Grammatik aufgenommen
- Semikolon-, Trailing-Comma- und Kommentarentscheidung dokumentiert
- gueltige und ungueltige MVP-Fixtures in den Contract aufgenommen
- Epic-Backlog aktualisiert: `WP-E15-02` completed, `WP-E15-03` ready

## Syntaxentscheidungen

| Bereich | Entscheidung |
|---------|--------------|
| Statement-Ende | Newline, Semikolon oder Blockende |
| Semikolons | optional nach einfachen Statements erlaubt |
| Trailing Commas | nicht erlaubt |
| Kommentare | `//` und nicht verschachtelte `/* */` |
| Strings | nur doppelt quotierte JSON-kompatible Strings |
| Single Quotes | nicht im MVP |
| Top-Level Operations | nicht erlaubt |
| Imports | nur statische String-Imports |
| Conditions | Path, String, Integer, Boolean, `null`, Vergleich, `&&`, `||`, `!`, Klammern |
| Nicht erlaubte Conditions | Funktionsaufrufe, Listenliterale, Ternary, Eval, Runtime-Code |
| Runtime-Ausfuehrung | nicht Teil der Grammatik |

## Grammar Review Matrix

| Konzept | Review-Ergebnis |
|---------|-----------------|
| Imports | gueltiges und ungueltiges Beispiel vorhanden |
| Templates | gueltiges Beispiel vorhanden |
| Surfaces | gueltiges Beispiel vorhanden |
| Lanes | gueltiges und ungueltiges Beispiel vorhanden |
| Lifecycle Operations | gueltiges Beispiel und Top-Level-Gegenbeispiel vorhanden |
| Data Sources | gueltiges und ungueltiges Beispiel vorhanden |
| Conditions | gueltige und ungueltige Beispiele vorhanden |
| Slots | gueltiges Beispiel vorhanden |
| Events und Actions | gueltiges und ungueltiges Beispiel vorhanden |
| Trust Boundaries | gueltiges Beispiel vorhanden |
| Sanitizing | gueltiges Beispiel vorhanden |
| Streaming | gueltiges Beispiel vorhanden |
| Imperative Nicht-Ziele | ungueltige Beispiele vorhanden |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Parser-MVP kann ohne interpretative Luecken gebaut werden | erfuellt: Grammar Contract beschreibt Dokument-, Block- und Statementformen |
| Syntax bleibt lesbar | erfuellt: keine Objektliteral-, Listen- oder Script-Syntax im MVP |
| Syntax bleibt deterministisch | erfuellt: statische Imports, explizite Bloecke, keine Runtime-Ausdruecke |
| Syntax bleibt AST-stabil | erfuellt: jedes Statement hat eindeutige Keyword- und Blockform |
| Jedes geplante Sprachkonzept hat ein Beispiel | erfuellt: Grammar Review Matrix |
| Semikolons sind entschieden | erfuellt: optional nach einfachen Statements |
| Trailing Commas sind entschieden | erfuellt: nicht erlaubt |
| Kommentarformen sind entschieden | erfuellt: `//` und `/* */` |

## Verifikation

Das primaere WP-Gate ist ein Grammar-Review. Parser-, Compiler- und Runtime-Tests entstehen erst in `WP-E15-03` bis `WP-E15-05`.

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

`WP-E15-02` ist abgeschlossen. `WP-E15-03` kann Core Format vNext, AST und Schema Mapping spezifizieren.

Die naechste Umsetzung soll die Grammar bewusst in maschinenlesbare Contracts uebersetzen:

- AST-Node-Namen fuer alle Grammar-Forms
- JSON-kompatible Core-Repraesentation
- Source-Map- und JSON-Pointer-Mapping
- Schema-Delta zu `xtendrmt/rmt.schema.json`
- semantische Diagnosecodes fuer Kontextfehler

Noch nicht Teil von `WP-E15-03`:

- produktiver Lexer/Parser
- Runtime-Ausfuehrung
- LSP-Integration
- automatische Migration
