# XTend Test Reporting und CI-Vorbereitung

- Status: Verbindlich fuer Epic 02 ab `WP-E02-12`, CI-aktiv ab `ER-WP-36`, Gate-Matrix ab `ER-WP-37`
- Bezug:
  - `scripts/run_xtend_tests.js`
  - `tests/utils/reporting.js`
  - `package.json`
  - `tests/README.md`
  - `.github/workflows/xtend-default-gates.yml`
  - `development/XTend-CI-Default-Gates-Workflow.md`
  - `development/XTend-CI-Gate-Matrix.md`
  - `xtend-builder/workflows/developer-workflow.js`
  - `xtend-builder/typing/component-types.js`
  - `xtend-builder/preview/component-preview.js`
  - `xtend-builder/extensions/component-extension-points.js`
  - `tests/rmt/rmt_compatibility_suite.js`

## Zweck

Dieses Dokument beschreibt die lokalen Befehle, das Runner-Reporting und den CI-Anschluss fuer die XTend-Test-Suite. Seit `ER-WP-36` gibt es einen aktiven GitHub-Actions-Workflow fuer die Default-Gates. Die lokalen Befehle bleiben Source-of-Truth; CI fuehrt sie reproduzierbar aus und laedt den JSON-Report als Artifact hoch.

## Lokale Standardbefehle

Vollstaendiger Default-Lauf:

```bash
node scripts/run_xtend_tests.js
```

Einzelne Suites:

```bash
node scripts/run_xtend_tests.js core
node scripts/run_xtend_tests.js architecture
node scripts/run_xtend_tests.js components
node scripts/run_xtend_tests.js a11y-hydration
node scripts/run_xtend_tests.js references
node scripts/run_xtend_tests.js rmt-compatibility
node scripts/run_xtend_tests.js browser
```

Liste der verfuegbaren Suites:

```bash
node scripts/run_xtend_tests.js --list
```

Kompatibler Legacy-Entry-Point:

```bash
node scripts/verify_xtend_core_contracts.js
```

## NPM-Scripts

`package.json` stellt dieselben Befehle als kurze Skripte bereit:

```bash
npm test
npm run test:core
npm run test:architecture
npm run test:components
npm run test:a11y
npm run test:references
npm run test:rmt-compatibility
npm run test:browser
npm run test:report
```

Es werden keine externen Dependencies eingefuehrt.

## XTend-Scaffold Verify-Plan

Seit Epic 03 / `WP-E03-08` stellt `XTend-Scaffold` einen lokalen Verify-Plan bereit:

```bash
node xtend-builder/scaffold.js verify --json
npm run scaffold:verify
```

Der Plan nutzt Schema `xtend.scaffold.verify-plan.v1` und verweist auf:

- `node scripts/run_xtend_tests.js references --json`
- `node scripts/run_xtend_tests.js rmt-compatibility --json`
- `node scripts/run_xtend_tests.js components a11y-hydration`
- `npm test`
- `npm run test:report`

Der Verify-Plan fuehrt die Tests nicht selbst aus. Er macht fuer Menschen und AI-Agenten sichtbar, welches Gate nach Scaffold-Aenderungen mindestens zu laufen hat und welcher Vollsuite-Befehl vor einem Handoff gilt.

## XTend-Scaffold Typing-Plan

Seit Epic 03 / `WP-E03-09` stellt `XTend-Scaffold` einen lokalen Typing-Plan bereit:

```bash
node xtend-builder/scaffold.js typing --tag x-example --profile display --feature state --json
npm run scaffold:typing
```

Der Plan nutzt Schema `xtend.scaffold.component-typing.v1`, bleibt `types-only-no-runtime-imports` und macht den vorbereiteten XTendRMT-Anschluss ueber `xtend.scaffold.rmt-attachment.v1` sichtbar. Er implementiert keine Bridge und fuehrt keine Tests aus; die RMT-Kompatibilitaetsverifikation laeuft ab Epic 04 / `WP-E04-08` ueber `rmt-compatibility`, `references` und `npm test`.

## XTend-Scaffold Preview-Plan

Seit Epic 03 / `WP-E03-10` stellt `XTend-Scaffold` einen lokalen Preview-Plan bereit:

```bash
node xtend-builder/scaffold.js preview --tag x-example --profile display --feature state --json
npm run scaffold:preview
```

Der Plan nutzt Schema `xtend.scaffold.component-preview.v1`, bleibt repo-lokal und verweist auf `development/XTend-Dokumentations-und-Demo-Referenzpfade.md` als Registry. Er patcht die Registry nicht selbst; der Reference-Gate prueft die Konvention ueber `node scripts/run_xtend_tests.js references --json`.

## XTend-Scaffold Extension-Plan

Seit Epic 03 / `WP-E03-11` stellt `XTend-Scaffold` einen lokalen Extension-Point-Plan bereit:

```bash
node xtend-builder/scaffold.js extensions --tag x-example --profile display --feature state --json
npm run scaffold:extensions
```

Der Plan nutzt Schema `xtend.scaffold.component-extension-points.v1`, bleibt `dry-run-extension-contract` und macht Root-Lifecycle-, Template-, Rendering- und XTendRMT Bridge-Punkte sichtbar. Er implementiert keine Runtime und fuehrt keine Tests aus; die Verifikation laeuft ueber `rmt-compatibility`, `references` und `npm test`.

## Maschinenlesbares Reporting

JSON nur auf stdout:

```bash
node scripts/run_xtend_tests.js --json
```

JSON-Report in Datei:

```bash
node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-test-report.json
```

Kombination aus Teilmenge und JSON:

```bash
node scripts/run_xtend_tests.js core architecture --json
```

Das Report-Schema lautet `xtend.test.report.v1` und enthaelt:

- Gesamtstatus
- Start- und Endzeit
- Dauer in Millisekunden
- Suite-Anzahl
- Pass-/Fail-/Skip-/Warning-Zaehler
- Suite-Status mit Fehler-, Skip- und Warning-Details
- optionale eingebettete Suite-Reports, zum Beispiel `xtend.performance.regression-report.v1`

## Exit-Codes

- `0`: alle ausgewaehlten Suites bestanden
- `1`: mindestens eine Suite ist fehlgeschlagen oder ein Runner-Fehler ist aufgetreten

Unbekannte Suite-IDs oder unbekannte CLI-Optionen brechen mit Exit-Code `1` ab.

## CI Default Gates

Aktiver Workflow:

```text
.github/workflows/xtend-default-gates.yml
```

Primaerer CI-Befehl:

```bash
npm run test:report
```

Alternativ ohne NPM-Abstraktion:

```bash
node scripts/run_xtend_tests.js --report .xtend-test-results/xtend-test-report.json
```

`npm run test:report` bleibt die reportfaehige Vollsuite-Variante von `npm test`. Seit `ER-WP-37` nutzt der Workflow jedoch zwei produktive CI-Gates:

| Gate | Trigger | Command | Report | Artifact |
|------|---------|---------|--------|----------|
| `pr-fast` | `pull_request` | `npm run test:pr:report` | `.xtend-test-results/xtend-pr-gate-report.json` | `xtend-pr-gate-report-node-20` |
| `full-release` | `push`, `workflow_dispatch`, `schedule` | `npm run test:release:full:report` | `.xtend-test-results/xtend-release-gate-report.json` | `xtend-release-gate-report-node-20` |

`pr-fast` prueft Core, Architecture, Components, A11y, Catalog, Regression Priority, Fabric-Safety, References, Supply-Chain und Manifest-Policy. `full-release` fuehrt die komplette Runner-Suite inklusive Browser-, Performance-, Hydration-, Telemetry- und RMT-Kompatibilitaets-Gates aus.

Die Datei `.xtend-test-results/` ist fuer lokale und CI-generierte Reports ignoriert. Das maschinenlesbare CI-Contract-Dokument liegt unter `development/XTend-CI-Default-Gates-Workflow.md` und traegt `xtend.ci.default-gates.v1`; die Fast-/Full-Matrix liegt in `development/XTend-CI-Gate-Matrix.md` unter `xtend.ci.gate-matrix.v1`.

## Pflicht fuer neue Suites

Neue Suites muessen:

- einen stabilen Runner-Einstieg besitzen
- `id`, `label`, `ok`, `passes`, `failures` und `skips` ueber den bestehenden Suite-Kontext liefern
- im lokalen Runner und in `tests/README.md` dokumentiert werden
- mit Exit-Code `1` fehlschlagen, wenn ihr Contract verletzt ist
