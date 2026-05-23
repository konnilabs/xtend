# XTendRMT Parsedown Scheduling Pilot

- Status: aktiver Docs-App-Pilot ab `ER-WP-40`, Shell-first-Refactor aktiv
- Contract: `xtend.docs.parsedown-rmt-scheduling.v1`
- Pilot Contract: `xtend.docs.parsedown-rmt-pilot.v1`
- Production-Hardening Contract: `xtend.epic13.docs-rmt-production-hardening.v1`
- PHP-SSR-Prehydration Contract: `xtend.docs.php-ssr-prehydration.v1`
- Pilot-Dokument: `docs/xtendrmt-parsedown-docs.rmt`
- vNext-Shell-Dokument: `docs/xtendrmt-docs-shell-vnext.rmt`
- Aktuelle Runtime: `docs/index.php` + `docs/utils/parsedown.php` + `docs/utils/pageloader.js`

## Zweck

Die offizielle XTend Dokumentation ist selbst eine XTend-App. Markdown-Dateien im `docs` Ordner werden serverseitig ueber Parsedown nach HTML gewandelt und clientseitig ueber XRouter als SPA angezeigt. Der Host spiegelt nur noch die initial benoetigte HTML-Seite in `window.xtendDocsPages`; weitere Parsedown-Payloads werden pro Route ueber `window.xtendDocsPageEndpoint` nachgeladen.

Der aktuelle Stand ist Shell-first mit serverseitiger Prehydration: `docs/index.php`
laedt `xtendrmt/rmt-php-ssr-adapter.php`, kompiliert
`docs/xtendrmt-docs-shell-vnext.rmt` ueber
`scripts/compile_rmt_vnext_bridge.js` und rendert die Root-Shell als RMT DOM
Descriptor. Die sichtbare Page-Shell wird weiter aus `docs.app.shell` im
RMT-Pilot-Dokument beschrieben; Parsedown bleibt Host-Adapter und fuellt nur
noch den Content-Slot. Damit kann die Docs-App spaeter neben Markdown auch
Rich-HTML- oder XPlayer-Tutorial-Inhalte als RMT-geplante Slots nachladen; der
maschinenlesbare Content-Kind dafuer ist `xplayerTutorial`. Parsedown und XTend
werden dabei nicht in den RMT Kernel eingebettet.

## ER-WP-40 Pilot-Artefakte

| Artefakt | Rolle |
|----------|-------|
| `docs/xtendrmt-parsedown-docs.rmt` | RMT-Pilot-Dokument fuer Shell-first-Templates, Docs-Routen, Parsedown-Templates, Schedules, Rich-Content-Slots und Host-Adapter |
| `docs/xtendrmt-docs-shell-vnext.rmt` | vNext-Source fuer Root Shell, Header, Hero, Router, Footer, Page Shell, Sidebar, Search, Related Links und Diagnostics als RMT-Primitives |
| `docs/index.php` | aktiver Parser-Host, setzt `Parsedown::setSafeMode(true)` und spiegelt `window.xtendDocsRmtDocument`, `window.xtendDocsRmtPilot` sowie `window.xtendDocsPagesMeta` |
| `scripts/compile_rmt_vnext_bridge.js` | sichere Node-Bridge fuer `compileRmtVNextSource` im PHP-Host |
| `docs/utils/pageloader.js` | rendert `docs.app.shell` und `docs.header.search` aus RMT-`dom_descriptor`-Templates, markiert Content-Slots mit `data-rmt-template`, `data-rmt-parse-schedule`, `data-rmt-trust-boundary` und `xtend.docs.parsedown-rmt-render.v1` |
| `tests/rmt/docs_rmt_pilot_suite.js` | Gate fuer RMT-Normalisierung, Runtime-Registry, Trusted-DOM-Boundary und Docs-App-Anschluss |
| `package.json` | Metadaten unter `xtend.docsRmtPilot` und Script `npm run test:docs-rmt-pilot` |

Der Pilot ist bewusst host-neutral: `docs/index.php` bleibt Parser-Host, waehrend RMT die Shell, Search-UI, Schedules und zukuenftige Content-Slots beschreibt. Der PageLoader ist dadurch ein Host-Adapter fuer RMT-Descriptoren.

Ab `WP-E13-10` besitzt derselbe Pfad zusaetzlich die Production-Hardening-Schicht `xtend.epic13.docs-rmt-production-hardening.v1`. Sie stabilisiert `docs.slot.content`, `docs.slot.rich-content`, `docs.slot.media` und `docs.slot.diagnostics`, sodass Parsedown-HTML, Rich HTML ueber `docs.rich-content.prepare`, XPlayer-Tutorials ueber `docs.media.lazy` und Diagnostics getrennt scheduled werden koennen. Der Gate lautet `node scripts/run_xtend_tests.js epic13-docs-rmt-production-hardening --json`.

Ab der Skeleton-Haertung nutzt der Pilot den nativen `xtend.loader.skeleton-loader.v1` und die `xtend.loader.style-registry.v1`: Die Loader-Registry deckt undefinierte XTend Custom Elements mit deklarativen Skeletons oder verstecktem Light DOM ab, XRouter zeigt pro Route einen Skeleton-Fallback waehrend Import und Hydration, und `xtend-doc-page` setzt denselben Loader fuer den Parsedown-Content-Slot ein. Dadurch bleibt die App Shell sichtbar und stabil, waehrend der schwere HTML-Commit erst nach dem ersten Paint erfolgt. `xtend.css` bleibt als Standard-Dateiname fuer Host-Theming optional nutzbar, ist fuer diesen FOUC-Schutz aber keine harte Voraussetzung mehr.

## Aktueller Docs-App-Fluss

1. `docs/index.php` findet alle `.md` Dateien rekursiv.
2. Der PHP-Host injiziert `compileRmtVNextSource` ueber die Node-Bridge und rendert die App Shell mit dem PHP SSR Adapter.
3. `window.xtendDocsSsrPrehydration` enthaelt `renderman_template_chunk`, Hydration, Diagnostics und den JSONL-SSR-Endpunkt.
4. `docs/utils/parsedown.php` wandelt nur die initiale oder per Route angefragte Markdown-Datei in HTML.
5. `window.xtendDocsPagesMeta` enthaelt die SEO-, Schedule- und RMT-Metadaten nach Slug; `window.xtendDocsPages` enthaelt nur vorhandene HTML-Payloads.
6. `<x-router mode="hash" skeleton="article">` routet auf `xtend-doc-page`, lazy-laedt dessen Modul und hydriert den Route-Subtree ueber den Loader.
7. `docs/utils/pageloader.js` liest `window.xtendDocsRmtDocument`, reused vorhandene SSR-Shells ueber `data-rmt-shell-prehydrated="true"` und rendert nur bei Degradation den Client-Fallback.
8. Der `data-rmt-slot="content"` Slot zeigt einen nativen SkeletonLoader, bis Parsedown-HTML nach dem ersten Paint sanitisiert und eingesetzt wurde.
9. `docs.header.search` liefert die Header-Suche als RMT-Descriptor fuer den `search` Slot von `x-header`.
10. `docs/menu.json` definiert die sichtbare Navigationshierarchie; `pageloader.js` gruppiert und priorisiert sie fuer die Drawer-Navigation.

Seit dem Document-Title-Rewrite werden pro Markdown-Datei zusaetzlich RMT Route Records erzeugt und in `window.xtendDocsRmtDocument.routes` gespiegelt. `docs/index.php` extrahiert den ersten H1 als `title`, erzeugt `documentTitle`, `titleTemplate`, `metaDescription` und `metaKeywords` und rendert daraus die sichtbaren `<x-route>` Attribute `title`, `document-title`, `title-template`, `meta-description` und `meta-keywords`. XRouter fuehrt anschliessend das eigentliche Schreiben von `document.title` und der SEO-Metatags aus. Damit bleibt der Use Case RMT-deklarativ, waehrend die Browser-Seiteneffekte im XRouter Adapter liegen.

Dieser Fluss bleibt ein Host-Fluss. RMT liefert die Shell- und Schedule-Records; DOM-Sinks, Parsedown und konkrete Event-Bindings bleiben im Docs Host Adapter.

Der Host Adapter normalisiert nach dem Sanitizing zusaetzlich Inline-Code aus Parsedown SafeMode. SafeMode escaped Backtick-Inhalte wie `` `<x-code>` `` in einzelnen Faellen doppelt (`&amp;lt;...&amp;gt;`). `pageloader.js` decodiert solche Entities ausschliesslich innerhalb von `<code>`-Nodes und schreibt sie als `textContent` zurueck. Dadurch bleibt die Trusted-DOM-Boundary intakt, waehrend Komponenten- und API-Namen in der Dokumentation lesbar bleiben.

## Navigationshierarchie

Die Docs-Navigation nutzt seit dem Hierarchie-Hardening pro Artikel stabile Metadaten:

- `id`: kanonische Artikel-ID, z.B. `docs.components.xcode`
- `group`: sichtbarer Navigationsbereich wie `core`, `components`, `rmt` oder `release`
- `parent`: optionaler Parent-Slug fuer Deep-Dive-Zweige
- `tier`: Einordnung wie `basic`, `deep-dive`, `component-reference` oder `release-deep-dive`
- `rank`: PageRank-artiger Sichtbarkeitswert, bei dem hohe Werte zuerst und direkt sichtbar erscheinen

Damit sieht der User zuerst Grundlagen wie Startseite, Manifest, API, Komponentenuebersicht oder XTendRMT Overview. Spezifische Artikel werden kaskadierend unter dem jeweiligen Einstiegspunkt als Deep Dive angeboten.

## RMT-Zielbild

Parsedown wird als eigener Host Adapter beschrieben:

```json
{
  "id": "docs.parsedown",
  "kind": "template_adapter",
  "runtimeSurface": ["server", "browser_classic"],
  "providedCapabilities": ["markdown", "htmlFragments", "slugIndex", "scheduleRefs"],
  "kernelVisible": false
}
```

Die Docs-App bleibt XTend UI:

```json
{
  "id": "docs.page",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "xtend-doc-page",
  "schedule": "docs.page.hydrate"
}
```

Die Shell selbst ist ein RMT-Template:

```json
{
  "id": "docs.app.shell",
  "mode": "dom_descriptor",
  "schedule": "docs.shell.render",
  "nodes": [
    {
      "tag": "x-section",
      "attributes": {
        "data-rmt-shell": "docs.app.shell",
        "data-rmt-shell-mode": "shell-first"
      }
    }
  ]
}
```

Parsedown-Arbeit wird als Schedule Policy geplant:

```json
{
  "id": "docs.markdown.parse",
  "endpointName": "xtendrmt.docs.parsedown.parse",
  "scope": "docs.markdown",
  "lane": "background",
  "priority": 35,
  "preferIdle": true,
  "budgetClass": "background"
}
```

## Pilot-Dokument

Das produktive Pilot-Dokument liegt unter `docs/xtendrmt-parsedown-docs.rmt`. Es enthaelt drei reale Docs-Routen:

- `/readme`
- `/enterprise-adoption`
- `/xtendrmt-parsedown-scheduling`

Die gekuerzte Struktur:

```json
{
  "kind": "rmt_document",
  "version": "1.0",
  "documentId": "docs.xtend.developer-center",
  "namespace": "docs",
  "adapters": [
    {
      "id": "docs.parsedown",
      "kind": "template_adapter",
      "runtimeSurface": ["server"],
      "providedCapabilities": ["markdown", "htmlFragments", "slugIndex", "scheduleRefs"],
      "kernelVisible": false
    },
    {
      "id": "xtend.xrouter",
      "kind": "router_adapter",
      "runtimeSurface": ["browser_classic"],
      "providedCapabilities": ["routes", "navigation", "scheduleRefs"],
      "kernelVisible": false
    },
    {
      "id": "xtend.component",
      "kind": "component_adapter",
      "runtimeSurface": ["browser_classic"],
      "providedCapabilities": ["components", "customElements", "hydration", "scheduleRefs"],
      "kernelVisible": false
    }
  ],
  "components": [
    {
      "id": "docs.page",
      "kind": "custom_element",
      "adapter": "xtend.component",
      "tag": "xtend-doc-page",
      "schedule": "docs.page.hydrate"
    },
    {
      "id": "docs.shell",
      "kind": "template_component",
      "adapter": "docs.rich-content",
      "tag": "x-section",
      "schedule": "docs.shell.render"
    },
    {
      "id": "docs.media.player",
      "kind": "custom_element",
      "adapter": "xtend.component",
      "tag": "x-player",
      "schedule": "docs.media.lazy"
    }
  ],
  "routes": [
    {
      "id": "docs.readme",
      "path": "/readme",
      "router": "xtend.xrouter",
      "component": "docs.page",
      "title": "XTend Developer Documentation",
      "documentTitle": "XTend Developer Documentation | XTend Dokumentation",
      "titleTemplate": "{{title}} | XTend Dokumentation",
      "metaDescription": "Developer Documentation fuer XTend UI und XTendRMT.",
      "template": "docs.readme.markdown",
      "schedule": "docs.route.render"
    }
  ],
  "schedules": [
    {
      "id": "docs.shell.render",
      "endpointName": "xtendrmt.shell.render",
      "scope": "docs.shell",
      "lane": "visible",
      "priority": 90
    },
    {
      "id": "docs.markdown.parse",
      "endpointName": "xtendrmt.docs.parsedown.parse",
      "scope": "docs.markdown",
      "lane": "background",
      "priority": 35,
      "preferIdle": true
    },
    {
      "id": "docs.route.render",
      "endpointName": "xtendrmt.route.render",
      "scope": "docs.route.render",
      "lane": "visible",
      "priority": 80
    },
    {
      "id": "docs.page.hydrate",
      "endpointName": "xtendrmt.component.hydrate",
      "scope": "docs.page.hydrate",
      "lane": "idle",
      "priority": 40,
      "preferIdle": true
    },
    {
      "id": "docs.media.lazy",
      "endpointName": "xtendrmt.docs.media.lazy",
      "scope": "docs.media",
      "lane": "idle",
      "preferIdle": true
    }
  ],
  "templates": [
    {
      "id": "docs.readme.markdown",
      "mode": "html_fragment",
      "source": "docs/README.md",
      "adapter": "docs.parsedown",
      "security": {
        "markupClass": "parsedownHtml",
        "trustBoundary": "xtend.security.sanitizing-boundary.v1",
        "sink": "trustedDomBoundary"
      },
      "hydration": {
        "mode": "hydrate_prerendered",
        "metadata": {
          "endpointHint": "xtendrmt.docs.parsedown.parse"
        }
      }
    }
  ]
}
```

## Verantwortungsgrenzen

| Verantwortung | Ort |
|----------------|-----|
| Markdown lesen | Docs-App oder Docs Host Adapter |
| Parsedown ausfuehren | `docs.parsedown` Adapter |
| HTML-Fragmente bereitstellen | Docs-App Host Boundary mit `xtend.security.sanitizing-boundary.v1` |
| Shell-first-App-Shell rendern | `docs.app.shell` ueber Docs Host Adapter |
| Header-Suche rendern | `docs.header.search` ueber Docs Host Adapter |
| Rich HTML und Tutorial-Videos vorbereiten | `docs.rich-content` und `docs.media.lazy` |
| Routen registrieren | `createRmtXRouterAdapter` |
| Seite hydrieren | `createRmtXtendComponentAdapter` |
| Scheduling und Diagnostics spiegeln | `createRmtStateSchedulerDiagnosticsBridge` |

Der RMT Kernel bekommt nur Records, Policies und Diagnostics. Er parst kein Markdown, ruft kein PHP auf und sanitized kein HTML. Parsedown-Ausgabe gilt trotz `Parsedown::setSafeMode(true)` als `parsedownHtml` und muss ueber die Trusted-DOM-Policy aus [Trusted DOM und Sanitizing](./trusted-dom-sanitizing.md) laufen.

## Umgesetzte Pilot-Schritte

| Schritt | Status |
|---------|--------|
| Docs-App-Fluss auf Shell-first-RMT-Shell umstellen | `done` |
| `.rmt` Pilot fuer Docs-Routen und Parsedown-Schedules anlegen | `done` |
| `docs.parsedown` Adapter als Host-Schicht beschreiben | `done` |
| `docs.app.shell` als produktive RMT-App-Shell rendern | `done` |
| `docs.header.search` als RMT-Header-Suchtemplate rendern | `done` |
| Rich-Content- und `x-player`-Slots als future-ready RMT-Schedules vorbereiten | `done` |
| `xtend.security.sanitizing-boundary.v1` fuer Parsedown HTML im Host Adapter nachweisen | `done` |
| `createRmtFormat().normalizeDocument(...)` und `createRuntimeRegistries(...)` fuer Docs-Routes nutzen | `done` |
| Docs-App mit per-page RMT-Metadaten ausstatten | `done` |
| Parsedown-Parse-Jobs ueber `xtendrmt.docs.parsedown.parse` schedulbar machen | `done` |
| Reference- und RMT-Pilot-Gates erweitern | `done` |

Noch nicht Teil des Pilots: Produktive XRouter-Routen werden nicht aus dem RMT-Dokument registriert. Das bleibt ein spaeterer Runtime-Ausbau. Ebenfalls noch nicht aktiv: Rich-HTML- und XPlayer-Inhalte werden nur als Slots und Schedules vorbereitet, aber noch nicht mit externen Tutorial-Payloads befuellt.

## Mindestgates

```bash
php -l docs/index.php
node scripts/run_xtend_tests.js docs-rmt-pilot --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js browser --json
node scripts/run_xtend_tests.js rmt-compatibility --json
```

Der Pilot ist Shell-first, aber weiterhin framework-agnostisch. Solange kein produktiver `docs.parsedown` Runtime-Adapter die PHP-Seite ersetzt, bleibt `docs/index.php` der aktive Parser-Host.
