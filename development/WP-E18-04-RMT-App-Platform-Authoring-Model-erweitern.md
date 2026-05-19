# WP-E18-04 - RMT App Platform Authoring Model erweitern

- Status: `completed`
- Datum: 2026-05-19
- Epic Docs: `docs/epic18-media-manager-vendor-upstream.md`
- Backlog: `development/BACKLOG-EPIC-18-XTendRMT-App-Platform-und-Media-Manager-Vendor-Upstream.md`
- Depends on: `WP-E18-01`
- WP Contract: `xtend.epic18.wp04.rmt-app-platform-authoring-model.v1`
- Authoring Contract: `xtend.epic18.rmt-app-platform-authoring.v1`
- Fixture Contract: `xtend.epic18.rmt-app-platform-authoring-fixture.v1`
- Zielzustand: `rmt-app-platform-authoring-ready`
- Boundary: `no-media-manager-product-surface-clone`
- Boundary: `no-product-record-contract-required`
- Boundary: `structured-ui-before-trusted-html`
- Boundary: `trusted-html-explicit-boundary-only`
- Lokaler Gate:
  - `node scripts/run_xtend_tests.js rmt-app-platform-authoring --json`
  - Ergebnis 2026-05-19: `passed`, 283 Assertions, 0 Failures, 0 Warnings
- RMT-App-Platform-Gate-Kette:
  - `node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json`
  - Ergebnis 2026-05-19: `passed`, 7/7 Suites, 817 Assertions, 0 Failures, 0 Warnings

## Ziel

`WP-E18-04` schaerft RMT als generisches App-Authoring-Modell, bevor Runtime-
und Renderer-Code in `WP-E18-05` und `WP-E18-06` festgelegt werden. Der Slice
beschreibt App-Platform-Primitives, nicht Media-Manager-Surfaces als Produkt.

## Artefakte

| Datei | Zweck |
|-------|-------|
| `catalog/epic18-rmt-app-platform-authoring.js` | maschinenlesbarer Contract mit Primitives, Boundaries, Schedules und Handoff |
| `tests/fixtures/rmt-app-platform-authoring.rmt` | generische RMT-App-Platform-Fixture fuer mehrere frei definierte Domains |
| `tests/rmt/rmt_app_platform_authoring_suite.js` | lokaler Gate `rmt-app-platform-authoring` |
| `docs/rmt-app-platform-authoring.md` | Entwicklerdokumentation des Authoring-Modells |
| `scripts/run_xtend_tests.js` | Registrierung der neuen Suite |
| `package.json` | Script `test:rmt-app-platform-authoring` |

## Abgedeckte Primitives

`app`, `route`, `surface`, `slot`, `template`, `component`, `state`,
`selector`, `derive`, `repeat`, `when`, `bind`, `action`, `effect`,
`datasource`, `resource` und `event`.

## Authoring-Leitplanken

- Entwickler definieren App-Domains und Record-Vertraege frei.
- Surfaces bleiben generische keyed App-Bereiche mit Lifecycle, Placement,
  State und Persistence.
- XTend-Komponenten werden ueber einen Faehigkeitskatalog gebunden:
  Tags, Attribute, Properties, Slots, Parts, Events, Methoden, State-Bindings,
  A11y und Theme Tokens.
- Normale UI nutzt strukturierte DOM Descriptor Templates.
- Trusted HTML ist nur als explizite Resource-Boundary erlaubt.
- Der RMT Kernel importiert keine XTend-Typen.

## Nicht-Scope

- kein DOM Descriptor Renderer
- keine Runtime-Ausfuehrung der Templates
- kein Produkt-Surface-Klon
- keine Media-Manager-Record-Pflicht
- keine externen `innerHTML`-Hilfsrenderer als Standardpfad

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Authoring Contract beschreibt flexible App-Platform-Primitives | erfuellt |
| Fixture beweist frei definierbare App-Domains und Record-Vertraege | erfuellt |
| Keine Media-Manager-spezifischen Surface-Namen oder Datenformen sind Voraussetzung | erfuellt |
| Structured-UI-vs-Trusted-HTML-Boundary ist eindeutig | erfuellt |
| `WP-E18-05` kann den Renderer-/No-Manual-HTML-Slice starten | erfuellt |

## Handoff

`WP-E18-04` ist abgeschlossen. `WP-E18-05` kann jetzt den sicheren DOM
Descriptor Renderer und den No-Manual-HTML-Gate bauen. `WP-E18-06` ergaenzt
danach die component-nativen Template Primitives.
