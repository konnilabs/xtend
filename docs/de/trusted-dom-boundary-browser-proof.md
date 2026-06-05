# Trusted DOM Boundary Browser Proof

Browsernaher Nachweis fuer Parsedown HTML, RMT `htmlFragment` und strukturierte DOM-Descriptoren.

## Contract

- Schema: `xtend.epic13.trusted-dom-boundary.v1`
- Fixture Schema: `xtend.epic13.trusted-dom-boundary-browser-smoke.v1`
- Sanitizer: `xtend.security.trusted-dom-sanitizer.v1`
- Boundary: `xtend.security.sanitizing-boundary.v1`
- Local Gate: `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`
- Fixture: `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`

## Proof

`parsedownHtml` und RMT `htmlFragment` duerfen nur ueber einen Host-owned Trusted-DOM-Sink geschrieben werden. Der RMT-Kernel bleibt parser- und sanitizer-neutral; er importiert weder Parsedown noch XTend-Host-Typen. Strukturierte RMT DOM-Descriptoren bleiben der bevorzugte Pfad, wenn kein HTML-Fragment notwendig ist.

Geblockte Vektoren:

- `script`
- `inline-event-handler`
- `javascript-url`
- `srcdoc`

## Pruefpfad

```bash
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
```

Der Gate prueft `catalog/epic13-trusted-dom-boundary.js`, `security/trusted-dom-policy.js`, `docs/utils/pageloader.js`, `docs/index.php`, das RMT-Dokument `docs/xtendrmt-parsedown-docs.rmt` und die Browser-Fixture.

## Handoff

`WP-E13-11` ist abgeschlossen. `WP-E13-13` nutzt diesen Proof im RC1-Gate-Matrix-Handoff, und `NFM-WP-13` referenziert ihn im Native-First Audit Evidence Pack.
