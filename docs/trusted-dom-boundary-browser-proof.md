# Trusted DOM Boundary Browser Proof

- Contract: `xtend.epic13.trusted-dom-boundary.v1`
- Fixture: `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`
- Gate: `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`

## Ziel

Dieser RC1-Gate beweist, dass Parsedown HTML und RMT `htmlFragment` nicht ungeprueft in die DOM-Sinks der Docs-App laufen. Die App rendert weiter Shell-first ueber RMT, aber der Host Adapter sanitized Content, bevor er in den Content-Slot geschrieben wird.

## Regeln

- `parsedownHtml` braucht `xtend.security.trusted-dom-sanitizer.v1`.
- RMT `htmlFragment` braucht `xtend.security.sanitizing-boundary.v1`.
- RMT `dom_descriptor` bleibt der bevorzugte Pfad fuer strukturierte Templates.
- Der RMT Kernel importiert keinen Sanitizer, kein PHP/Parsedown und keine XTend-Typen.

Geblockt werden `script`, `iframe`, Inline-Event-Handler, `javascript:` URLs und `srcdoc`.

## Browsernaher Smoke

Die Fixture legt absichtlich feindliche Inhalte in `window.xtendDocsPages` ab und laedt danach `docs/utils/pageloader.js`. Der Smoke prueft, dass:

- der Content-Slot `data-rmt-sanitized="true"` traegt
- `data-rmt-trusted-dom-proof="xtend.epic13.trusted-dom-boundary.v1"` gesetzt ist
- Script-Elemente, Event-Handler, JavaScript-URLs und `srcdoc` entfernt sind
- sicherer Parsedown-Text erhalten bleibt
- die Shell weiterhin Shell-first gerendert wird

## Handoff

`WP-E13-11` ist abgeschlossen. `WP-E13-12` ist mit [RC1 Migration Notes](./rc1-migration-notes.md) und `xtend.epic13.rc1-migration-notes-semver.v1` abgeschlossen. `WP-E13-13` ist ready und bereitet RC1 Gate Matrix und CI-Handoff vor.
