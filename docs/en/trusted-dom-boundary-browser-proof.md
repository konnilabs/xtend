# Trusted DOM Boundary Browser Proof

Browser-near proof for Parsedown HTML, RMT `htmlFragment`, and structured DOM descriptors.

## Contract

- Schema: `xtend.epic13.trusted-dom-boundary.v1`
- Fixture Schema: `xtend.epic13.trusted-dom-boundary-browser-smoke.v1`
- Sanitizer: `xtend.security.trusted-dom-sanitizer.v1`
- Boundary: `xtend.security.sanitizing-boundary.v1`
- Local Gate: `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`
- Fixture: `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`

## Proof

`parsedownHtml` and RMT `htmlFragment` may only be written through a host-owned Trusted DOM sink. The RMT kernel remains parser- and sanitizer-neutral.

## Check

```bash
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
```
