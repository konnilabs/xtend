# Trusted DOM Boundary Browser Proof

Browsernaher Nachweis für Parsedown HTML, RMT `htmlFragment` und strukturierte DOM-Descriptoren.

## Contract

- Schema: `xtend.epic13.trusted-dom-boundary.v1`
- Fixture Schema: `xtend.epic13.trusted-dom-boundary-browser-smoke.v1`
- Sanitizer: `xtend.security.trusted-dom-sanitizer.v1`
- Boundary: `xtend.security.sanitizing-boundary.v1`
- Local Gate: `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`
- Fixture: `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html`

## Proof

`parsedownHtml` und RMT `htmlFragment` dürfen nur über einen Host-owned Trusted-DOM-Sink geschrieben werden. Der RMT-Kernel bleibt parser- und sanitizer-neutral; er importiert weder Parsedown noch XTend-Host-Typen. Strukturierte RMT DOM-Descriptoren bleiben der bevorzugte Pfad, wenn kein HTML-Fragment notwendig ist.

Geblockte Vektoren:

- `script`
- `inline-event-handler`
- `javascript-url`
- `srcdoc`

## Prüfpfad

```bash
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
```

Der Gate prüft `catalog/epic13-trusted-dom-boundary.js`, `security/trusted-dom-policy.js`, `docs/utils/pageloader.js`, `docs/index.php`, das RMT-Dokument `docs/xtendrmt-parsedown-docs.rmt` und die Browser-Fixture.

## Verwendung im Review

Nutze diesen Browser-Proof, wenn eine Änderung Parsedown-Inhalte, Trusted-DOM-Sanitizing oder RMT-DOM-Deskriptoren berührt. Ein grüner Lauf belegt die getestete Sink-Grenze; er ersetzt keine Prüfung neuer HTML-Quellen oder zusätzlicher Sanitizer-Regeln.

## Browsernaher Ablauf

Der Browser Proof ist wichtig, weil die Trusted-DOM-Grenze nicht nur eine statische Policy ist. Parsedown HTML, RMT `htmlFragment` und strukturierte DOM-Descriptoren treffen erst im Host auf echte DOM-Sinks. Der Gate prüft deshalb nicht nur, ob geblockte Tokens in einer Liste stehen, sondern ob die Runtime den erlaubten Pfad tatsaechlich vom verbotenen Pfad trennt. Ein Host darf HTML-Fragmente annehmen, aber nur wenn der Sanitizer die Entscheidung sichtbar macht und der Sink als vertrauenswuerdig markiert ist.

Strukturierte DOM-Descriptoren bleiben der bevorzugte Pfad, weil sie keine freie HTML-Ausführung brauchen. Sie beschreiben Elemente, Attribute, Text und Kinder als Daten. Wenn ein `htmlFragment` trotzdem notwendig ist, muss die Evidence zeigen, warum der Host diesen Weg braucht und welche Policy ihn begrenzt. Das schützt RMT davor, zu einem Parser- oder Sanitizer-Transport für beliebige HTML-Inhalte zu werden.

## Reviewer Kriterien

Reviewende prüfen vier Fragen. Erstens: Wird die Sanitizing Boundary im Host ausgeführt und nicht im RMT-Kernel versteckt? Zweitens: Bleiben geblockte Vektoren wie `script`, `inline-event-handler`, `javascript-url` und `srcdoc` sichtbar geblockt? Drittens: Fuehren erlaubte Fragmente nur in den Trusted-DOM-Sink und nicht in direkte `innerHTML`-Shortcuts? Viertens: Bleiben Descriptoren funktionsfähig, wenn HTML-Fragmente komplett fehlen?

Ein Fix ist akzeptiert, wenn er diese Fragen leichter beantwortbar macht. Geblockt sind Änderungen, die Parser-Abhängigkeiten in den Kernel schieben, Sanitizer-Entscheidungen verschweigen oder neue Host-Sinks ohne Gate einführen. Der Browser Proof muss konkret bleiben: ein sichtbarer DOM-Pfad, ein lokaler Report und klare Blocklisten für riskante Vektoren.

## Weiterführend

Das Sanitizing-Konzept erklärt die Trust Boundary, die dieser Browser-Proof ausführt. [Verwandter Artikel](./trusted-dom-sanitizing.md)
