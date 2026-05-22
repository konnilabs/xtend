# RMT App Platform Authoring

- Contract: `xtend.epic18.rmt-app-platform-authoring.v1`
- Fixture: `tests/fixtures/rmt-app-platform-authoring.rmt`
- Local Gate: `node scripts/run_xtend_tests.js rmt-app-platform-authoring --json`
- Workpackage: `WP-E18-04`

## Zweck

Dieses Authoring-Modell definiert RMT als generische App Platform. Es ist keine
Portierung einer konkreten Produktoberflaeche. Entwickler koennen eigene
App-Domains, Record-Vertraege, Komponentenfamilien, Surfaces, State-Graphen,
Actions, DataSources, Resources und Events kombinieren.

## Primitives

| Primitive | Zweck |
|-----------|-------|
| `app` | App-Metadaten, Shell, Domain, Record-Contract und Einstiegspunkte |
| `route` | URL- oder Navigationszustand auf Surface und Template mappen |
| `surface` | keyed App-Bereiche mit Lifecycle, Placement, State und Persistence |
| `slot` | benannte Kompositionspunkte zwischen Templates und Komponenten |
| `template` | strukturierte UI als DOM Descriptor, nicht als HTML-String |
| `component` | beliebige Custom Elements ueber einen Faehigkeitskatalog binden |
| `state` | typed App-State fuer Collections, Auswahl, Filter und Formwerte |
| `selector` | abgeleitete Lesesichten auf State |
| `derive` | computed Values mit klarem Output-Typ |
| `repeat` | keyed Listen ohne Produkt-Renderer |
| `when` | deklarative Bedingungen, Empty- und Fallback-Zustaende |
| `bind` | State, Selectors oder Derived Values auf Attribute/Properties mappen |
| `action` | deklarative Commands fuer App-Flows |
| `effect` | async Ausfuehrung mit Lanes und Feedback |
| `datasource` | Fixture-, REST-, SSR- oder spaetere Host-Datenadapter |
| `resource` | lazy/preload/cleanup Ressourcen inklusive Trusted-HTML-Sonderfall |
| `event` | scoped Event-Routing ohne impliziten globalen Event-Bus |

## Boundaries

- `no-media-manager-product-surface-clone`
- `no-product-record-contract-required`
- `structured-ui-before-trusted-html`
- `trusted-html-explicit-boundary-only`
- `no-rmt-kernel-import-of-xtend-types`
- `no-external-innerhtml-helper-required`

Normale App-UI muss ueber strukturierte Templates modellierbar sein. HTML bleibt
eine explizite Trusted-DOM-Boundary fuer Sonderfaelle und ist nicht der
Standardweg fuer Komponentenentwicklung.

## Handoff

`WP-E18-04` legt nur das Authoring-Modell fest. `WP-E18-05` baut danach den
sicheren DOM Descriptor Renderer und den No-Manual-HTML-Gate. `WP-E18-06`
setzt darauf die component-nativen Template Primitives um.
