# Trusted DOM Boundary Browser Proof

Browser-near proof for Parsedown HTML, RMT `htmlFragment` and structured DOM descriptors.

## Contract

- Schema: `xtend.epic13.trusted-dom-boundary.v1`
- Fixture Schema: `xtend.epic13.trusted-dom-boundary-browser-smoke.v1`
- Sanitizer: `xtend.security.trusted-dom-sanitizer.v1`
- Boundary: `xtend.security.sanitizing-boundary.v1`
- Local Gate: `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`
- Fixture: `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`

## Proof

`parsedownHtml` and RMT `htmlFragment` may only write through a host-owned Trusted-DOM sink. The RMT kernel stays parser- and sanitizer-neutral; it imports neither Parsedown nor XTend host types. Structured RMT DOM descriptors remain the preferred path when no HTML fragment is required.

Blocked vectors:

- `script`
- `inline-event-handler`
- `javascript-url`
- `srcdoc`

## Verification

```bash
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
```

The gate checks `catalog/epic13-trusted-dom-boundary.js`, `security/trusted-dom-policy.js`, `docs/utils/pageloader.js`, `docs/index.php`, the RMT document `docs/xtendrmt-parsedown-docs.rmt` and the browser fixture.

## Handoff

`WP-E13-11` is completed. `WP-E13-13` uses this proof in the RC1 gate matrix handoff, and `NFM-WP-13` references it in the Native-First Audit Evidence Pack. `NFM-WP-18` uses the same boundary for renderer, DOM descriptor and unsafe sink refusal proofs.
