# XTend Trusted DOM und Sanitizing Policy

- Status: Accepted
- Datum: 5. Mai 2026
- Contract: `xtend.security.trusted-dom-policy.v1`
- Sanitizing Boundary: `xtend.security.sanitizing-boundary.v1`
- Markup Classification: `xtend.security.markup-classification.v1`
- Trusted DOM Sink Contract: `xtend.security.trusted-dom-sink.v1`
- Roadmap-Paket: `ER-WP-29`
- Bezug:
  - `development/ADR-XTend-Security-Trust-Boundaries.md`
  - `development/ER-WP-29-Sanitizing-und-Trusted-DOM-Policy-fuer-RMT-und-Docs-vorbereiten.md`
  - `security/trusted-dom-policy.js`
  - `docs/trusted-dom-sanitizing.md`
  - `docs/xtendrmt-native-authoring.md`
  - `docs/xtendrmt-parsedown-scheduling.md`
  - `docs/index.php`
  - `xtendrmt/rmt.schema.json`
  - `tests/references/reference_path_suite.js`

## Zweck

Diese Policy macht dynamisches Markup fuer XTend UI, XTendRMT und die Parsedown-basierte Docs-App bewusst reviewbar. Sie fuehrt noch keinen produktiven Sanitizer ein. Sie definiert aber die Grenze, ab der HTML-Strings nicht mehr direkt in DOM-Sinks geschrieben werden duerfen.

## Grundsatz

- Text bleibt Text und nutzt `textContent`.
- Attribute werden validiert und dann ueber `setAttribute` gesetzt.
- Strukturierte Templates erzeugen Nodes ueber `document.createElement`, `append` oder `replaceChildren`.
- RMT `html_fragment` und Parsedown HTML sind DOM-untrusted, bis sie eine Sanitizing Boundary durchlaufen haben.
- `innerHTML`, `insertAdjacentHTML` und `template.innerHTML` sind nur in dokumentierten Trusted-DOM-Sinks erlaubt.
- `eval`, `new Function`, Inline-Handler und dynamische Script-Tags sind kein XTend-Default-Pfad.

## Markup-Klassen

| Klasse | Beispiele | Default Sink | Sanitizing |
|--------|-----------|--------------|------------|
| `text` | Labels, Body Copy, Markdown Text Nodes | `textContent` | nein |
| `attribute` | `aria-label`, `href`, `slot`, `data-*` | validierter `setAttribute` | Validierung |
| `structuredTemplate` | RMT `dom_descriptor`, Component Tree | `replaceChildren` mit Nodes | nein |
| `htmlFragment` | RMT `html_fragment` | Trusted-DOM-Boundary | ja |
| `parsedownHtml` | Parsedown-Ausgabe der Docs-App | Trusted-DOM-Boundary | ja |

## DOM-Sink-Regeln

| Sink | Status | Bedingung |
|------|--------|-----------|
| `textContent` | erlaubt | nur Text |
| `setAttribute` | erlaubt mit Validierung | Attribut-Allowlist und URL-Policy |
| `classList` | erlaubt | tokenisierte Klassen |
| `dataset` | erlaubt mit Validierung | keine Secrets, keine Codewerte |
| `append` / `replaceChildren` | erlaubt | nur Nodes |
| `innerHTML` | eingeschraenkt | nur nach `xtend.security.sanitizing-boundary.v1` |
| `insertAdjacentHTML` | eingeschraenkt | nur nach `xtend.security.sanitizing-boundary.v1` |
| `template.innerHTML` | eingeschraenkt | nur nach `xtend.security.sanitizing-boundary.v1` |
| `script.src` | im Default verboten | spaeter nur ueber Loader Import Policy |
| `eval` / `new Function` | verboten | nie als XTend-Default-Pfad |

## RMT `html_fragment`

RMT darf weiterhin `html_fragment` authoren, aber dieser Modus ist explizit riskant.

Pflichten:

- `dom_descriptor` ist der bevorzugte Template-Modus.
- `html_fragment` muss `trustBoundary: "xtend.security.sanitizing-boundary.v1"` oder aequivalente Host-Metadaten tragen.
- Event-Bindings bleiben `actionRef`, `commandName`, `routeRef` oder typed Payloads.
- Inline-Handler wie `onclick`, JavaScript-Strings, `eval` und `new Function` sind verboten.
- Der RMT Kernel plant und validiert Records, fuehrt aber keinen DOM-Sanitizer aus.
- Host Adapter besitzen den Trusted-DOM-Sink.

Beispiel:

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

Die Docs-App nutzt `docs/index.php`, `docs/utils/parsedown.php` und `Parsedown::setSafeMode(true)`.

Policy:

- Parsedown SafeMode bleibt Pflicht.
- Parsedown-Ausgabe ist trotzdem `parsedownHtml`, nicht automatisch DOM-sicher.
- RMT rendert die Docs Shell ueber `docs.app.shell` Shell-first und darf Parsedown-Jobs schedulen, aber Parsedown, PHP und Sanitizing bleiben Host-Aufgaben.
- Rich-HTML- und XPlayer-Tutorial-Slots laufen ueber `docs.rich-content` und `docs.media.lazy`, nicht ueber freie HTML-Sinks.
- Die Docs-App darf Markdown und HTML nur ueber die Docs Host Boundary in die SPA geben.
- Der Docs-RMT-Pilot muss `docs.parsedown` als Adapter und `xtendrmt.docs.parsedown.parse` als Schedule Endpoint verwenden.

## URL- und Attributregeln

Erlaubte Attribute muessen bewusst gesetzt werden. URL-Attribute sind gesondert zu pruefen.

| Kategorie | Regel |
|-----------|-------|
| erlaubte URL-Protokolle | `self`, relative URLs, `http:`, `https:`, `mailto:`, `tel:` |
| verbotene Protokolle | `javascript:`, `vbscript:`, `data:text/html`, `data:text/javascript` |
| `data:` Ausnahme | nur `data:image/*` nach expliziter Sanitizer-Entscheidung |
| Event-Attribute | `on*` ist verboten |
| Style-Attribute | nur nach expliziter Trusted-DOM-Entscheidung |

## Diagnostics

Security-Fehler muessen spaeter als strukturierte Diagnostics erscheinen:

- `xtend.security.trusted_dom.required`
- `xtend.security.sanitizer.missing`
- `xtend.security.sink.refused`
- `xtend.security.attribute.refused`
- `xtend.security.event.refused`

Reporter erhalten nur redigierte Diagnostics. Rohe HTML-Fragmente, Tokens, Cookies, Header oder Query-Strings duerfen nicht ungefiltert in Reporter-Metadaten gelangen.

## Maschinenlesbarer Contract

Die maschinenlesbare Policy liegt in:

```text
security/trusted-dom-policy.js
```

Sie stellt `classifyTrustedDomUse(...)` bereit, damit Tests und spaetere Implementierungen Markup-Klasse, Sink und Sanitizing Boundary einheitlich bewerten koennen.

## Handoff

| Folgepaket | Handoff |
|------------|---------|
| `ER-WP-28` | Loader-/Manifest-Policy kann externe Script- und URL-Sinks technisch verweigern |
| `ER-WP-30` | Supply-Chain-Gates koennen Sanitizer- und Dependency-Anforderungen aufnehmen |
| `ER-WP-39` | Enterprise Adoption Guide muss Trusted DOM und Sanitizing als Betriebsregel beschreiben |
| `ER-WP-40` | Docs-App/RMT Parsedown Scheduling darf nur mit dieser Boundary pilotiert werden |

## Verifikation

```bash
node --check security/trusted-dom-policy.js
node scripts/run_xtend_tests.js references --json
npm test
```
