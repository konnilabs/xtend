# PROD Browser CSP Smokes

- Contract: `xtend.epic13.prod-browser-csp-smoke.v1`
- Fixture Contract: `xtend.epic13.prod-browser-csp-smoke-fixture.v1`
- Report: `xtend.epic13.prod-browser-csp-smoke-report.v1`
- Workpackage: `WP-E13-07`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-prod-browser-csp-smoke --json`
- Dev Server: `npm run dev:local:csp`
- Fixture: `tests/browser/fixtures/epic13-prod-csp-smoke.html`
- Publish Boundary: `private-until-release-owner-acceptance`

## Zweck

Der PROD Browser CSP Smoke prueft den XTend-Loader unter einer PROD-aehnlichen Content Security Policy, ohne externe Netzwerke oder CDN-Fallbacks zu nutzen.

Die Fixture nutzt:

- eine `nonce` fuer alle Inline- und Loader-Skripte
- ein same-origin Manifest unter `/tests/browser/fixtures/components/manifest.json`
- den root-lokalen Loader `/xtend-loader.js`
- keine `importmap`
- keine `https://cdn.ccs-networks.de/xtend` Referenz
- XState und XRouter als minimale Hydration-Linie

## Lokale Nutzung

```bash
npm run test:epic13-prod-browser-csp-smoke
npm run dev:local:csp
```

Der lokale Server setzt zusaetzlich zum CSP Meta der Fixture einen `content-security-policy` Header. Damit kann die HTML-Datei sowohl statisch als auch servernah geprueft werden.

## Grenzen

Dieser Smoke ist eine PROD-nahe Boot- und Policy-Vorbereitung. Die Trusted-DOM-Pruefung fuer Parsedown, RMT HTML-Fragmente und untrusted Content liegt seit `WP-E13-11` unter [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md) und `xtend.epic13.trusted-dom-boundary.v1`.

## Handoff

`WP-E13-07` ist abgeschlossen. `WP-E13-08` hat [Visual Owner Artifacts](./visual-owner-artifacts.md) normalisiert. `WP-E13-09` ist ready und buendelt als naechstes die RMT-first App Production Readiness.
