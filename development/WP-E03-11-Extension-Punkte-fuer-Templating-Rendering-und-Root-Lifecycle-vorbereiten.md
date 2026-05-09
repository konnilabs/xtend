# WP-E03-11 - Extension-Punkte fuer Templating, Rendering und Root-Lifecycle vorbereiten

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-10-Demo-Preview-und-Referenzpfade-an-die-Test-Suite-anbinden.md`
  - `development/XTend-Scaffold-Extension-Points.md`
  - `development/EPIC-04-XTend-Templating-Rendering-und-Framework-Erweiterung.md`
  - `development/EPIC-05-XTendRMT-Bridge-und-Natives-Routing.md`
  - `development/ADR-XTendRMT-First-Class-Fusion.md`
  - `xtend-builder/extensions/component-extension-points.js`
  - `xtend-builder/templates/component/source.template.js`
  - `xtend-builder/templates/component/types.template.d.ts`
  - `xtend-builder/templates/component/manifest-plan.template.json`
  - `xtend-builder/generators/component-files.js`
  - `tests/references/reference_path_suite.js`

## Ziel

`WP-E03-11` bereitet die Erweiterungslinie fuer Epic 04 und Epic 05 vor. Das Paket macht Root-Lifecycle-Hooks, Template-/Rendering-Anschluss und XTendRMT Bridge-Punkte als Dry-Run-Contracts sichtbar, ohne produktive Runtime-Logik in `XTend-Scaffold` einzubauen.

## Umgesetzte Artefakte

- Extension-Modul mit Schema `xtend.scaffold.component-extension-points.v1`
- Root-Lifecycle-Schema `xtend.scaffold.root-lifecycle.v1`
- Template-Extension-Schema `xtend.scaffold.template-extension.v1`
- Rendering-Extension-Schema `xtend.scaffold.rendering-extension.v1`
- CLI-Command:
  - `node xtend-builder/scaffold.js extensions --tag x-example --profile display --feature state --json`
- NPM-Script:
  - `npm run scaffold:extensions`
- `component-files` Ausgabe mit `wiring.extensions`
- `xtendScaffoldExtensionPoints` als statischer Getter im Component-Template
- No-op Root-Lifecycle-Hooks im Component-Template
- `extensions` Block im Manifest-Patch-Plan
- Extension-Interfaces im `.d.ts` Template
- Dokumentation unter `development/XTend-Scaffold-Extension-Points.md` und `xtend-builder/extensions/README.md`
- Reference-Gates fuer Config, CLI, Generatorausgabe, Template-Ausgabe und Workpackage-Status

## Extension-Contract

| Bereich | Contract |
|---------|----------|
| Schema | `xtend.scaffold.component-extension-points.v1` |
| Modus | `dry-run-extension-contract` |
| Status | `prepared-extension-points-only` |
| Static Getter | `xtendScaffoldExtensionPoints` |
| Manifest-Key | `extensions` |
| Template-Adapter | `xtend.template` |
| Component-Adapter | `xtend.component` |
| Router-Adapter | `xtend.xrouter` |

Die Hook-Namen sind stabil, bleiben aber leer:

- `beforeHydrate`
- `afterHydrate`
- `beforeRender`
- `afterRender`
- `onDisconnect`

## Grenze

`WP-E03-11` implementiert keine Templating-Engine, keine Rendering-Runtime, keine XTendRMT Bridge, keine XRouter-Registrierung und kein `.rmt` Parsing. Alle produktiven Runtime-Entscheidungen bleiben Epic 04 und Epic 05 vorbehalten.

## Verifikation

- `node --check xtend-builder/extensions/component-extension-points.js`
- `node --check xtend-builder/generators/component-files.js`
- `node --check xtend-builder/lib/cli.js`
- `node --check xtend-builder/workflows/developer-workflow.js`
- `node xtend-builder/scaffold.js extensions --tag x-example --profile display --feature state --json`
- `node xtend-builder/scaffold.js component-files --tag x-example --profile routing --feature state --json`
- `npm run scaffold:extensions`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-11` ist abgeschlossen. `XTend-Scaffold` besitzt nun einen maschinenlesbaren Extension-Point-Contract fuer Root-Lifecycle, Templating, Rendering und XTendRMT Bridge-Punkte. `WP-E03-12` kann Epic 03 gegen KPI, Testpflicht und Erweiterbarkeit final abnehmen.
