# XTendRMT Snippets

- Schema: `xtend.rmt.snippet-catalog.v1`
- Workpackage: `WP-E14-12`
- Primaerer Dateityp: `.rmt`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

Diese Snippets sind editor-agnostische Authoring-Hilfen fuer native RMT-Dokumente. Die fachliche Wahrheit bleibt beim RMT Language Server und den Providern in `tools/rmt-language`.

## Dateien

- `index.js` stellt den stabilen Snippet-Katalog und Editor-Packaging-Metadaten bereit.
- `rmt.code-snippets` ist das VS-Code-kompatible Exportformat.

## Policy

Neue Snippets duerfen keine `.rmt.json` Dokumente erzeugen. `.rmt.json` bleibt nur ein lesbarer Edge-Case-Fallback im Parser, Linter und Agent-Report.
