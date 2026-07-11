# PROD Browser CSP Smokes

PROD-nahe CSP-Smokes pruefen, dass Docs-, RMT- und Trusted-DOM-Flows ohne CDN- oder Importmap-Ausnahme lokal laufen.

- Trusted DOM Boundary: `xtend.epic13.trusted-dom-boundary.v1`
- Browser Proof: `./trusted-dom-boundary-browser-proof.md`
- Fixture: `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`

## Pruefpfad

```bash
node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke --json
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
```

Der Smoke beweist nicht Publish-Freigabe. Publish bleibt durch Release Owner und Conditional Network Evidence gesteuert.
