# Trusted DOM und Sanitizing

- Contract: `xtend.docs.trusted-dom-sanitizing.v1`
- Security Policy: `xtend.security.trusted-dom-policy.v1`
- Sanitizing Boundary: `xtend.security.sanitizing-boundary.v1`
- Sanitizer Contract: `xtend.security.trusted-dom-sanitizer.v1`
- Maschinenlesbarer Contract: `security/trusted-dom-policy.js`

## Ziel

XTend behandelt dynamisches Markup als eigene Trust Boundary. Das betrifft besonders RMT `html_fragment`, RMT Template Authoring und die Parsedown-basierte Docs-App.

Diese Seite beschreibt die Entwicklerregel: Markup wird zuerst klassifiziert, dann in einen passenden DOM-Sink geschrieben. Rohe HTML-Strings duerfen nicht nebenbei ueber `innerHTML` landen.

## Markup-Klassen

| Klasse | Quelle | Default |
|--------|--------|---------|
| `text` | Labels, Markdown-Text, Body Copy | `textContent` |
| `attribute` | `aria-label`, `href`, `slot`, `data-*` | validierter `setAttribute` |
| `structuredTemplate` | RMT `dom_descriptor`, Component Trees | Nodes via `replaceChildren` |
| `htmlFragment` | RMT `html_fragment` | Sanitizing Boundary |
| `parsedownHtml` | HTML aus `docs/index.php` / Parsedown | Sanitizing Boundary |

## Erlaubte und eingeschraenkte Sinks

Erlaubt:

- `textContent`
- validierter `setAttribute`
- `classList`
- `dataset` ohne Secrets und ohne Codewerte
- `append` und `replaceChildren` mit Nodes

Eingeschraenkt:

- `innerHTML`
- `insertAdjacentHTML`
- `template.innerHTML`

Diese eingeschraenkten Sinks brauchen `xtend.security.sanitizing-boundary.v1`.
Browsernahe Docs-/RMT-Sinks muessen zusaetzlich den Sanitizer Contract `xtend.security.trusted-dom-sanitizer.v1` ausweisen.

Verboten im Default:

- Inline-Handler wie `onclick`
- `eval`
- `new Function`
- dynamische Script-Tags aus RMT-, Manifest-, Event- oder Docs-Daten

## RMT Templates

Fuer XTendRMT gilt:

- `dom_descriptor` ist bevorzugt.
- `html_fragment` ist erlaubt, aber nur mit Trusted-DOM-Boundary.
- Events nutzen `actionRef`, `commandName`, `routeRef` oder typed Payloads.
- Der RMT Kernel plant Records und Diagnostics, aber sanitized kein HTML selbst.
- Host Adapter besitzen den DOM-Sink.

```json
{
  "id": "settings.shell",
  "mode": "html_fragment",
  "markup": "<x-card></x-card>",
  "security": {
    "markupClass": "htmlFragment",
    "trustBoundary": "xtend.security.sanitizing-boundary.v1",
    "sink": "trustedDomBoundary"
  }
}
```

## Parsedown Docs-App

Die Docs-App rendert Markdown ueber `docs/index.php` und `docs/utils/parsedown.php`. `Parsedown::setSafeMode(true)` bleibt Pflicht, ersetzt aber keine Trusted-DOM-Policy. Die App Shell selbst wird inzwischen Shell-first aus `docs.app.shell` im RMT-Dokument erzeugt; Parsedown HTML wird danach nur in den `data-rmt-slot="content"` Slot eingesetzt.

Regel:

- Markdown-Dateien sind Content.
- Parsedown-Ausgabe ist `parsedownHtml`.
- RMT rendert Shell-Descriptoren und darf Parsedown-Arbeit schedulen.
- `docs.rich-content` und `docs.media.lazy` bereiten spaetere Rich-HTML- und XPlayer-Tutorial-Slots vor.
- Sanitizing und DOM-Sinks bleiben Host-Verantwortung.
- `WP-E13-11` prueft diese Boundary browsernah mit [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md), `xtend.epic13.trusted-dom-boundary.v1` und `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`.

## Diagnostics

Spaetere Implementierungen sollen diese Codes nutzen:

- `xtend.security.trusted_dom.required`
- `xtend.security.sanitizer.missing`
- `xtend.security.sink.refused`
- `xtend.security.attribute.refused`
- `xtend.security.event.refused`

## Gates

```bash
node --check security/trusted-dom-policy.js
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
node scripts/run_xtend_tests.js references --json
```

## Weiterfuehrende Dokumente

- [XTendRMT Native Authoring](./xtendrmt-native-authoring.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
- [XTendRMT Parsedown Scheduling Pilot](./xtendrmt-parsedown-scheduling.md)
- [XTendRMT App-DSL Reference](./xtendrmt-app-dsl.md)
