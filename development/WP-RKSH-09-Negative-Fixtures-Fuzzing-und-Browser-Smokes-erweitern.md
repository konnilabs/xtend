# RKSH-WP-09 - Negative Fixtures, Fuzzing und Browser-Smokes erweitern

- Status: `completed`
- Prioritaet: `P1`
- Schema: `xtend.rmt.kernel-security-regression.v1`
- Fixture-Schema: `xtend.rmt.kernel-security-regression-fixture.v1`
- Browser-Smoke-Schema: `xtend.rmt.kernel-security-regression-browser-smoke.v1`
- Lokales Gate: `node scripts/run_xtend_tests.js rmt-kernel-security-regression --json`
- Package Script: `npm run test:rmt-kernel-security-regression`

## Ziel

WP-09 erweitert die bisher isolierten Trust-, Panic- und Recovery-Gates um eine zusammenhaengende negative Regressionsebene. Der Kernel wird mit bekannten boesartigen Outputs konfrontiert und muss belegen, dass kein Runtime-Sink die Trust Authority umgeht.

## Umgesetzte Artefakte

- `development/XTendRMT-Kernel-Security-Regression-Contract.md`
- `tools/rmt-language/kernel-security-regression.js`
- `tools/rmt-language/kernel-security-regression.d.ts`
- `tests/rmt-language/fixtures/kernel-security-regression-fixtures.json`
- `tests/rmt-language/rmt_kernel_security_regression_suite.js`
- `tests/browser/fixtures/rmt-kernel-security-regression-smoke.html`

## Umgesetzte Aufgaben

- Fixtures fuer boesartige HTML-Fragmente, Attribute, URLs und Properties angelegt.
- Wiederholte blockierte Commits gegen die Panic-Schwelle getestet.
- Browsernahe Smokes fuer Slot-, Prerender- und Error-Fallback-Pfade gebaut.
- Artifact-Level-Regressionsreport mit `unsafeCommitCount`, Panic-State und Recovery-Status modelliert.
- Package-Export, Type-Export-Katalog, Runner und Backlog verdrahtet.

## Akzeptanz

- Tests schlagen fehl, sobald ein Runtime-Sink ohne Trust Verdict committed.
- Panic- und Recovery-Pfade sind lokal reproduzierbar.
- Fixtures laufen gegen Core-, Runtime- und Browser-Runtime-Artefakte.
- Der Report redaktiert rohe Script-Payloads und markiert unsichere Commits als Gate-Fehler.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-kernel-security-regression --json
```
