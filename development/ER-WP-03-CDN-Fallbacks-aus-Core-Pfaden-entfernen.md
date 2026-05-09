# ER-WP-03 - CDN-Fallbacks aus Core-Pfaden entfernen

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-03.cdn-fallback-removal.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- Abhaengigkeiten:
  - `ER-WP-01`
  - `ER-WP-02`
  - `ER-WP-04`

## Ziel

XTend darf in Default-Core-Pfaden, Browser-Smokes und lokalen Entwicklungsflaechen keine XTend-CDN-Fallbacks mehr benoetigen. `xtend-loader.js`, `api.js`, `components/manifest.json`, Core-Komponenten und Browser-Fixtures muessen repo-lokal funktionieren.

## Umgesetzte Aenderungen

| Bereich | Ergebnis |
|---------|----------|
| API | `api.js` importiert `xstate` lokal ueber `./components/xstate.js` und laedt die lokale `x-theme` Standard-Implementierung statt CDN-Fallback |
| Komponenten | Core-Komponenten importieren `xstate` lokal ueber `./xstate.js` |
| Manifest | `components/manifest.json` verwendet nur repo-lokale relative Komponentenpfade |
| Writer | `x-writer` laedt `components/turndown.js` lokal statt externer XTend-CDN-URL |
| Browser-Smokes | Core- und XTendRMT-Fixtures benoetigen keine Import-Map fuer CDN-Umschreibung mehr |
| Docs-App | `docs/index.php` nutzt lokale XTend-Assets, lokalen Loader und lokales Manifest |
| Manuelle Demos | `xstatetest.html`, `hero.html`, `masonry.html`, `xplayerdemo.html` und `xmasonry.html` nutzen `xtend-loader.js` und lokale Assets |
| Doku | `docs/manifest.md` und `docs/xtend-loader.md` dokumentieren repo-lokale Manifest- und Loader-Pfade |
| Gates | Core-, Browser- und Reference-Suites pruefen lokale Manifestpfade und CDN-freie Default-Core-Pfade |

## Lokale Default-Regel

Diese Pfade duerfen keinen `https://cdn.ccs-networks.de/xtend` Default enthalten:

- `api.js`
- `components/*.js`
- `components/manifest.json`
- `tests/browser/fixtures/*.html`
- `index.html`

Konkrete Referenzpfade fuer die Browser-Smokes:

- `tests/browser/fixtures/core-flows-smoke.html`
- `tests/browser/fixtures/rmt-xrouter-xtend-smoke.html`

Historische und manuelle Demo-Pfade duerfen weiterhin ausserhalb des Default-Gates bleiben, muessen aber lokale XTend-Pfade bevorzugen oder als Legacy bewusst klassifiziert werden.

## Validierung

```bash
rg "https://cdn.ccs-networks.de/xtend" api.js components tests/browser/fixtures index.html
node --check api.js
node --check xtend-loader.js
node --check tests/browser/browser_smoke_suite.js
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js browser --json
npm test
```

## Ergebnis

`ER-WP-03` ist abgeschlossen. Der XTend-Core ist fuer Default-Demos, lokale Entwicklung, Browser-Smokes und API-/Komponentenpfade vom XTend-CDN entkoppelt. `ER-WP-05` ist fachlich nicht mehr durch CDN-Fallbacks blockiert; `ER-WP-28` kann spaeter die technische Import-Verweigerung fuer unsichere Manifest- und Dynamic-Import-Pfade haerten.
