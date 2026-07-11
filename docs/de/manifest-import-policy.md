# Manifest Import Policy

Same-origin Imports, erlaubte Modulpfade und blockierte URL-Schemata.

## Worum es geht

Die Manifest Import Policy entscheidet vor dem dynamischen Import, ob Manifest und Modul lokal, syntaktisch gültig und vom Host erlaubt sind. Sie blockiert Path Traversal, externe Origins, falsche Extensions und aktive URL-Schemata.

## Öffentliche Bausteine

- `security/manifest-import-policy.js` implementiert URL- und Record-Prüfung.
- `xtend-loader.js` wendet dieselben Contracts beim Laden an.
- Erlaubte Module enden auf `.js` oder `.mjs`; Manifeste auf `.json`.

## Empfohlener Ablauf

Führe positive und negative Policy-Fixtures aus:

```bash
node scripts/run_xtend_tests.js manifest-import-policy --json
```

Lies bei einer Refusal-Diagnose zuerst Input, normalisierte URL und Code. Ändere Manifest-Key oder Pfad an der Quelle. `javascript:`, `data:`, `vbscript:`, `blob:` und ein externer Origin werden nicht durch einen Retry oder Cache-Bust erlaubt.

## Nächste Schritte

- [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md)
- [Supply Chain Checks](./supply-chain-gates.md)
