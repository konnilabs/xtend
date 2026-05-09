# ER-WP-40 Docs-App mit RMT Parsedown Scheduling pilotieren

- Status: `completed`
- Datum: 7. Mai 2026
- Contract: `xtend.enterprise.er-wp-40.docs-rmt-parsedown-pilot.v1`
- Pilot Contract: `xtend.docs.parsedown-rmt-pilot.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`
- RMT-Dokument: `docs/xtendrmt-parsedown-docs.rmt`

## Ziel

ER-WP-40 finalisiert den Enterprise-Reife-Paketlauf mit einem realen Docs-App-Pilot. Nach dem Shell-first-Refactor bleibt Parsedown der Parser-Host, aber die sichtbare App Shell wird aus `docs.app.shell` im RMT-Dokument erzeugt. XTendRMT beschreibt nun Shell, Search-UI, Scheduling, Routen, Templates, Diagnostics, Rich-Content-Slots und Host-Boundaries fuer diesen Fluss als pruefbares RMT-Dokument.

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `docs/xtendrmt-parsedown-docs.rmt` | RMT-Pilot-Dokument fuer `docs.app.shell`, `docs.header.search`, Docs-Routen, Parsedown-Templates, Rich-Content-Slots, Schedules und Adapter |
| `docs/index.php` | spiegelt `window.xtendDocsRmtDocument`, `window.xtendDocsRmtPilot` und `window.xtendDocsPagesMeta` fuer den aktiven Docs-Host |
| `docs/utils/pageloader.js` | rendert RMT-`dom_descriptor`-Templates Shell-first und setzt Parsedown HTML nur in den Content-Slot |
| `docs/xtendrmt-parsedown-scheduling.md` | aktualisierte Entwicklerdoku fuer den ER-WP-40-Pilot |
| `tests/rmt/docs_rmt_pilot_suite.js` | lokales Gate fuer RMT-Normalisierung, Runtime-Registry und Docs-App-Anschluss |
| `package.json` | `xtend.docsRmtPilot`, `npm run test:docs-rmt-pilot` und Release-Gate-Anschluss |

## Architekturgrenzen

| Grenze | Entscheidung |
|--------|--------------|
| Parsedown | bleibt Parser-Host in `docs/index.php` / `docs/utils/parsedown.php` |
| RMT Kernel | sieht nur Shell-Records, Schedules, Templates und Diagnostics |
| Trusted DOM | Parsedown HTML bleibt `parsedownHtml` und braucht `xtend.security.sanitizing-boundary.v1` |
| XRouter | produktive Routen bleiben im bestehenden Docs-Host; RMT-Pilot beschreibt die Route Records additiv |
| XTend UI | `xtend-doc-page` bleibt die sichtbare Custom-Element-Oberflaeche |
| Rich Content | `docs.rich-content`, `docs.media.lazy` und `xplayerTutorial` sind als future-ready Slots vorbereitet |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| RMT-Pilot-Dokument fuer Docs-App ist vorhanden | `done` |
| RMT-App-Shell wird Shell-first aus `docs.app.shell` gerendert | `done` |
| Header-Suche wird aus `docs.header.search` gerendert | `done` |
| Docs-App stellt per-page RMT-Metadaten bereit | `done` |
| PageLoader markiert gerenderte Seiten mit RMT-Boundary-, Shell- und Slot-Attributen | `done` |
| Rich-HTML- und XPlayer-Tutorial-Slots sind als Schedules vorbereitet | `done` |
| Pilot laeuft durch `createRmtFormat().normalizeDocument(...)` und Runtime-Registry | `done` |
| Parsedown bleibt aus dem RMT Kernel herausgehalten | `done` |
| Trusted-DOM-Boundary ist fuer Parsedown HTML sichtbar | `done` |
| Roadmap setzt ER-WP-40 auf `completed` und den Paketlauf auf abgeschlossen | `done` |

## Gates

```bash
node scripts/run_xtend_tests.js docs-rmt-pilot --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js rmt-compatibility --json
npm test
```

## Abschluss

`ER-WP-40` ist abgeschlossen. Damit ist der Enterprise-Reife-Paketlauf `ER-WP-01` bis `ER-WP-40` fachlich finalisiert. Der naechste sinnvolle Schritt ist kein weiteres ER-Workpackage, sondern ein neuer Produktreife-Checkpoint mit Entscheidung, ob XTend in eine `1.0.0`-Release-Vorbereitung, eine Component-Catalog-Vervollstaendigung oder einen XTendRMT-Upstream-Ausbau uebergehen soll.
