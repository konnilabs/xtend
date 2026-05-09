# WP-E10-07 - `xtend-builder` TypeScript Blueprint vorbereiten

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `development/EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Backlog: `development/BACKLOG-EPIC-10-XTend-Component-Platform-TypeScript-und-RMT-First-Class-Apps.md`
- Contract: `xtend.epic10.wp07.typescript-component-blueprint.v1`
- Blueprint Contract: `xtend.scaffold.typescript-component-blueprint.v1`
- Bezug:
  - `development/XTend-TypeScript-Component-Blueprint.md`
  - `development/XTend-TypeScript-Component-Source-Strategie.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-Fabric-Component-Compatibility-v2.md`
  - `development/XTend-Component-Lifecycle-Telemetry-Contract.md`
  - `xtend-builder/blueprints/component-blueprint.contract.js`
  - `xtend-builder/generators/component-files.js`
  - `xtend-builder/templates/registry.js`
  - `tests/builder/typescript_component_blueprint_suite.js`
  - `package.json`

## Ziel

`WP-E10-07` operationalisiert die bisher vorbereitete TypeScript-, RMT-, Fabric-, A11y- und Performance-Strategie im `xtend-builder`. Neue Komponenten koennen damit vollstaendig als TypeScript-first Source-of-Truth vorbereitet werden, ohne dass der Builder bereits produktiv schreibt oder einen Compiler einfuehrt.

## Umsetzung

Erstellt wurden:

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-TypeScript-Component-Blueprint.md` | akzeptierter Blueprint-Contract fuer TypeScript-first Komponenten |
| `tests/builder/typescript_component_blueprint_suite.js` | lokaler Gate fuer Blueprint, Templates, Generator und Metadaten |
| `xtend-builder/templates/component/source.template.ts` | TypeScript Custom Element Source Template |
| `xtend-builder/templates/component/contract.template.ts` | Component Contract v2 Template |
| `xtend-builder/templates/component/rmt.template.ts` | RMT Component Metadata Template |
| `xtend-builder/templates/component/a11y.template.ts` | A11y Profile Source Template |
| `xtend-builder/templates/component/performance.template.ts` | Performance Profile Source Template |
| `xtend-builder/templates/component/fixture-data.template.ts` | typed Fixture Data Template |

Aktualisiert wurden:

- `xtend-builder/blueprints/component-blueprint.contract.js` mit den Artefakten `ts-source`, `ts-contract`, `ts-rmt`, `ts-a11y`, `ts-performance` und `ts-fixture`
- `xtend-builder/generators/component-files.js` mit Component Contract v2, RMT Metadata und TypeScript Blueprint Wiring
- `xtend-builder/templates/registry.js` mit sechs neuen Template-IDs
- `xtend-builder/scaffold.config.js` mit `typescriptComponentBlueprint`, Artefaktpfaden und Scope
- `scripts/run_xtend_tests.js` mit Suite `builder-typescript-blueprint`
- `package.json` mit `xtend.typescriptComponentBlueprint` und `test:builder-typescript-blueprint`
- Epic 10, Backlog, Reference Registry und Builder-Dokumentation

## Entscheidungen

- TypeScript Source liegt unter `src/components/<tag>/`.
- Runtime-Artefakte bleiben lokal unter `components/`.
- Der Builder bleibt `dry-run-first`.
- Das TypeScript Blueprint ist Pflicht fuer neue Komponenten, aber kein produktiver Compiler.
- RMT Metadata wird als eigenes `ts-rmt` Artefakt gefuehrt.
- A11y und Performance bekommen eigene typed Source-Artefakte.
- Fabric/Lane Ingestion und Lifecycle Telemetry werden in Source-, RMT- und Fixture-Templates sichtbar.
- Die RMT Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

## Nicht umgesetzt in diesem Paket

- keine neue P0-Komponente
- kein produktiver TypeScript Build
- kein Component Lab
- keine Migration existierender JS-Komponenten
- keine automatische Manifest-Patch-Ausfuehrung

Diese Punkte folgen in `WP-E10-08`, `WP-E10-12`, `WP-E10-14` und `WP-E10-15`.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| TypeScript Blueprint Contract liegt vor | erfuellt |
| Artefaktmatrix enthaelt TS Source, Contract, RMT, A11y, Performance und Fixture | erfuellt |
| Templates sind registriert und vorhanden | erfuellt |
| Component Files Generator rendert neue Artefakte | erfuellt |
| Component Contract v2 wird im Generator validiert | erfuellt |
| RMT Metadata bleibt kernel-entkoppelt | erfuellt |
| Package-, Scaffold- und Reference-Metadaten sind aktualisiert | erfuellt |
| lokaler Gate ist vorhanden | erfuellt: `builder-typescript-blueprint` |

## Verifikation

Durchzufuehrende lokale Gates:

```bash
node --check xtend-builder/blueprints/component-blueprint.contract.js
node --check xtend-builder/generators/component-files.js
node --check xtend-builder/templates/registry.js
node --check xtend-builder/typing/component-contract-v2.js
node --check tests/builder/typescript_component_blueprint_suite.js
node --check scripts/run_xtend_tests.js
node --check tests/references/reference_path_suite.js
node --check xtend-builder/scaffold.config.js
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"
node scripts/run_xtend_tests.js builder-typescript-blueprint --json
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js rmt-compatibility --json
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

`WP-E10-07` ist abgeschlossen. Der Builder kann neue XTend-Komponenten jetzt als TypeScript-first Contract-Buendel vorbereiten: Source, Component Contract v2, RMT Metadata, Fabric/Lane, Lifecycle Telemetry, A11y, Performance, Fixture, Runtime-Plan und Docs/Test-Begleitartefakte entstehen aus einem gemeinsamen Blueprint.
