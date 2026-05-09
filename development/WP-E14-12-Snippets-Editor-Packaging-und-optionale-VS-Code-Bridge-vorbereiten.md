# WP-E14-12 - Snippets, Editor Packaging und optionale VS-Code-Bridge vorbereiten

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.editor-packaging.v1`
- Snippet Catalog: `xtend.rmt.snippet-catalog.v1`
- VS-Code Bridge: `xtend.rmt.editor.vscode-bridge.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-editor-packaging --json`
- Package Script: `npm run test:rmt-editor-packaging`
- Zielzustand: `rmt-editor-packaging-ready`

## Ziel

`WP-E14-12` macht das RMT Tooling in realen IDEs anschliessbar, ohne die fachliche Analyse in Editor-spezifische Packages zu verschieben.

Die zentrale Entscheidung bleibt: Der Language Server ist die einzige fachliche Source of Truth. Snippets und Editor-Packages sind nur Authoring-Komfort und Packaging.

## Umgesetzt

- `tools/rmt-language/snippets/index.js` als editor-agnostischer Snippet- und Packaging-Contract angelegt
- `tools/rmt-language/snippets/rmt.code-snippets` als VS-Code-kompatiblen Snippet-Export angelegt
- Snippets fuer Minimal-App, XTend Component, XRouter Route, Schedule Policy, DOM Descriptor Template und HTML Fragment Template bereitgestellt
- `tools/rmt-editor/vscode/` als duenne VS-Code-Bridge vorbereitet
- VS-Code Language ID `rmt`, Extension `.rmt`, Grammar, Snippets und Command-Metadaten angelegt
- `docs/rmt-language-server.md` mit VS Code, JetBrains, Neovim und Helix Setup ergaenzt
- `tests/rmt-language/rmt_editor_packaging_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-editor-packaging` erweitert

## Architekturentscheidung

Editor Packages duerfen:

- Language ID und Dateiendung registrieren
- statische Snippets ausliefern
- Syntax-Highlighting delegieren
- den RMT Language Server starten oder Startbefehle sichtbar machen

Editor Packages duerfen nicht:

- RMT-Diagnostik duplizieren
- XTend-Komponenten laden
- XRouter starten
- DOM materialisieren
- Netzwerk- oder CDN-Pfade fuer lokale Analyse voraussetzen

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Editor-agnostische Snippets vorhanden | erfuellt |
| VS-Code Bridge bleibt duennes Packaging | erfuellt |
| `.rmt` ist primaerer Authoring-Dateityp | erfuellt |
| `.rmt.json` wird nicht als Snippet-Normalpfad erzeugt | erfuellt |
| JetBrains/Neovim/Helix LSP-Hinweise dokumentiert | erfuellt |
| LSP bleibt Source of Truth | erfuellt |
| keine Runtime-/Netzwerkpflicht | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-editor-packaging --json
npm run test:rmt-editor-packaging -- --json
```

## Handoff

`WP-E14-12` ist abgeschlossen. `WP-E14-13` kann nun Fixtures, Regression, Fuzzing und negative Testmatrix erweitern.

Die Regressionstests sollen Snippets und Editor-Packaging konsumieren duerfen, aber weiterhin die RMT-Language-Provider als Source of Truth verwenden.
