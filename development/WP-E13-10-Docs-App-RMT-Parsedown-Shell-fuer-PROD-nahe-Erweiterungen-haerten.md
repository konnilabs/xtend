# WP-E13-10 - Docs-App RMT Parsedown Shell fuer PROD-nahe Erweiterungen haerten

- Status: `completed`
- Contract: `xtend.epic13.wp10.docs-rmt-production-hardening.v1`
- Product Contract: `xtend.epic13.docs-rmt-production-hardening.v1`
- Gate: `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json`

## Ziel

Die Docs-App wurde vom ER-WP-40-Pilot zu einem PROD-naeheren Shell-first RMT-Pfad gehaertet. Parsedown bleibt Parser-Host, waehrend RMT die Shell, Slots, Schedules und Diagnostics beschreibt.

## Umsetzung

- `catalog/epic13-docs-rmt-production-hardening.js` beschreibt Contract, Slot-Policy, Gates und Handoff.
- `tests/platform/epic13_docs_rmt_production_hardening_suite.js` prueft Catalog, Package, Scaffold, Runner, Docs-App-RMT-Dokument, PageLoader, Docs und Steering.
- `docs/xtendrmt-parsedown-docs.rmt` enthaelt `productionHardening`, Extension-Slots und Diagnostics-Slot.
- `docs/index.php` exponiert `window.xtendDocsRmtProductionHardening`.
- `docs/utils/pageloader.js` markiert Content-, Rich-, Media- und Diagnostics-Slots und erzeugt `window.xtendDocsRmtProductionLastRender`.

## Ergebnis

Die Docs-App ist weiterhin framework-agnostisch und nutzt keine CDN- oder Remote-Abhaengigkeit. RMT kann Rich HTML, XPlayer-Tutorials und Diagnostics schedulen, ohne Parsedown-Templating in den Kernel einzubetten.

## Handoff

`WP-E13-11` ist abgeschlossen. `WP-E13-12` ist abgeschlossen. `WP-E13-13` ist ready. Naechste Entscheidung: `rc1-gate-matrix-ci-handoff`.
