# WP-E13-07 - PROD-nahe Browser-, Local-Server- und CSP-Smokes vorbereiten

- Status: `completed`
- Workpackage Contract: `xtend.epic13.wp07.prod-browser-csp-smoke.v1`
- Epic Contract: `xtend.epic13.prod-browser-csp-smoke.v1`
- Fixture Contract: `xtend.epic13.prod-browser-csp-smoke-fixture.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke --json`
- Package Script: `npm run test:epic13-prod-browser-csp-smoke`
- Publish Boundary: `private-until-release-owner-acceptance`

## Ziel

XTend braucht vor RC1 einen reproduzierbaren, PROD-nahen Smoke, der Loader, Manifest, CSP, Nonce, same-origin Module, XState und XRouter zusammen in einer Shell-first Browser-Fixture vorbereitet. Der lokale Gate bleibt dabei deterministisch, netzwerkfrei und ohne externen Browser-Zwang.

## Umgesetzt

- `catalog/epic13-prod-browser-csp-smoke.js` definiert Contract, Validator und Report.
- `tests/browser/fixtures/epic13-prod-csp-smoke.html` nutzt `xtend-loader.js` mit Nonce, `data-manifest="/tests/browser/fixtures/components/manifest.json"` und `data-module-cache-bust="epic13-prod-csp-smoke"`.
- `scripts/serve_xtend_dev.js` unterstuetzt `--prod-csp`, `--csp <policy>` und gibt den Header `content-security-policy` aus.
- `tests/platform/epic13_prod_browser_csp_smoke_suite.js` prueft Fixture, Contract, Package, Scaffold, Runner, Docs, Registry und den lokalen Server-Header.
- `docs/prod-browser-csp-smokes.md` beschreibt den Betriebspfad.

## Ergebnis

Der lokale Smoke beweist, dass XTend ohne CDN, ohne Importmap und ohne externe Manifest-URLs unter einer PROD-aehnlichen Script-Policy booten kann. `style-src 'unsafe-inline'` bleibt fuer bestehende Shadow-DOM-Styles zulaessig; Trusted-DOM- und Sanitizing-Hardening folgen in `WP-E13-11`.

## Handoff

`WP-E13-08` ist abgeschlossen. Das naechste Paket `WP-E13-09` buendelt RMT-first App Production Readiness.
