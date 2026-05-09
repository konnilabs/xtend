# WP-E13-11 - Trusted DOM, Parsedown und RMT HTML Boundary browsernah pruefen

- Status: `completed`
- Contract: `xtend.epic13.wp11.trusted-dom-boundary.v1`
- Ziel-Contract: `xtend.epic13.trusted-dom-boundary.v1`
- Gate: `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`

## Ergebnis

Das Paket haertet die Trusted-DOM-Boundary fuer Docs/Parsedown und RMT HTML-Fragmente. Parsedown bleibt Parser-Host, der Docs-Host besitzt den Sanitizing-Sink, und RMT bleibt Scheduler/Template-Orchestrator ohne Sanitizer-Import.

## Umsetzung

- `security/trusted-dom-policy.js` fuehrt `xtend.security.trusted-dom-sanitizer.v1` ein.
- `docs/utils/pageloader.js` sanitized Parsedown HTML vor dem `innerHTML` Sink und markiert den Sink mit `data-rmt-trusted-dom-proof`.
- `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html` enthaelt bewusst feindliche Parsedown/RMT-HTML-Payloads fuer Script-, Handler-, URL- und `srcdoc`-Pruefung.
- `catalog/epic13-trusted-dom-boundary.js` beschreibt Contract, Gate, Fixture, Source-Gates und Handoff.
- `tests/platform/epic13_trusted_dom_boundary_suite.js` prueft Policy, Pageloader, Fixture, Package, Scaffold, Docs und Steering.

## Akzeptanz

- `parsedownHtml` und RMT `htmlFragment` verlangen Sanitizing.
- `dom_descriptor` bleibt der bevorzugte strukturierte Template-Pfad.
- Event-Handler-, Script- und URL-Injektion wird vor dem Docs-Content-Sink entfernt.
- Der lokale Gate benoetigt weder externen Browser noch Netzwerk.
- Publish bleibt durch `private-until-release-owner-acceptance` geblockt.

## Handoff

`WP-E13-12` ist abgeschlossen. `WP-E13-13` ist ready. Naechste Entscheidung: `rc1-gate-matrix-ci-handoff`.
