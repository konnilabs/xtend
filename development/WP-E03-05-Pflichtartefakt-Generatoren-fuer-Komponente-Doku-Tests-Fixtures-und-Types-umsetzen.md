# WP-E03-05 - Pflichtartefakt-Generatoren fuer Komponente, Doku, Tests, Fixtures und Types umsetzen

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-04-Generator-Grundgeruest-und-Template-Ladepfad-anlegen.md`
  - `development/XTend-Testpflicht-und-Scaffold-Anschluss.md`
  - `development/XTend-Component-Level-Teststandard.md`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/templates/loader.js`
  - `xtend-builder/templates/component/source.template.js`
  - `xtend-builder/templates/component/docs.template.md`
  - `xtend-builder/templates/component/component-suite.template.js`
  - `xtend-builder/templates/component/fixture.template.html`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/templates/component/manifest-plan.template.json`

## Ziel

`WP-E03-05` setzt die Epic-02-Testpflicht als echte Generatorausgabe um. Das Paket rendert fuer eine scaffolded Komponente alle Pflichtartefakte als Dry-Run-Dateiinhalte, ohne schon Produktivdateien zu schreiben.

## Umgesetzte Artefakte

- `component-files` Generator mit Schema `xtend.scaffold.component-files.v1`
- Template-Loader fuer Platzhalterersetzung
- konkrete Templates fuer:
  - Komponente
  - Komponentendoku
  - Component-Level-Suite mit echten Assertions
  - lokale Fixture
  - TypeScript-Definition
  - Manifest-Patch-Plan
- dokumentierte Ausnahme fuer bedingtes Demo-/Preview-Artefakt
- Reference-Gates fuer Template-Dateien, Generatorausgabe und Test-Assertions

## Lokaler Entry Point

```bash
node xtend-builder/scaffold.js component-files --tag x-example --profile display --json
```

Der Befehl gibt `files` mit `targetPath`, `templateId` und `content` aus. Der Modus bleibt `dry-run`; es gibt keinen produktiven Schreibzugriff.

## Pflichtartefakt-Abdeckung

| Artefakt | Ausgabe |
|----------|---------|
| `component` | `components/<tag>.js` |
| `docs` | `docs/components/<name>.md` |
| `tests` | `tests/components/<tag>.component_suite.js` |
| `fixtures` | `tests/components/fixtures/<tag>.component.html` |
| `types` | `components/<tag>.d.ts` |
| `manifest` | `components/manifest.json` als Patch-Plan-Inhalt |

Das bedingte `demo`-Artefakt wird mit Begruendung auf `WP-E03-10` verschoben.

## Grenze

`WP-E03-05` erzeugt Inhalte, schreibt aber nicht ins Produktivrepository. Manifest-Wiring und Hydrations-Haertung wurden in `WP-E03-06` ergaenzt; kontrollierte Schreibstrategie folgt in spaeteren Workpackages.

## Verifikation

- `node --check xtend-builder/generators/component-files.js`
- `node --check xtend-builder/templates/loader.js`
- `node xtend-builder/scaffold.js component-files --tag x-example --profile display --json`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-05` ist abgeschlossen. `XTend-Scaffold` kann nun alle Pflichtartefakte aus dem Blueprint als konkrete Dry-Run-Dateiinhalte rendern. `WP-E03-06` hat darauf aufbauend Manifest- und Hydrations-Wiring gehaertet.
