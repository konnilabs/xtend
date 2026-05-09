# ADR - XTend Security Trust Boundaries

- Status: Accepted
- Datum: 5. Mai 2026
- Contract: `xtend.security.trust-boundaries.adr.v1`
- Loader Policy Contract: `xtend.security.loader-policy.v1`
- Manifest Policy Contract: `xtend.security.manifest-policy.v1`
- Trusted DOM Policy Contract: `xtend.security.trusted-dom-policy.v1`
- Event Policy Contract: `xtend.security.event-policy.v1`
- Roadmap-Paket: `ER-WP-27`
- Bezug:
  - `development/ROADMAP-XTend-Enterprise-Reife.md`
  - `development/XTend-Enterprise-Reife-Implementierungsplan.md`
  - `development/ADR-XTend-Loader-und-Lokale-Entwicklung.md`
  - `development/ADR-XTend-Fabric.md`
  - `development/XTend-Fiber-und-Lane-Contract.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `docs/xtendrmt-app-dsl.md`
  - `docs/xtendrmt-parsedown-scheduling.md`
  - `xtendrmt/rmt.schema.json`
  - `xtendrmt/rmt-runtime.esm.js`
  - `tests/references/reference_path_suite.js`

## Kontext

XTend ist nach Epic 05 kein reines Component-Set mehr. Das Produkt besteht aus XTend UI, XTendRMT als Scheduler/Templating Engine, XRouter-Anbindung, Loader, Manifest, Docs-App und optionaler Fabric-Schicht.

Diese Architektur verarbeitet dynamische Eingaben:

- Manifest-Records und Component URLs
- ESM-Imports ueber Loader oder Adapter
- RMT-Templates, RMT `html_fragment` und native RMT Components
- Parsedown-Ausgabe in der Docs-App
- Custom Events, Router Events und RMT-Event-Bindings
- Fabric Diagnostics und spaetere Reporter-Ausgaben

Ohne explizite Trust Boundaries wuerden Folgepakete unterschiedliche Sicherheitsannahmen treffen. `ER-WP-27` setzt deshalb zuerst eine verbindliche ADR, bevor Manifest-Imports, Trusted DOM, Sanitizing oder Supply-Chain-Gates produktiv gehaertet werden.

## Entscheidung

XTend fuehrt Security-by-design als expliziten Boundary Contract ein.

Der zentrale Contract lautet:

```text
xtend.security.trust-boundaries.adr.v1
```

Security-Entscheidungen gelten fuer XTend UI, XTendRMT-kompatible Artefakte, XRouter-Routen, Docs-/Parsedown-Flows und Fabric-Diagnostics.

Grundsatz:

- Loader und Manifest laden nur bewusst erlaubte lokale Module.
- Templates erzeugen DOM-Strukturen ueber strukturierte Renderer, nicht ueber ungepruefte HTML-Sinks.
- RMT und Docs duerfen Markup authoren, aber Markup wird als eigene Trust Boundary behandelt.
- Events transportieren typed Payloads und Action-Refs, niemals ausfuehrbare Code-Strings.
- Fabric und Reporter erhalten nur redigierte Diagnostics.
- CDN und externe URLs sind kein Default- oder Testpfad.

## Trust Boundary Matrix

| Boundary | Eingang | Default Trust | Erlaubte Sinks | Folgepaket |
|----------|---------|---------------|----------------|------------|
| `loader` | `xtend-loader.js`, `data-manifest`, Preload Meta | lokal-vertrauenswuerdig nach Policy | `import()` nur fuer erlaubte lokale URLs | `ER-WP-28` |
| `manifest` | `components/manifest.json`, Component Records | untrusted bis validiert | URL-Normalisierung, Component Registry, `customElements.define` | `ER-WP-28` |
| `dynamic-import` | Manifest-URL, Adapter-URL, Component-URL | untrusted bis allowlisted | ESM Import aus `self`/lokalem Root | `ER-WP-28` |
| `rmt-template` | RMT `templates`, `components`, `routes` | authoring-vertrauenswuerdig, DOM-untrusted | strukturierte Element-Erzeugung, Text-/Attribut-Sinks | `ER-WP-29` |
| `trusted-dom` | RMT `html_fragment`, Parsedown HTML | untrusted bis sanitisiert | isolierter Trusted-DOM-Sink | `ER-WP-29` |
| `parsedown-docs` | Markdown-Dateien und Parsedown-Ausgabe | content-vertrauenswuerdig, HTML-untrusted | Sanitizer/Trusted DOM Boundary | `ER-WP-29` |
| `events` | DOM Events, Router Events, RMT Event Bindings | typed, aber payload-untrusted | `dispatchEvent`, Adapter Action Ref, Router API | `ER-WP-28`, `ER-WP-29` |
| `fabric-diagnostics` | Errors, telemetry, reporter metadata | lokal, aber privacy-sensitiv | redigierte `xtend.fabric.diagnostic.v1` Events | `ER-WP-10`, `ER-WP-30` |
| `supply-chain` | Dependencies, licenses, release artifacts | untrusted bis gatebar | Audit-/License-/Vulnerability-Gates | `ER-WP-30` completed |

## Loader Policy

Der Loader Policy Contract lautet:

```text
xtend.security.loader-policy.v1
```

Pflichten fuer `ER-WP-28`:

- `xtend-loader.js` ist der kanonische Loader-Sink.
- `xtend-dev.js` bleibt Legacy und darf keine eigene Security-Policy tragen.
- Manifest URLs werden relativ zur Dokument- oder Manifest-Basis normalisiert.
- Default erlaubt nur `self`, relative URLs und lokale Entwicklungsserver.
- Externe URLs, CDN-Fallbacks, `javascript:`, `data:` fuer Skripte und Protokollwechsel werden verweigert.
- Import Refusals erzeugen strukturierte Diagnostics statt stillem Fallback.
- `data-manifest` darf den Manifestpfad nur innerhalb der lokalen Policy verschieben.
- Preload-Werte aus `meta[name="xtend-preload"]` sind Component IDs, keine URLs.

Erlaubte Import-Beispiele:

```text
./components/xalert.js
/components/xrouter.js
http://localhost:4173/components/xmodal.js
```

Nicht erlaubte Import-Beispiele:

```text
https://cdn.example.com/xtend/xalert.js
javascript:alert(1)
data:text/javascript,alert(1)
//example.com/x.js
```

## Manifest Policy

Der Manifest Policy Contract lautet:

```text
xtend.security.manifest-policy.v1
```

Manifest Records werden als Daten behandelt, nicht als ausfuehrbare Konfiguration.

Pflichtfelder fuer sichere Records:

| Feld | Regel |
|------|-------|
| `tag` oder `name` | gueltiger Custom-Element-Name mit Bindestrich |
| `path` oder `url` | lokale URL nach Loader Policy |
| `type` | bekannte Komponentenkategorie oder leer |
| `dependencies` | Component IDs, keine freien URLs |
| `metadata` | redigierbar und nicht ausfuehrbar |

Nicht erlaubt:

- Inline-JavaScript in Manifest-Feldern
- Handler-Strings wie `onclick="..."` oder `new Function(...)`
- externe Script-URLs ohne explizite spaetere Allowlist
- automatische Registrierung unbekannter Tags ohne Validierung

## Template- und Trusted-DOM-Policy

Der Trusted DOM Policy Contract lautet:

```text
xtend.security.trusted-dom-policy.v1
```

XTend trennt vier Markup-Typen:

| Typ | Beispiel | Default-Sink |
|-----|----------|--------------|
| `text` | Label, Body Copy, Markdown Text Node | `textContent` |
| `attribute` | `aria-label`, `href`, `slot` | validierter Attribute Setter |
| `structured-template` | RMT Component Tree, Slots, Props | `document.createElement`, `append`, `setAttribute` |
| `html_fragment` | RMT HTML Fragment, Parsedown HTML | Trusted-DOM-Boundary nach Sanitizing |

Regeln:

- `innerHTML`, `insertAdjacentHTML` und rohe `template.innerHTML` sind nur in dokumentierten Trusted-DOM-Sinks erlaubt.
- RMT `components` und `routes` muessen bevorzugt strukturierte Elementbäume erzeugen.
- RMT `html_fragment` bleibt moeglich, aber nur als explizit riskanter Markup-Typ.
- Parsedown-Ausgabe wird nicht automatisch als sicherer DOM-Sink behandelt.
- Sanitizing-Details werden in `ER-WP-29` entschieden, nicht in Komponenten verteilt.

## Event Policy

Der Event Policy Contract lautet:

```text
xtend.security.event-policy.v1
```

Events sind in XTend ein Integrationsmechanismus, aber kein Code-Ausfuehrungsmechanismus.

Erlaubt:

- `CustomEvent` mit typed, serialisierbaren Details
- Router Action Refs wie `routeRef` oder `to`
- RMT Event Bindings als Adapter-/Action-Referenz
- Component Events mit dokumentiertem Public Event Contract
- Fabric Diagnostics mit redigierter `metadata`

Nicht erlaubt:

- Inline-Handler aus Templates oder Manifesten
- JavaScript-Strings als RMT Event Action
- `eval`, `new Function`, dynamische Script-Tags aus Eventdaten
- ungefilterte Form-, Token-, Cookie-, Header- oder Query-Daten in Eventdetails
- automatische Weitergabe roher Eventpayloads an Reporter

Mindestform fuer spaetere RMT Event Bindings:

```js
{
  event: 'click',
  actionRef: 'router.navigate',
  payload: {
    to: '/settings'
  }
}
```

## Erlaubte und verbotene DOM-Sinks

| Sink | Status | Bedingung |
|------|--------|-----------|
| `textContent` | erlaubt | Default fuer Text |
| `setAttribute` | erlaubt | nur fuer erlaubte Attribute und sichere URLs |
| `classList` | erlaubt | tokenisiert, keine HTML-Strings |
| `dataset` | erlaubt | keine Secrets, keine Codewerte |
| `append`/`replaceChildren` mit Nodes | erlaubt | bevorzugter strukturierter DOM-Pfad |
| `innerHTML` | eingeschraenkt | nur Trusted-DOM-Boundary |
| `insertAdjacentHTML` | eingeschraenkt | nur Trusted-DOM-Boundary |
| `template.innerHTML` | eingeschraenkt | nur gepruefte Templates |
| `script.src` dynamisch | verboten im Default | nur spaetere explizite Import Policy |
| `eval`/`new Function` | verboten | kein XTend-Default-Pfad |

## Fabric-, Diagnostics- und Privacy-Anschluss

Security-Diagnostics nutzen die Fabric-Oberflaeche, sobald `ER-WP-08` und `ER-WP-10` sie produktiv bereitstellen.

Diagnostic Codes:

- `xtend.security.loader.refused`
- `xtend.security.manifest.invalid`
- `xtend.security.import.refused`
- `xtend.security.template.trusted_dom_required`
- `xtend.security.event.refused`
- `xtend.security.reporter.redacted`

Reporter erhalten nur redigierte Events. Security-relevante Rohdaten duerfen lokal fuer Debugging sichtbar sein, aber nicht ungefiltert in `metadata`, Snapshots oder externe Reporter gelangen.

## CSP- und Trusted-Types-Richtung

XTend muss CSP-kompatibel bleiben.

Zielrichtung:

```text
script-src 'self'
connect-src 'self'
object-src 'none'
base-uri 'self'
```

`unsafe-inline` und `unsafe-eval` sind kein Zielpfad. Trusted Types werden als spaeter kompatible Browser-Haertung vorbereitet, aber nicht als Pflicht fuer `ER-WP-27` eingefuehrt.

## Handoff an Folgepakete

| Folgepaket | Startstatus nach ER-WP-27 | Handoff |
|------------|---------------------------|---------|
| `ER-WP-28` | completed | Manifest- und Dynamic-Import-Policy setzt diese ADR technisch im Loader und lokalen Gate um |
| `ER-WP-29` | ready | Sanitizing-/Trusted-DOM-Policy kann auf `xtend.security.trusted-dom-policy.v1` starten |
| `ER-WP-30` | completed | Supply-Chain-Gates nehmen Security Boundary, Package-/Release-Strategie und private Publish Boundary auf |
| `ER-WP-39` | completed | Enterprise Adoption Guide nimmt Security-, Loader-, DOM- und Event-Policies auf |
| `ER-WP-40` | completed | Docs-App RMT Pilot respektiert diese Trust Boundaries praktisch |

## Verifikation

Mindestgate fuer dieses Paket:

```bash
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js references --json
npm test
```

## Ergebnis

Die Entscheidung ist akzeptiert. XTend hat eine verbindliche Security Trust Boundary fuer Loader, Manifest, Dynamic Imports, RMT Templates, Parsedown Docs, Events, Trusted DOM, Fabric Diagnostics und Supply Chain. `ER-WP-28`, `ER-WP-29` und `ER-WP-30` sind abgeschlossen; Manifest-/Import-Haertung, Trusted DOM und Supply-Chain-Gates sind lokal gatebar vorbereitet.
