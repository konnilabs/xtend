# Native RMT Authoring

Native RMT Dokumente ohne Legacy-JSON als bevorzugter Authoring-Pfad.

## Worum es geht

Native Authoring bedeutet, dass eine `.rmt` Datei die bearbeitbare Source of Truth bleibt. Legacy-JSON und generierte Core-Dateien sind Vergleichs- oder Runtime-Artefakte, aber kein Ort für manuelle Produktlogik.

## Öffentliche Bausteine

- `tools/rmt-language/vnext-parser.js` liest native Syntax.
- `tools/rmt-linter/cli.js` liefert lokale Diagnostics.
- `tools/rmt-language/vnext-compiler.js` erzeugt das Core-Modell.

## Empfohlener Ablauf

Erstelle die RMT Source, linte sie und kompiliere erst nach einem fehlerfreien Parserlauf. Prüfe den Core-Diff und committe Source und erwartetes Artefakt gemeinsam, wenn sich Semantik bewusst ändert.

## Editor-Hilfen

[RMT Linter](./rmt-linter.md) und
[RMT Language Server](./rmt-language-server.md) decken Linter, LSP, Code
Actions und Agent Report ab. Häufige Snippets sind `rmt-component` für
Komponentenrecords und `rmt-template-dom` für DOM Descriptor Templates.
Regressionen im Tooling prüfst du mit
`node scripts/run_xtend_tests.js rmt-language-regression --json`.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Lokale Prüfung

```bash
node scripts/run_xtend_tests.js rmt-tooling-docs rmt-language-regression --json
```

Der erste Gate prüft den dokumentierten Authoring-Pfad, der zweite Parser-, Diagnostic- und Editor-Parität. Ändere bei einem Fehler zuerst die `.rmt` Source oder das zuständige Tool, nicht das erzeugte Core-JSON.
