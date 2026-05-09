# WP-E03-04 - Generator-Grundgeruest und Template-Ladepfad anlegen

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-03-Komponenten-Blueprint-und-Artefaktcontract-entwerfen.md`
  - `xtend-builder/generators/registry.js`
  - `xtend-builder/generators/component-plan.js`
  - `xtend-builder/templates/registry.js`
  - `xtend-builder/utils/validation.js`
  - `xtend-builder/utils/naming.js`
  - `xtend-builder/scaffold.config.js`

## Ziel

`WP-E03-04` legt das technische Grundgeruest fuer Scaffold-Generatoren an. Das Paket macht Generator-Registry, Template-Ladepfad, Eingabevalidierung und eine lokale Dry-Run-Plan-Ausgabe nutzbar, ohne bereits Produktivdateien zu schreiben.

## Umgesetzte Artefakte

- `xtend-builder/generators/registry.js` mit Schema `xtend.scaffold.generator-registry.v1`
- `xtend-builder/generators/component-plan.js` mit Schema `xtend.scaffold.component-plan.v1`
- `xtend-builder/templates/registry.js` mit Schema `xtend.scaffold.template-registry.v1`
- `xtend-builder/utils/naming.js` fuer Tag-, Name-, Klassenname- und Token-Helfer
- `xtend-builder/utils/validation.js` fuer deterministische Tag-, Profil- und Feature-Validierung
- CLI-Commands `generators`, `templates` und `component-plan`
- Config-Referenzen fuer Generator-Registry und Template-Ladepfad
- Reference-Gates fuer Plan-Ausgabe, Validierung und dry-run-first-Grenze

## Lokale Entry Points

```bash
node xtend-builder/scaffold.js generators --json
node xtend-builder/scaffold.js templates --json
node xtend-builder/scaffold.js component-plan --tag x-example --profile display --json
```

## Validierungsregeln

- `--tag` ist Pflicht und muss `^x-[a-z0-9]+(?:-[a-z0-9]+)*$` erfuellen.
- `--profile` ist Pflicht und muss einem Component-Level-Profil aus dem Blueprint entsprechen.
- `--feature` / `--features` duerfen nur registrierte Feature-Namen enthalten.
- Fehler werden deterministisch als Exit-Code `1` und im JSON-Modus als `ok: false` ausgegeben.

## Grenze

Der Generatorpfad ist in `WP-E03-04` bewusst `plan-only`. Er loest Artefaktpfade, Template-IDs und Aktionen auf, schreibt aber keine Dateien. Produktive Pflichtartefakt-Templates und kontrollierte Datei-Ausgabe gehoeren zu `WP-E03-05`.

## Verifikation

- `node --check xtend-builder/generators/registry.js`
- `node --check xtend-builder/generators/component-plan.js`
- `node --check xtend-builder/templates/registry.js`
- `node --check xtend-builder/utils/validation.js`
- `node --check xtend-builder/utils/naming.js`
- `node xtend-builder/scaffold.js component-plan --tag x-example --profile display --json`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-04` ist abgeschlossen. `XTend-Scaffold` besitzt nun ein startbares Generator-Grundgeruest mit Template-Ladepfad und sicherer Dry-Run-Plan-Ausgabe. `WP-E03-05` kann darauf aufbauend Pflichtartefakt-Generatoren und konkrete Templates fuer Komponente, Doku, Tests, Fixtures und Types umsetzen.
