# WP-E10-14 - Existing Component Metadata Migration fuer priorisierte Komponenten

Status: `completed`

Epic: `EPIC-10`

Contract: `xtend.epic10.existing-component-metadata.v1`

## Ziel

Bestehende priorisierte XTend-Komponenten werden mit RMT/Fabric Metadata nachgezogen, sodass sie in RMT-first Apps gatebar und dokumentiert verwendbar sind. Das Paket erzwingt keine Big-Bang-TypeScript-Migration.

## Umsetzung

- `catalog/epic10-existing-component-metadata.js` erzeugt den Contract-Overlay-Katalog fuer neun bestehende Komponenten.
- `tests/components/existing_component_metadata_migration_suite.js` validiert Katalog, Contract v2, RMT, Fabric, Telemetry, Lanes, Pfade und Handoff.
- `development/XTend-Existing-Component-RMT-Fabric-Metadata.md` dokumentiert den Contract.
- `docs/existing-component-metadata.md` dokumentiert den Entwicklerpfad.
- `package.json`, `xtend-builder/scaffold.config.js`, Runner, Epic, Backlog und Referenzpfade enthalten den Gate.

## Zielkomponenten

- `x-router`
- `x-link`
- `x-input`
- `x-form`
- `x-modal`
- `x-dialog`
- `x-tabs`
- `x-toast`
- `x-alert`

## Akzeptanzkriterien

- Jede Zielkomponente besitzt einen `xtend.component.contract.v2` Overlay-Record.
- Jede Zielkomponente besitzt RMT Metadata mit `xtend.component` Adapter, `dom_descriptor`, Schedule Hints und `diagnostics.snapshot`.
- Jede Zielkomponente besitzt Fabric Boundary, Telemetry Snapshot Mapping und Lane Precedence.
- Jede Zielkomponente bleibt `js-legacy`.
- Keine Runtime-Datei muss fuer dieses Paket umgebaut werden.
- Package-, Scaffold-, Docs- und Referenzpfade sind aktualisiert.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js existing-component-metadata --json
```

## Ergebnis

WP-E10-14 ist abgeschlossen. `WP-E10-15` kann nun Browser-, A11y-, Performance- und Visual-Gates auf Basis der neuen Metadata-Linie erweitern.
