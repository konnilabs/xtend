# WP-E14-03 - Parser- und Format-Adapter an createRmtFormat anbinden

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Parser Contract: `xtend.rmt.parser.v1`
- Format Adapter Contract: `xtend.rmt.format-adapter.v1`
- Report Schema: `xtend.rmt.parser-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-parser --json`
- Package Script: `npm run test:rmt-parser`
- Zielzustand: `rmt-parser-format-adapter-ready`

## Ziel

`WP-E14-03` bindet das in `WP-E14-02` angelegte Source Model an den bestehenden RMT-Format-Contract an.

Die Tooling-Schicht soll `.rmt` Dateien diagnostikfreundlich parsen, aber die produktive Normalisierung nicht selbst neu erfinden. Die Wahrheit fuer normalisierte RMT-Dokumente bleibt:

- `createRmtFormat().parseDocument(...)`

## Umgesetzt

- `tools/rmt-language/parser.js` als Text-, Syntax- und File-Policy-Schicht angelegt
- `tools/rmt-language/format-adapter.js` als Adapter zum lokalen `xtendrmt/rmt-core.esm.js` angelegt
- `createRmtFormat().parseDocument(...)` im Adapterpfad als Normalisierungsquelle eingebunden
- Syntaxfehler und Format-/Normalisierungsfehler in getrennte Phasen aufgeteilt
- `.rmt.json` und `.json` als lesbare Fallback-Dateitypen mit `rmt.document.extension.fallback-used` erkannt
- defekte `.rmt` Quellen liefern Diagnosen statt Throws im Tooling-Pfad
- Adapter-Ausfall liefert `rmt.format.adapter.unavailable`
- Normalisierungsfehler liefern `rmt.format.normalization.failed`
- `tests/rmt-language/rmt_parser_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-parser` erweitert
- Package-Exports fuer `rmt-language/source-model`, `rmt-language/parser` und `rmt-language/format-adapter` vorbereitet

## Architekturentscheidung

Der Parser macht nur:

- Source Model erzeugen
- JSON-Syntax pruefen
- Raw Document bereitstellen
- Fallback-Dateityp-Diagnosen erzeugen

Der Format Adapter macht nur:

- `createRmtFormat` lokal laden oder injiziert entgegennehmen
- `parseDocument` aufrufen
- normalisiertes RMT-Dokument oder Formatdiagnostik zurueckgeben

Damit bleibt die spaetere Linter Rule Engine frei von doppelter Parser-/Normalizer-Logik.

## Diagnosephasen

| Phase | Zweck | Beispiel-Code |
|-------|-------|---------------|
| `syntax` | JSON ist nicht parsebar | `rmt.syntax.invalid-json` |
| `parse` | JSON ist parsebar und raw document liegt vor | keine Fehlerdiagnose |
| `format` | RMT-Core-Adapter oder Normalisierung scheitert | `rmt.format.adapter.unavailable`, `rmt.format.normalization.failed` |
| `normalize` | RMT-Core hat normalisiert | keine Fehlerdiagnose |

Fallback-Diagnosen sind Warnungen und blockieren die Normalisierung nicht:

- `rmt.document.extension.fallback-used`

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| valide Fixtures normalisieren | erfuellt: Docs-RMT, Demo-App und First-Class-App |
| defekte Fixtures liefern Diagnose statt Throw | erfuellt: Syntax, Adapter-Ausfall und Normalisierungsfehler |
| `createRmtFormat().parseDocument` wird genutzt | erfuellt und per Spy-Test abgesichert |
| Syntax- und Formatfehler sind getrennt | erfuellt: `phase`/`status` im Ergebnis |
| `.rmt.json` ist Fallback-Warnung | erfuellt |
| keine Runtime-/XTend-Kopplung im Sprachkern | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-parser --json
```

## Handoff

`WP-E14-03` ist abgeschlossen. `WP-E14-04` kann nun den Semantic Graph fuer Domains, IDs und Referenzen aufbauen.

Die naechste Schicht soll nicht erneut parsen oder normalisieren, sondern ausschliesslich auf folgenden Ergebnissen arbeiten:

- `parserResult.rawDocument`
- `formatAdapterResult.normalizedDocument`
- `sourceModel.findJsonPointerRange(...)`
- `sourceModel.createDiagnostic(...)`
