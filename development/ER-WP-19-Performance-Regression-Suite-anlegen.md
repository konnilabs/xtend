# ER-WP-19 - Performance Regression Suite anlegen

- Status: `completed`
- Datum: 6. Mai 2026
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Contract: `xtend.enterprise.er-wp-19.performance-regression-suite.v1`
- Gate Contract: `xtend.performance.regression-gate.v1`
- Baseline Contract: `xtend.performance.regression-baseline.v1`
- Report Schema: `xtend.performance.regression-report.v1`
- Bezug:
  - `development/XTend-Performance-Budget-Matrix.md`
  - `development/XTend-Performance-Messpunkte-und-Snapshots.md`
  - `development/XTend-Performance-Regression-Gate.md`
  - `tests/performance/performance_regression_suite.js`
  - `tests/performance/baselines/local-performance-baseline.json`
  - `development/docs-evidence/root/performance-regression.md`

## Ziel

`ER-WP-19` macht die Performance-Budget-Matrix lokal gatebar. Budgetverletzungen duerfen nicht erst in manuellen Reviews sichtbar werden, sondern muessen als strukturierter Testreport erscheinen.

## Umgesetzte Artefakte

| Artefakt | Status | Beschreibung |
|----------|--------|--------------|
| `tests/performance/performance_regression_suite.js` | completed | wertet Fabric Performance Measurements gegen Budget-Stufen aus |
| `tests/performance/baselines/local-performance-baseline.json` | completed | deterministische lokale Baseline fuer Kernphasen |
| `tests/performance/README.md` | completed | lokaler Teststandard fuer Performance Regression |
| `development/XTend-Performance-Regression-Gate.md` | completed | Contract und Reportstruktur dokumentiert |
| `development/docs-evidence/root/performance-regression.md` | completed | Entwicklerdokumentation ergaenzt |
| `scripts/run_xtend_tests.js` | completed | Suite `performance-regression` angebunden |
| `package.json` | completed | Script `npm run test:performance` und Package-Metadaten ergaenzt |

## Gate-Verhalten

Die Suite nutzt:

- `xtend.performance.measurement.v1`
- `xtend.performance.regression-baseline.v1`
- `xtend.performance.regression-report.v1`
- Fabric `createTelemetrySnapshot`

Statuslogik:

| Status | Wirkung |
|--------|---------|
| `pass` | bleibt still |
| `warn` | bleibt im Report sichtbar, blockiert lokal nicht |
| `fail` | erzeugt einen harten Suite-Fail |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| JSON-Report vorhanden | erfuellt |
| lokale deterministische Baseline vorhanden | erfuellt |
| Budgetverletzungen erscheinen im Report | erfuellt |
| harte Failures schlagen die Suite fehl | erfuellt |
| Warnungen bleiben sichtbar, aber nicht blockierend | erfuellt |
| CI-Anschluss ueber Runner vorbereitet | erfuellt |

## Verifikation

```bash
node --check tests/performance/performance_regression_suite.js
node scripts/run_xtend_tests.js performance-regression --json
npm run test:performance
node scripts/run_xtend_tests.js references --json
npm test -- --json
```

## Handoff

| Folgepaket | Startstatus nach ER-WP-19 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-20` | completed | haertet Lazy/Idle/Visible Hydration Policies gegen harte Performance-Fails und Lane-Budgets |
| `ER-WP-21` | completed | Performance-Doku fuer Komponentenautoren stuetzt sich auf dieselbe Budget-, Hydration- und Report-Sprache |
| `ER-WP-37` | completed | Performance-Teil ist vorbereitet und wird im Full-Release-Gate der Gate-Matrix gefuehrt |
| `ER-WP-38` | completed | Release Checklist verankert Performance-Regression als Full-Release-Pflicht |
| `ER-WP-39` | completed | Enterprise Adoption Guide erklaert Performance-Regression fuer Teams |
| `ER-WP-40` | completed | Docs-App RMT Pilot nutzt Performance-Regression als Betriebsbeispiel |

## Ergebnis

`ER-WP-19` ist abgeschlossen. XTend besitzt jetzt ein lokales Performance Regression Gate, das deterministische Baselines auswertet, Warnungen sichtbar macht und harte Budgetverletzungen im Testreport blockierend ausgibt.
