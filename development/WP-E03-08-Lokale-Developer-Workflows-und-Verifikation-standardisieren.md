# WP-E03-08 - Lokale Developer-Workflows und Verifikation standardisieren

- Status: `completed`
- Datum: 4. Mai 2026
- Epic: `EPIC-03 - XTend-Scaffold Build-Environment und Developer-Workflow`
- Bezug:
  - `development/BACKLOG-EPIC-03-XTend-Scaffold-Build-Environment-und-Developer-Workflow.md`
  - `development/WP-E03-07-State-API-und-Feature-Wiring-Patterns-vorbereiten.md`
  - `development/XTend-Test-Reporting-und-CI-Vorbereitung.md`
  - `tests/README.md`
  - `package.json`
  - `xtend-builder/workflows/developer-workflow.js`
  - `xtend-builder/workflows/README.md`
  - `xtend-builder/lib/cli.js`

## Ziel

`WP-E03-08` macht die Scaffold-Nutzung lokal reproduzierbar. Menschen und AI-Agenten sollen dieselbe Dry-Run-, Review- und Verify-Schrittfolge sehen koennen, ohne produktive Dateien zu schreiben oder externe CI-Abhaengigkeiten zu brauchen.

## Umgesetzte Artefakte

- Workflow-Modul mit Schema `xtend.scaffold.developer-workflow.v1`
- Verify-Plan mit Schema `xtend.scaffold.verify-plan.v1`
- neue CLI-Kommandos:
  - `node xtend-builder/scaffold.js workflow --json`
  - `node xtend-builder/scaffold.js verify --json`
- neue NPM-Skripte:
  - `npm run scaffold:workflow`
  - `npm run scaffold:verify`
  - `npm run scaffold:dry-run`
- Workflow-Dokumentation unter `xtend-builder/workflows/README.md`
- aktualisierte Scaffold- und Test-Dokumentation
- Reference-Gates fuer Workflow-, Verify- und NPM-Script-Contracts

## Standard-Workflow

| Schritt | Befehl | Zweck |
|---------|--------|-------|
| Hilfe | `node xtend-builder/scaffold.js --help` | lokalen Einstieg pruefen |
| Config | `node xtend-builder/scaffold.js config --json` | Konfiguration und Testpflicht inspizieren |
| Plan | `node xtend-builder/scaffold.js component-plan --tag x-example --profile display --feature state --json` | Dry-Run-Artefaktplan erzeugen |
| Files | `node xtend-builder/scaffold.js component-files --tag x-example --profile display --feature state --json` | Dry-Run-Dateiinhalte plus Wiring rendern |
| Verify | `node xtend-builder/scaffold.js verify --json` | lokale Gates und Reportpfad sichtbar machen |

## Verify-Plan

Der Verify-Plan verweist auf:

- `node scripts/run_xtend_tests.js references --json`
- `node scripts/run_xtend_tests.js components a11y-hydration`
- `npm test`
- `npm run test:report`

Er ersetzt den Test-Runner nicht, sondern macht die kleinste sinnvolle Verifikation und den Vollsuite-Handoff explizit.

## Grenze

`WP-E03-08` fuehrt keinen produktiven Generate-Modus ein. `component-files` bleibt Dry-Run, und `verify` plant lokale Gates, statt Tests versteckt auszufuehren.

## Verifikation

- `node --check xtend-builder/workflows/developer-workflow.js`
- `node --check xtend-builder/lib/cli.js`
- `node xtend-builder/scaffold.js workflow --json`
- `node xtend-builder/scaffold.js verify --json`
- `npm run scaffold:workflow`
- `npm run scaffold:verify`
- `node scripts/run_xtend_tests.js references --json`
- `npm test`

## Ergebnis

`WP-E03-08` ist abgeschlossen. `XTend-Scaffold` besitzt nun dokumentierte lokale Dry-Run-, Verify- und Reporting-Pfade. `WP-E03-09` kann darauf aufbauend Typisierungsstrategie und Template-/XTendRMT-Anschluss vorbereiten.
