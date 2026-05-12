# XTend RMT vNext Enterprise MFE Fixtures Contract

- Status: `accepted`
- Workpackage: `WP-E16-11`
- Module: `tools/rmt-language/vnext-enterprise-fixtures.js`
- Suite: `tests/rmt-language/rmt_vnext_enterprise_fixtures_suite.js`
- Local Gate: `node scripts/run_xtend_tests.js rmt-vnext-enterprise-fixtures --json`

## Contract

```js
schema: "xtend.rmt.vnext-enterprise-fixture.v1"
matrixSchema: "xtend.rmt.vnext-enterprise-fixture-matrix.v1"
browserSmokeSchema: "xtend.rmt.vnext-enterprise-browser-smoke.v1"
reportSchema: "xtend.rmt.vnext-enterprise-fixture-report.v1"
```

The fixture contract turns the E16 Remote Surface stack into a deterministic
Enterprise-MFE scenario. It compiles a vNext source fixture, enriches the
enterprise surface registry with local and remote ownership facts, validates
cross-surface event protocol output, checks degradation and verifies an offline
browser smoke fixture.

## Demo Coverage

- Shell root surface owned by `shell-platform`.
- Local workspace surface owned by `sales-platform`.
- Local fallback surface `panel.checkoutFallback` owned by `checkout-platform`.
- Remote Surface `checkout.cart` owned by `checkout-platform`.
- Typed outbound event `checkout.cart.updated.v1`.
- Typed inbound event `user.session.changed.v1`.
- Version range `^3.1.0` with active remote version `3.1.4`.
- Fallback resolution to `panel.checkoutFallback`.

## Golden Artifacts

The fixture matrix stores hashes for:

- base vNext Core JSON
- remote compiler core bundle
- enterprise surface registry
- cross-surface event report
- event governance report
- degradation report

The browser smoke fixture is static HTML and must not perform network requests
or execute remote runtime code.
