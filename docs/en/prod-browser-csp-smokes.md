# PROD Browser CSP Smokes

- Contract: `xtend.epic13.prod-browser-csp-smoke.v1`
- Fixture contract: `xtend.epic13.prod-browser-csp-smoke-fixture.v1`
- Report: `xtend.epic13.prod-browser-csp-smoke-report.v1`
- Workpackage: `WP-E13-07`
- Local gate: `node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke --json`
- Dev server: `npm run dev:local:csp`
- Fixture: `tests/browser/fixtures/epic13-prod-csp-smoke.html`
- Publish boundary: `private-until-release-owner-acceptance`

## Purpose

The PROD browser CSP smoke checks the XTend loader under a production-like Content Security Policy without using external networks or CDN fallbacks.

The fixture uses:

- a `nonce` for all inline and loader scripts
- a same-origin manifest at `/tests/browser/fixtures/components/manifest.json`
- the root-local loader `/xtend-loader.js`
- no `importmap`
- no `https://cdn.ccs-networks.de/xtend` reference
- XState and XRouter as the minimal hydration line

## Local Usage

```bash
npm run test:epic13-prod-browser-csp-smoke
npm run dev:local:csp
```

The local server adds a `content-security-policy` header in addition to the fixture CSP meta tag. This allows the HTML file to be checked both statically and close to a server environment.

## Boundaries

This smoke is a production-close boot and policy preparation. The Trusted DOM check for Parsedown, RMT HTML fragments and untrusted content has lived under [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) and `xtend.epic13.trusted-dom-boundary.v1` since `WP-E13-11`.

## Handoff

`WP-E13-07` is complete. `WP-E13-08` normalized [Visual Owner Artifacts](./visual-owner-artifacts.md). `WP-E13-09` is ready and next bundles the RMT-first app production readiness.
