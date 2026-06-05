# RMT App Platform Fixture

Die RMT App Platform Fixture ist die domain-neutrale Referenz fuer Epic18 App-Authoring. Sie beweist, dass RMT App Shell, Komponenten, Datenquellen, Events, Actions, Surface Runtime, Overlays, Resource Lifecycle und DOM Descriptor Rendering ohne Produkt-Domain-Kopplung zusammenfuehren kann.

- Schema: `xtend.epic18.rmt-app-platform-fixture.v1`
- Fixture: `tests/fixtures/rmt-app-platform-fixture.rmt`
- Catalog: `catalog/epic18-rmt-app-platform-fixture.js`
- Local Gate: `node scripts/run_xtend_tests.js rmt-app-platform-fixture --json`
- Package Script: `npm run test:rmt-app-platform-fixture`

## Domain Variants

| Variant | Zweck |
|---------|-------|
| `generic-catalog` | neutrale Collection-, Detail- und Selection-Flows |
| `admin-queue` | Queue-, Status- und Review-Flows |
| `content-board` | Board-, Preview- und Surface-Composition-Flows |

Diese Varianten sind absichtlich generisch. Sie duerfen keine Media-Manager-, Explorer- oder Player-Produktbegriffe in die Fixture tragen.

## Runtime Coverage

| Runtime | Evidence |
|---------|----------|
| DOM Descriptor Renderer | rendert deklarative Deskriptoren in Fake-DOM und Browser-nahe Targets |
| Component Template Primitives | materialisiert Slots, Repeats, Conditions, Properties und Events |
| State Selector Runtime | liest und aktualisiert Fixture State und derived Values |
| Action Effect Runtime | fuehrt Fixture-, REST-, SSR- und Host-DataSources aus |
| Event Routing Runtime | routet deklarative Events zu Actions |
| Surface Resource Graph Runtime | oeffnet, minimiert, restauriert und zerstoert Surfaces mit Resource Cleanup |

## Security Boundary

Die Fixture ist ein No-Manual-HTML-Pfad. Sie nutzt DOM Descriptor Records und prueft, dass App-Authoring kein `innerHTML`, keine freien HTML-Strings, kein Inline-JavaScript und keine Host-spezifische Runtime-Kopplung benoetigt.

## Handoff

WP-E18-12 liefert die Fixture-Evidence fuer WP-E18-13 und fuer Native-First Folgearbeit wie `NFM-WP-14`. Die Fixture ist eine Quelle fuer RMT UI Gap Analysis, aber kein Claim, dass Data Display, Command Palette oder Autocomplete bereits vollstaendig implementiert sind.
