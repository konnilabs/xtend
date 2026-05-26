# XTend Vendor Types

XTend Vendor Types dokumentieren schmale öffentliche Fassaden für Utility- und Design-Token-Bausteine. Sie decken Prism, Turndown und Design Tokens ab, ohne die jeweiligen Implementierungen als breite Runtime-Abhängigkeit zu behandeln. Für Hosts ist das praktisch, wenn Markdown, Syntax-Highlighting oder Theme JSON verarbeitet werden, aber nur die stabile XTend-Paketoberfläche importiert werden soll.

## Vendor-Oberfläche

Die zentralen Deklarationen sind `./components/prism.d.ts`, `./components/turndown.d.ts`, `./design-tokens/xtend-design-tokens.d.ts` und `./design-tokens/xtheme-token-alias-layer.d.ts`. Sie beschreiben kleine Fassaden statt komplette Fremdbibliotheken. Dadurch bleibt klar, welche Funktionen XTend öffentlich unterstützt und welche Details weiterhin zur jeweiligen Library gehören.

Design Tokens sind dabei mehr als eine Datei mit Farben. Die Typen beschreiben Token-Sets, Theme-Metadaten und Alias-Schichten, die Host-Anwendungen für eigene Themes auswerten können. Ein Host kann ein Theme JSON lesen, validieren und in ein eigenes Design-System übertragen, ohne private XTend-Interna zu importieren.

## Stabilitätsregel

Vendor-Fassaden bleiben schmal. Wenn eine fremde Library neue Möglichkeiten bietet, übernimmt XTend nur die Teile, die als öffentlicher Vertrag gebraucht werden. Breite Re-Exports würden die Paketoberfläche schwer kontrollierbar machen und Drittanbieter an Details binden, die XTend nicht garantieren kann. Für Design Tokens gilt dieselbe Regel: öffentliche Token-Verträge ja, interne Build-Helfer nein.

Diese Grenze hilft auch beim Packaging. Pack Dry Runs und Export-Locks können prüfen, ob die Deklarationen im Paket liegen, ohne den gesamten Vendor-Baum als öffentliche API zu behandeln.

## Lokale Prüfung

Führe die Vendor-Type-Prüfung aus, wenn Prism, Turndown, Design Tokens, Theme Alias Layer oder Package Exports geändert werden.

```bash
node scripts/run_xtend_tests.js type-exports-vendor --json
```

```txt
schema: xtend.type-exports.vendor-facades.v1
local gate: node scripts/run_xtend_tests.js type-exports-vendor --json
report: .xtend-test-results/xtend-type-exports-vendor-report.json
```

## Pflegehinweise

Ergänze Vendor-Typen nur, wenn ein Host die Form wirklich importieren soll. Für rein interne Adapter reicht ein lokaler Typ im Modul. Öffentliche Design-Token-Änderungen sollten mit Beispiel-Theme, Alias-Schicht und Dokumentation aktualisiert werden. So bleiben Prism, Turndown und Theme JSON einfach nutzbar, ohne dass XTend zum Durchreichexport jeder abhängigen Library wird.
