# WP-E14-02 - Native .rmt Source Model und Range Mapping bauen

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.source-model.v1`
- Report Schema: `xtend.rmt.source-model-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-source-model --json`
- Package Script: `npm run test:rmt-source-model`
- Zielzustand: `rmt-source-model-range-mapping-ready`

## Ziel

`WP-E14-02` legt die native `.rmt` Source-Model-Schicht fuer den kommenden RMT-Linter und den RMT Language Server an.

Das Paket implementiert bewusst noch keine Linter-Regeln, keine Completion-Logik und keinen LSP-Transport. Es stabilisiert nur die Text-, URI-, Offset- und Range-Grundlage, damit alle spaeteren Diagnosen und Editor-Features dieselben Positionen verwenden.

## Umgesetzt

- `tools/rmt-language/source-model.js` als framework-neutrales RMT Source Model angelegt
- Datei-URI, Sprache, Version, Textlaenge, Snapshot-ID und Dateityp-Policy modelliert
- `.rmt` als kanonischer Dateityp erkannt
- `.rmt.json` und `.json` als Fallback-Dateitypen mit Diagnose-Code vorbereitet
- Line/Character/Offset-Mapping fuer LF- und CRLF-Dokumente umgesetzt
- Ranges mit LSP-kompatiblen `start`/`end` Positionen und stabilen Offset-Grenzen erzeugt
- JSON-Pointer-Range-Mapping fuer Objekt-Keys, Werte, Properties und Array-Elemente aufgebaut
- Syntaxdiagnostik fuer nicht parsebare `.rmt` Dokumente mit verwertbarer Range eingefuehrt
- Dirty-/In-Memory-Snapshots ueber `uri` und `version` ohne Dateisystemzugriff unterstuetzt
- `tests/rmt-language/rmt_source_model_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-source-model` erweitert

## Architekturentscheidung

Das Source Model bleibt eine reine Sprachebene unter:

- `tools/rmt-language`

Es kennt keine XTend-Komponenten, startet keinen Router und materialisiert kein DOM. Dadurch bleibt die Boundary aus `WP-E14-01` intakt:

- `no-rmt-kernel-import-of-xtend-types`

Die spaeteren Pakete sollen dieses Source Model wiederverwenden:

- Parser-Adapter
- Semantic Graph
- Linter-Regeln
- CLI-Reporter
- Language Server
- Completion, Hover, Symbols, Definition und Code Actions

## API-Oberflaeche

Das Paket stellt folgende Kernfunktionen bereit:

- `createRmtSourceModel(...)`
- `positionAt(offset)`
- `offsetAt({ line, character })`
- `rangeForOffsets(startOffset, endOffset)`
- `rangeForSpan(startOffset, length)`
- `lineText(line)`
- `lineRange(line)`
- `parseJson()`
- `findJsonPointerRange(pointer, options)`
- `findTextRange(needle)`
- `createDiagnostic(...)`
- `classifyRmtFile(pathOrUri)`
- `parseJsonPointer(pointer)`

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Diagnosen koennen stabile Ranges auf `.rmt` Dateien zeigen | erfuellt: `rangeForOffsets`, `rangeForSpan`, `createDiagnostic` |
| Parserfehler besitzen verwertbare Positionen | erfuellt: `rmt.syntax.invalid-json` mit Range |
| JSON Pointer koennen Werte und Keys lokalisieren | erfuellt: `findJsonPointerRange` |
| Dirty-Dokumente fuer LSP sind vorbereitet | erfuellt: `uri`, `version`, `snapshotId` ohne FS-Zwang |
| `.rmt` bleibt kanonischer Dateityp | erfuellt |
| `.rmt.json` bleibt Fallback | erfuellt |
| keine Runtime-/XTend-Kopplung | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-source-model --json
```

## Handoff

`WP-E14-02` ist abgeschlossen. `WP-E14-03` kann auf dieser Grundlage den Parser- und Format-Adapter an `createRmtFormat` anbinden.

Dabei soll die Trennung erhalten bleiben:

- Source Model liefert Text, URI, Positionen, Ranges und Syntaxdiagnostik.
- Parser-/Format-Adapter entscheidet erst im naechsten Paket ueber RMT-Normalisierung und Format-Contract.
