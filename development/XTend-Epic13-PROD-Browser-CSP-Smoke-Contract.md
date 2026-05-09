# XTend Epic 13 PROD Browser CSP Smoke Contract

- Status: Accepted
- Workpackage: `WP-E13-07`
- Contract: `xtend.epic13.prod-browser-csp-smoke.v1`
- Fixture Contract: `xtend.epic13.prod-browser-csp-smoke-fixture.v1`
- Report: `xtend.epic13.prod-browser-csp-smoke-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke --json`
- Package Script: `npm run test:epic13-prod-browser-csp-smoke`
- Dev Server Script: `npm run dev:local:csp`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

`WP-E13-07` bereitet einen reproduzierbaren PROD-nahen Browser-/Server-Smoke vor, ohne den lokalen Default-Gate von externen Browser-Treibern, CDN-Zugriffen oder Netzwerkzugriffen abhaengig zu machen.

Der Smoke prueft nicht die komplette Trusted-DOM-Sicherheitslinie. Diese bleibt bewusst in `WP-E13-11`. Der Scope von `WP-E13-07` ist:

- Root-lokaler Loader `xtend-loader.js`
- same-origin Manifest `tests/browser/fixtures/components/manifest.json`
- Nonce-basierte Skriptfreigabe
- CSP Meta im Fixture und CSP Header im lokalen Server
- Loader Boot Promise unter CSP
- XRouter/XState-Hydration in einer Shell-first Fixture
- kein CDN, keine Importmap, keine externen Modulpfade

Der lokale Gate-Modus ist `static-fixture-plus-local-server-header-probe`: Die Suite prueft das Fixture statisch und startet den lokalen Server nur zur Header-Probe.

## CSP Policy

Die PROD-aehnliche Policy ist als `PROD_LIKE_CSP_POLICY` in `scripts/serve_xtend_dev.js` hinterlegt:

```text
default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'nonce-xtend-e13-prod-csp-smoke'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'
```

`style-src 'unsafe-inline'` ist fuer diesen Smoke bewusst erlaubt, weil bestehende XTend Components Shadow-DOM-Styles lokal injizieren. Eine strengere Style-Nonce- oder Constructable-Stylesheet-Linie gehoert in ein spaeteres Security-Hardening, nicht in den PROD-Smoke-Contract.

## Artefakte

| Artefakt | Zweck |
|----------|-------|
| `catalog/epic13-prod-browser-csp-smoke.js` | Maschinenlesbarer Contract, Validator und Report Factory |
| `tests/platform/epic13_prod_browser_csp_smoke_suite.js` | Lokaler Gate fuer Contract, Docs, Fixture und Server Header |
| `tests/browser/fixtures/epic13-prod-csp-smoke.html` | PROD-nahe Browser-Fixture |
| `development/WP-E13-07-PROD-nahe-Browser-Local-Server-und-CSP-Smokes-vorbereiten.md` | Workpackage-Abschluss |
| `docs/prod-browser-csp-smokes.md` | Entwicklerdokumentation |

## Handoff

`WP-E13-07` ist abgeschlossen. `WP-E13-08` hat das visuelle Screenshot-/Pixel-Artefakt fuer Release Owner normalisiert. `WP-E13-09` ist ready und buendelt als naechsten Schritt RMT-first App Production Readiness.
