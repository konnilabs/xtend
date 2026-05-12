# WP-E15-17 - Fixtures, Compiler Golden Tests, Fuzzing und Browser-Smokes erweitern

- Status: `completed`
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Workstream: `WS6`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-regression --json`

## Ergebnis

WP-E15-17 fuehrt ein eigenstaendiges vNext Regression Gate ein. Es sichert die vNext-Syntax gegen unbeabsichtigte Parser-, Compiler- und Tooling-Regressionen ab und macht die browsernahe Runtime-Probe fuer Surface, Lifecycle, Scheduler, Security und Streaming sichtbar.

## Artefakte

- Contract: `development/XTendRMT-vNext-Fixture-Regression-Gate-Contract.md`
- Modul: `tools/rmt-language/vnext-regression.js`
- Suite: `tests/rmt-language/rmt_vnext_regression_suite.js`
- Fixture Matrix: `tests/rmt-language/fixtures/vnext-fixture-matrix.json`
- Browser Smoke: `tests/browser/fixtures/rmt-vnext-reference-smoke.html`
- Package Export: `./rmt-language/vnext-regression`
- Package Script: `npm run test:rmt-vnext-regression`

## Implementierte Pruefungen

- Positive Fixture Matrix mit Core-Golden-Hashes und Domain-Counts.
- Negative Fixture Matrix fuer verbotene Sprachfeatures.
- Deterministisches Parser-Fuzzing mit Recovery- und Diagnostic-Range-Pruefung.
- Browsernahe Referenzprobe mit `window.__xtendRmtVNextSmokeResult`.
- Einbindung in den bestehenden Browser-Smoke-Harness.

## Entscheidungen

- Golden Snapshots werden als SHA-256 ueber die deterministische Core-JSON-Ausgabe gefuehrt.
- Fuzzing ist bewusst klein, deterministisch und offline, damit der Gate lokal stabil bleibt.
- Browser-Smokes sind fixture-contract-first und benoetigen lokal keinen externen Browser-Driver.
- Der bestehende Browser-Harness kann die vNext-Referenzprobe bei optionaler Browser-Automation mit ausfuehren.

## Definition of Done

- Parser, Compiler, Tooling und Runtime-Proben sind regressionsgesichert.
- Negative Fixtures verhindern unbeabsichtigte Sprachfeatures.
- Positive Fixtures decken Minimal-, Complex-, Lifecycle-, Scheduler-, Surface-, Condition-, Composition-, Event-, Security- und Streaming-Syntax ab.
- `WP-E15-18` ist fuer Docs, Reference Demo, Release Gates und Handoff entblockt.
