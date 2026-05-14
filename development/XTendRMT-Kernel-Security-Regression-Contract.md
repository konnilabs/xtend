# XTendRMT Kernel Security Regression Contract

- Schema: `xtend.rmt.kernel-security-regression.v1`
- Fixture-Schema: `xtend.rmt.kernel-security-regression-fixture.v1`
- Report-Schema: `xtend.rmt.kernel-security-regression-report.v1`
- Browser-Smoke-Schema: `xtend.rmt.kernel-security-regression-browser-smoke.v1`
- Workpackage: `RKSH-WP-09`
- Status: `completed-negative-regression-fixtures`
- Lokales Gate: `node scripts/run_xtend_tests.js rmt-kernel-security-regression --json`
- Package Script: `npm run test:rmt-kernel-security-regression`

## Zweck

Dieser Contract fixiert die negative Regressionsebene fuer den gehaerteten RMT-Kernel. Die Suite beweist, dass boesartige HTML-Fragmente, Attribute, URLs und Properties nicht still in Core-, Runtime- oder Browser-Artefakte committen koennen.

## Artefakte

- `tools/rmt-language/kernel-security-regression.js`
- `tools/rmt-language/kernel-security-regression.d.ts`
- `tests/rmt-language/fixtures/kernel-security-regression-fixtures.json`
- `tests/rmt-language/rmt_kernel_security_regression_suite.js`
- `tests/browser/fixtures/rmt-kernel-security-regression-smoke.html`

## Invarianten

- Jeder unsichere DOM-Sink erzeugt ein `xtend.rmt.kernel-trust-verdict.v1`.
- HTML-Slots, Prerender-Chunks und Error-Fallback-Markup laufen durch den Trust-Sink-Adapter.
- Wiederholte blockierte Commits erreichen reproduzierbar die Panic-Schwelle.
- Recovery-Fallbacks werden nur als sanitisiertes Markup committed.
- Reports enthalten keine rohen Script-Payloads.

## Fixture-Kategorien

- `maliciousHtmlFragments`
- `maliciousAttributes`
- `maliciousUrls`
- `maliciousProperties`
- `panicSequences`
- `browserSmokeScenarios`

## Abdeckung

Die Regression laeuft gegen:

- `xtendrmt/rmt-core.esm.js`
- `xtendrmt/rmt-runtime.esm.js`
- `xtendrmt/rmt-runtime.browser.js`

Der Browser-Smoke spiegelt die wichtigsten DOM-Pfade nach: Slot-HTML, Prerender-Chunk, Error-Fallback und Panic-Diagnostics.
