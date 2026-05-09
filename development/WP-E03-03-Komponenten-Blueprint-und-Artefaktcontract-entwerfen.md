# WP-E03-03 - Komponenten-Blueprint und Artefaktcontract entwerfen

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-02-Projektlayout-Modulgrenzen-und-lokale-CLI-Entry-Points-definieren.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `xtend-builder/blueprints/README.md`
  - `xtend-builder/blueprints/component-blueprint.contract.js`
  - `xtend-builder/scaffold.config.js`

## Ziel

`WP-E03-03` uebersetzt die Epic-02-Testpflicht in einen verbindlichen Komponenten-Blueprint fuer `XTend-Scaffold`. Das Paket legt fest, welche Artefakte eine scaffolded Komponente besitzen muss, wie Profile auf Mindestchecks abgebildet werden und wie Ausnahmen begruendet werden muessen.

## Umgesetzte Artefakte

- `xtend-builder/blueprints/component-blueprint.contract.js` mit Schema `xtend.scaffold.component-blueprint.v1`
- `xtend-builder/blueprints/README.md` mit Artefaktmatrix, Profilmapping und Ausnahmeprozess
- `xtend-builder/scaffold.config.js` mit Blueprint-Referenz und `blueprint`-Command
- `xtend-builder/lib/cli.js` mit read-only Blueprint-Ausgabe
- Reference-Gates fuer Blueprint, Config, CLI und Epic-/Backlog-Status

## Artefaktcontract

| Artefakt | Zielpfad | Pflicht | Generator-Modus |
|----------|----------|---------|-----------------|
| `component` | `components/<tag>.js` | ja | neue Datei |
| `docs` | `docs/components/<name>.md` | ja | neue Datei |
| `tests` | `tests/components/<tag>.component_suite.js` | ja | neue Datei mit echten Assertions |
| `fixtures` | `tests/components/fixtures/<tag>.component.html` | ja oder dokumentierte Ausnahme | neue lokale Fixture |
| `types` | `components/<tag>.d.ts` | ja oder dokumentierte Ausnahme | neue Typdefinition |
| `manifest` | `components/manifest.json` | ja | Patch-Plan, kein stilles Schreiben |
| `demo` | Demo-/Preview-Referenz | bedingt | Referenz-Plan |

## Profilcontract

Der Blueprint uebernimmt die Profile `display`, `interactive`, `stateful`, `feedback`, `overlay`, `routing`, `theme`, `form` und `media` aus dem Component-Level-Teststandard. Komponenten mit mehreren Profilen muessen die Vereinigungsmenge der Mindestchecks abdecken.

## Ausnahmeprozess

Eine Ausnahme ist nur zulaessig, wenn das Artefakt fuer die Komponente fachlich nicht anwendbar ist. Der Grund muss im generierten Worklog, in der Komponentendoku oder in der Suite genannt werden. Platzhaltertests, stillschweigend ausgelassene Manifest-Eintraege und undokumentierte Typ-Luecken sind nicht erlaubt.

## Lokale Entry Points

```bash
node xtend-builder/scaffold.js blueprint
node xtend-builder/scaffold.js blueprint --json
```

## Verifikation

- `node --check xtend-builder/blueprints/component-blueprint.contract.js`
- `node --check xtend-builder/lib/cli.js`
- `node xtend-builder/scaffold.js blueprint --json`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-03` ist abgeschlossen. `XTend-Scaffold` besitzt nun einen verbindlichen Komponenten-Blueprint und Artefaktcontract. `WP-E03-04` kann auf dieser Basis Generator-Registry, Template-Ladepfad, Eingabevalidierung und Plan-Ausgabe anlegen.
