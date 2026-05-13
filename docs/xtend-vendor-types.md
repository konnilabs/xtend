# XTend Vendor and Utility Types

- Contract: `xtend.type-exports.vendor-facades.v1`
- Workpackage: `WP-TypeExports-08`
- Gate: `node scripts/run_xtend_tests.js type-exports-vendor --json`
- Report: `.xtend-test-results/xtend-type-exports-vendor-report.json`

## Zweck

`WP-TypeExports-08` schliesst die verbleibenden Type-Facade-Luecken an Randmodulen. Die Facades sind absichtlich schmal: XTend kopiert keine vollstaendige Prism- oder Turndown-Typwelt, sondern beschreibt nur die stabile Nutzungsgrenze im Projekt.

## Facades

- `./components/prism.d.ts` beschreibt die globale und CommonJS-faehige Prism-Fassade mit `highlight`, `highlightElement`, `highlightAllUnder`, `hooks`, `languages` und `Token`.
- `./components/turndown.d.ts` beschreibt die Browser-Global-Fassade `window.TurndownService` fuer Side-Effect-Imports und lokale Markdown-Konvertierung.
- `./design-tokens/xtend-design-tokens.d.ts` beschreibt den produktiven Design-Token-Contract `xtend.design-tokens.product-contract.v1`, Theme Packs, Density Packs und Validatoren.
- `./design-tokens/xtheme-token-alias-layer.d.ts` beschreibt den XTheme Alias Layer `xtend.theme.token-alias-layer.v1`, Legacy Bridges, Component Aliases und Validatoren.

## Theme JSON

`./design-tokens/themes/enterprise-light` bleibt eine JSON-Boundary. Das Beispiel-Theme wird als Datenartefakt exportiert und benoetigt keine eigene Runtime-Declaration. Consumer, die JSON importieren, sollen ihre Projektkonfiguration fuer JSON-Module nutzen.

## Nicht-Ziele

- Keine Volltypisierung der gesamten Prism-Sprachliste.
- Keine Uebernahme fremder Vendor-Interna in XTend-Namespace-Typen.
- Keine Runtime-Aenderung an `components/prism.js`, `components/turndown.js`, `design-tokens/xtend-design-tokens.js` oder `design-tokens/xtheme-token-alias-layer.js`.

## Drift Gate

```bash
node scripts/run_xtend_tests.js type-exports-vendor --json
npm run test:type-exports-vendor
```

Der Gate prueft, dass `./design-tokens` und `./design-tokens/xtheme-token-alias-layer` eine `types`-Condition besitzen, dass die Komponenten-Vendor-Dateien eigene `.d.ts`-Facades haben, dass keine Component-`.js`-Datei ohne Declaration-Gap bleibt und dass die Facades keine Runtime-Imports oder Vendor-Implementierungsdetails kopieren.
