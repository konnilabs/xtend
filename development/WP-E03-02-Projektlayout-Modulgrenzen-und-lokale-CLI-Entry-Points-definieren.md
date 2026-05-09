# WP-E03-02 - Projektlayout, Modulgrenzen und lokale CLI-Entry-Points definieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/XTend-Scaffold-Architektur-und-Tooling-Entscheidung.md`
  - `development/WP-E03-01-Scaffold-Architektur-Scope-und-Tooling-Entscheidung-festlegen.md`
  - `xtend-builder/README.md`
  - `xtend-builder/scaffold.config.js`
  - `xtend-builder/scaffold.js`

## Ziel

`WP-E03-02` definiert das sichtbare Projektlayout, die Modulgrenzen und lokale Entry Points fuer `XTend-Scaffold`. Das Paket macht den Builder lokal startbar, ohne bereits Generatorlogik oder produktive Schreibpfade umzusetzen.

## Umgesetzte Artefakte

- `xtend-builder/scaffold.js` als lokaler Node/CommonJS-Entry-Point
- `xtend-builder/lib/cli.js` fuer CLI-Parsing, Hilfe, Layout- und Config-Ausgabe
- `xtend-builder/lib/layout.js` als maschinenlesbarer Layout-Contract
- `xtend-builder/README.md` als Nutzungs- und Strukturreferenz
- `xtend-builder/blueprints/`, `generators/`, `templates/` und `utils/` mit README-Grenzen
- `package.json` mit `npm run scaffold`
- Reference-Gates fuer CLI-, Layout- und Config-Contract

## Modulgrenzen

| Bereich | Verantwortung | Grenze |
|---------|---------------|--------|
| `xtend-builder/scaffold.js` | lokaler Einstieg | delegiert nur an das CLI-Modul |
| `xtend-builder/lib/cli.js` | Argumentauswertung und Ausgabe | keine Generator- oder Schreiblogik |
| `xtend-builder/lib/layout.js` | Layout-Contract | keine Dateisystemmutation |
| `xtend-builder/blueprints/` | kuenftige Blueprint-Contracts | wird in `WP-E03-03` fachlich gefuellt |
| `xtend-builder/generators/` | kuenftige Generatoren | wird erst ab `WP-E03-04` produktiv |
| `xtend-builder/templates/` | kuenftige Templates | wartet auf Blueprint-Freeze |
| `xtend-builder/utils/` | kuenftige pure Helfer | keine versteckten Schreibzugriffe |

## Lokale Entry Points

```bash
node xtend-builder/scaffold.js --help
node xtend-builder/scaffold.js layout
node xtend-builder/scaffold.js layout --json
npm run scaffold -- layout
```

Die CLI unterstuetzt in WP-02 bewusst nur Hilfe, Layout- und Config-Summary. Komponenten-Generierung bleibt fuer `WP-E03-03` und `WP-E03-04` getrennt, damit der Blueprint-Contract vor der Generatorlogik entsteht.

## Verifikation

- `node --check xtend-builder/scaffold.js`
- `node --check xtend-builder/lib/cli.js`
- `node --check xtend-builder/lib/layout.js`
- `node xtend-builder/scaffold.js --help`
- `node xtend-builder/scaffold.js layout --json`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-02` ist abgeschlossen. `XTend-Scaffold` besitzt nun ein stabiles Projektlayout, maschinenlesbare Modulgrenzen und lokale CLI-Entry-Points. `WP-E03-03` kann den Komponenten-Blueprint und Artefaktcontract auf dieser Struktur aufbauen.
