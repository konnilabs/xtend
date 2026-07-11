# WP-E18-12 - Generische RMT App Platform Fixture bauen

Status: `completed`

## Ziel

WP-E18-12 baut eine produktnahe, aber domain-neutrale RMT App Platform Fixture.
Sie beweist, dass XTend native Tools fuer App-Aufbau, Komponenten,
Interaktionen, Surfaces, Overlays und Resource Lifecycle bereitstellt, ohne
eine konkrete Produktoberflaeche zu kopieren.

## Implementiert

- `xtend.epic18.rmt-app-platform-fixture.v1` als Catalog-Vertrag
- `tests/fixtures/rmt-app-platform-fixture.rmt` mit `generic-catalog`,
  `admin-queue` und `content-board`
- End-to-End-Suite fuer:
  - App Platform Analyse und RMT Linter
  - Scaffold Dry-Run, Write und Check
  - DOM Descriptor Rendering ohne `innerHTML`
  - State, Selectors und Derived Values
  - Actions mit Fixture-, REST-, SSR- und Host-DataSources
  - Event Routing zu Actions
  - Surface Materialization, Overlay Stack und Resource Cleanup
- Package-Metadaten und Test-Script `npm run test:rmt-app-platform-fixture`
- Dokumentation in `docs/en/rmt-app-platform-fixture.md`

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js rmt-app-platform-fixture --json
```

## Handoff

Naechstes Workpackage: `WP-E18-13`.

WP-E18-13 kann nun Docs, Migration Guide, Vendor Rebuild, Package Export Lock
und Release Handoff auf einer belegten App-Platform-Fixture aufsetzen.
