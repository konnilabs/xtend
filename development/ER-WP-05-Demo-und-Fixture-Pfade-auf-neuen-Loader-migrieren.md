# ER-WP-05 - Demo- und Fixture-Pfade auf neuen Loader migrieren

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-05.demo-fixture-loader-migration.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Abhaengigkeiten:
  - `ER-WP-02`
  - `ER-WP-03`
  - `ER-WP-04`

## Ziel

Default-Demos, offizielle Docs-App-Pfade und Browser-Fixtures sollen den kanonischen lokalen `xtend-loader.js` nutzen oder bewusst als nicht-loaderbasierter Spezial-Smoke klassifiziert sein. Kein Default-Gate darf auf `xtend-dev.js` oder XTend-CDN-Import-Bruecken angewiesen sein.

## Umgesetzte Aenderungen

| Bereich | Ergebnis |
|---------|----------|
| XTend Landing Demo | `index.html` bleibt kanonischer `xtend-loader.js` Default-Pfad |
| Browser Core-Smoke | `tests/browser/fixtures/core-flows-smoke.html` bleibt Loader-Fixture mit lokalem `data-manifest` |
| XTendRMT Browser-Smoke | `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html` bleibt Spezial-Fixture fuer Runtime-Bundle und produktive Adapter, aber ohne `xtend-dev.js`, XTend-CDN oder Import-Map-Bruecke |
| Docs-App | `docs/index.php` bleibt offizieller Docs-Pfad mit lokalem `/xtend-loader.js`, loader-policy-kompatiblem `/components/manifest.json` und `window.__XTendLoaderBootPromise` fuer Boot-Sequencing |
| Root-HTML-Demos | Root-HTML-Demos sind dekommissioniert; `index.html` bleibt der einzige HTML-Einstieg im Repo-Root |
| RMT Demo-Smokes | RMT-nahe HTML-Einstiege liegen ausschliesslich unter `tests/browser/fixtures/` |
| Gates | Reference- und Browser-Suites pruefen Default-Demo-/Fixture-Pfade auf `xtend-loader.js`, lokale Manifestpfade, keine XTend-CDN-Bruecke und kein `xtend-dev.js` |

## Default- und Legacy-Klassifikation

Default-Pfade mit kanonischem Loader:

- `index.html`
- `docs/index.php`
- `tests/browser/fixtures/core-flows-smoke.html`

Browser-Spezial-Fixtures ohne Loader-Pflicht, aber ohne Legacy-/CDN-Abhaengigkeit:

- `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`
- `tests/browser/fixtures/custom-elements-smoke.html`
- `tests/browser/fixtures/rmt-first-demo-app-smoke.html`
- `tests/browser/fixtures/rmt-lifecycle-demo-smoke.html`
- `tests/browser/fixtures/rmt-surface-workbench-smoke.html`

Root-Policy:

- `index.html` bleibt der einzige HTML-Einstieg im Repo-Root.
- Historische manuelle Root-Demos wurden entfernt.
- Neue HTML-Smokes muessen unter `tests/browser/fixtures/` liegen.

## Validierung

```bash
rg "https://cdn.ccs-networks.de/xtend" index.html docs/index.php tests/browser/fixtures
rg "xtend-dev.js" index.html docs/index.php tests/browser/fixtures
node --check tests/references/reference_path_suite.js
node --check tests/browser/browser_smoke_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js browser --json
npm test
```

## Ergebnis

`ER-WP-05` ist abgeschlossen. Die Default-Demo- und Fixture-Pfade sind auf den kanonischen lokalen Loader beziehungsweise auf explizit klassifizierte Spezial-Smokes festgelegt. `ER-WP-06` ist damit fachlich startbereit, weil die Package-Export- und Release-Strategie nicht mehr auf eine offene Loader-/Demo-Migration warten muss.
