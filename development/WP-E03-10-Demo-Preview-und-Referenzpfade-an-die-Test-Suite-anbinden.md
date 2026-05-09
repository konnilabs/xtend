# WP-E03-10 - Demo-/Preview- und Referenzpfade an die Test-Suite anbinden

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-09-Typisierungsstrategie-und-Template-RMT-Anschluss-vorbereiten.md`
  - `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
  - `docs/previews/README.md`
  - `xtend-builder/preview/component-preview.js`
  - `xtend-builder/templates/component/demo-plan.template.md`
  - `xtend-builder/generators/component-files.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E03-10` macht scaffolded Component-Previews als lokale, pruefbare Referenzpfade sichtbar. Das Paket erzeugt keine produktiven Demo-Dateien, sondern einen Dry-Run-Preview-Contract, der Doku, Fixture, Types, Manifest-Patchplan und Reference-Gate verbindet.

## Umgesetzte Artefakte

- Preview-Modul mit Schema `xtend.scaffold.component-preview.v1`
- CLI-Command:
  - `node xtend-builder/scaffold.js preview --tag x-example --profile display --feature state --json`
- NPM-Script:
  - `npm run scaffold:preview`
- implementiertes `demo` Template unter `xtend-builder/templates/component/demo-plan.template.md`
- `component-files` Ausgabe mit gerendertem `demo` Artefakt `docs/previews/<name>.preview.md`
- `wiring.preview` in der Dry-Run-Ausgabe
- Preview-Konventionsdokument unter `docs/previews/README.md`
- Reference-Registry-Erweiterung in `development/XTend-Dokumentations-und-Demo-Referenzpfade.md`
- Reference-Gates fuer Preview-Config, CLI, Template, Generatorausgabe und lokale Pfadpflicht

## Preview-Contract

| Bereich | Contract |
|---------|----------|
| Schema | `xtend.scaffold.component-preview.v1` |
| Zielpfad | `docs/previews/<name>.preview.md` |
| Status | `automated-static-candidate` bis zur produktiven Registrierung |
| Registry | `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` |
| Netzwerk | `externalNetworkAllowed: false` |
| Mindestgate | `node scripts/run_xtend_tests.js references --json` |
| Handoff | `npm test` |

Preview-Plaene referenzieren nur repo-lokale Component-, Docs-, Fixture-, Types- und Manifest-Pfade.

## Grenze

`WP-E03-10` fuehrt keinen produktiven Schreibmodus und keine Browser-Automation fuer jede scaffolded Komponente ein. Die Registry-Zeile bleibt reviewpflichtig. XTendRMT Bridge-Code, Rendering-Runtime und Root-Lifecycle-Erweiterungen bleiben fuer Epic 04, Epic 05 und `WP-E03-11` reserviert.

## Verifikation

- `node --check xtend-builder/preview/component-preview.js`
- `node --check xtend-builder/generators/component-files.js`
- `node --check xtend-builder/lib/cli.js`
- `node xtend-builder/scaffold.js preview --tag x-example --profile display --feature state --json`
- `node xtend-builder/scaffold.js component-files --tag x-example --profile display --feature state --json`
- `npm run scaffold:preview`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-10` ist abgeschlossen. `XTend-Scaffold` kann jetzt Preview-Referenzplaene erzeugen, das bedingte `demo` Artefakt im Dry-Run rendern und die Reference-Suite prueft die Scaffold-Preview-Konvention. `WP-E03-11` kann darauf aufbauend Templating-, Rendering- und Root-Lifecycle-Extension-Punkte vorbereiten.
