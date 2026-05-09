# XTend-Scaffold Workflows

Dieser Bereich enthaelt ab `WP-E03-08` lokale Developer-Workflow-Contracts fuer Menschen und AI-Agenten.

## Workflow

`xtend-builder/workflows/developer-workflow.js` erzeugt eine maschinenlesbare Schrittfolge mit Schema `xtend.scaffold.developer-workflow.v1`.

Der Workflow bleibt dry-run-first:

- `component-plan` vor `component-files`
- `component-files` rendert Dateien und Wiring ohne Schreibzugriff
- `typing` macht den `.d.ts` Contract und den vorbereiteten XTendRMT-Anschluss sichtbar
- `preview` macht den Preview-Referenzplan und die lokale Reference-Gate-Anbindung sichtbar
- `extensions` macht Templating-, Rendering- und Root-Lifecycle-Extension-Punkte sichtbar
- `verify` macht die passenden Test- und Report-Kommandos sichtbar
- ab Epic 04 / `WP-E04-07` bindet `rmtCompatibility` Typing, Manifest-Plan, Preview und Extensions als gemeinsamen RMT-Kompatibilitaets-Dry-Run zusammen
- produktive Generate- oder Write-Modi bleiben spaeteren Workpackages vorbehalten

## Verify-Plan

Der Verify-Plan nutzt Schema `xtend.scaffold.verify-plan.v1`.

Er dokumentiert:

- den lokalen Test-Runner `node scripts/run_xtend_tests.js`
- die Required Suites aus `xtend-builder/scaffold.config.js`
- JSON- und Text-Ausgaben
- den Reportpfad `.xtend-test-results/xtend-test-report.json`
- den Vollsuite-Pfad `npm test`
- den RMT-Kompatibilitaets-Minimalgate `node scripts/run_xtend_tests.js rmt-compatibility --json`

## Lokale Einstiege

```bash
node xtend-builder/scaffold.js workflow --json
node xtend-builder/scaffold.js verify --json
node xtend-builder/scaffold.js typing --tag x-example --profile display --json
node xtend-builder/scaffold.js preview --tag x-example --profile display --json
node xtend-builder/scaffold.js extensions --tag x-example --profile display --json
npm run scaffold:workflow
npm run scaffold:verify
npm run scaffold:dry-run
npm run scaffold:typing
npm run scaffold:preview
npm run scaffold:extensions
```
