# XTend Epic 13 Trusted DOM Boundary Contract

- Contract: `xtend.epic13.trusted-dom-boundary.v1`
- Fixture Contract: `xtend.epic13.trusted-dom-boundary-browser-smoke.v1`
- Workpackage: `WP-E13-11`
- Status: `accepted-trusted-dom-boundary-browser-proof`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`

## Zweck

`WP-E13-11` beweist die Trust Boundary zwischen Parsedown HTML, RMT HTML-Fragmente im Modus `html_fragment` und strukturierten RMT `dom_descriptor` Templates browsernah. Der RMT Kernel bleibt dabei neutral: Er schedult Records und Diagnostics, importiert aber weder Parsedown noch Sanitizer- oder XTend-Typen.

## Boundary-Regeln

| Surface | Markup-Klasse | Sink | Pflicht |
|---------|---------------|------|---------|
| Parsedown-Ausgabe | `parsedownHtml` | Trusted-DOM-Sink im Docs Host | `xtend.security.trusted-dom-sanitizer.v1` |
| RMT `html_fragment` | `htmlFragment` | Trusted-DOM-Sink im Host Adapter | `xtend.security.sanitizing-boundary.v1` |
| RMT `dom_descriptor` | `structuredTemplate` | `replaceChildren` mit Nodes | bevorzugter Pfad |

Geblockt werden:

- `script`, `iframe`, `object`, `embed`, `link`, `meta`, `base`, `form`
- Inline-Handler wie `onclick` und `onerror`
- `javascript:`, `vbscript:`, `data:text/html` und `data:text/javascript`
- `srcdoc`

## Artefakte

- `catalog/epic13-trusted-dom-boundary.js`
- `tests/platform/epic13_trusted_dom_boundary_suite.js`
- `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`
- `security/trusted-dom-policy.js`
- `docs/utils/pageloader.js`
- `docs/en/trusted-dom-boundary-browser-proof.md`

## Gates

```bash
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
npm run test:browser
npm run test:epic13-prod-browser-csp-smoke
npm run test:epic13-docs-rmt-production-hardening
```

## Handoff

`WP-E13-11` ist abgeschlossen. `WP-E13-12` hat `xtend.epic13.rc1-migration-notes-semver.v1` abgeschlossen. `WP-E13-13` hat `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` abgeschlossen. Die naechste Handoff-Entscheidung lautet `epic13-final-rc1-handoff`.
