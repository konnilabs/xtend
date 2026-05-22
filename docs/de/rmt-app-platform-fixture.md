# RMT App Platform Fixture

WP-E18-12 liefert die generische Referenz-Fixture fuer die RMT App Platform.
Sie beweist, dass die Epic-18-Primitives nicht an eine Produktoberflaeche
gekoppelt sind: dieselben RMT-Bausteine tragen einen `generic-catalog`, eine
`admin-queue` und ein `content-board`.

## Vertrag

- Schema: `xtend.epic18.rmt-app-platform-fixture.v1`
- Fixture Schema: `xtend.epic18.rmt-app-platform-fixture-source.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-app-platform-fixture --json`
- Package Script: `npm run test:rmt-app-platform-fixture`
- Handoff: `WP-E18-13`

## Abgedeckte Plattformfaehigkeiten

- konfigurierbare Record-Contracts ohne feste Record-Klasse
- Listen-, Detail-, Toolbar-, Feedback- und Overlay-Komposition mit DOM
  Descriptor Templates
- Actions mit Fixture-, REST-, SSR- und Host-DataSources
- Feedback-, Navigation-, Focus-, Lazy-Import- und Side-Effect-Flows
- dynamische Surfaces fuer mehrere Domains aus denselben Primitives
- Portals und Overlays inklusive Stack-Verhalten
- Resource Ownership und Cleanup fuer Streams, Observer, Timer, Object URLs und
  Lazy Imports
- Scaffold Build Evidence ueber den RMT App Platform Generator

## Grenzen

Normale RMT UI bleibt deklarativ. `innerHTML`, `outerHTML`,
`insertAdjacentHTML` und `document.write` gehoeren nicht in die App-Fixture;
der No-Manual-HTML-Gate prueft das explizit. Produktgebundene Surface-Listen
werden ebenfalls vermieden. Entwickler sollen in XTend App-Strukturen bauen
koennen, ohne externe Shell-Renderer oder lokale Registry-Umbauten zu brauchen.

## Fixture-Artefakte

- `catalog/epic18-rmt-app-platform-fixture.js`
- `tests/fixtures/rmt-app-platform-fixture.rmt`
- `tests/rmt/rmt_app_platform_fixture_suite.js`
- `development/WP-E18-12-Generische-RMT-App-Platform-Fixture-bauen.md`

Der Gate rendert die Fixture mit dem DOM Descriptor Renderer, routet Events in
Actions, tauscht DataSources, materialisiert Surfaces, oeffnet Overlays und
belegt Cleanup durch Resource-Disposals.
