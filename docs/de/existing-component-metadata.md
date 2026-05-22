# Existing Component Metadata

Contract: `xtend.epic10.existing-component-metadata.v1`

WP-E10-14 migriert bestehende priorisierte XTend-Komponenten in die RMT/Fabric-Metadata-Linie. Die Komponenten bleiben vorerst `js-legacy`; die RMT/Fabric-Kompatibilitaet wird als Contract Overlay im Katalog beschrieben.

## Katalog

Der maschinenlesbare Katalog liegt hier:

```text
catalog/epic10-existing-component-metadata.js
```

Der Gate lautet:

```bash
node scripts/run_xtend_tests.js existing-component-metadata --json
```

## Zielkomponenten

| Komponente | Fokus |
|------------|-------|
| `x-router` | XRouter Adapter, Route Records, Schedule References |
| `x-link` | Route Activation, Navigation Events, `aria-current` |
| `x-input` | Form Value, Validation, Event Commands |
| `x-form` | Form Aggregation, Child Control Discovery |
| `x-modal` | Overlay State, Focus Trap, Modal Actions |
| `x-dialog` | Overlay State, Focus Trap, Size Hints |
| `x-tabs` | Tab Records, Keyboard Selection, Route Panel Mapping |
| `x-toast` | Feedback Status, Dismissal Command, Timer Policy |
| `x-alert` | Feedback Status, Dismissal Command, State Sync |

## Migration Strategy

`js-legacy-contract-overlay-no-runtime-rewrite`

Das bedeutet:

- keine Runtime-Rewrites fuer dieses Paket
- keine Big-Bang-TypeScript-Migration
- keine neuen Runtime-Dependencies
- lokale ESM-Artefakte bleiben unter `components/`
- RMT/Fabric Metadata wird zentral gatebar

## Metadata-Domains

Jeder Record enthaelt:

- `xtend.component.contract.v2`
- `xtend.rmt.component-contract.v1`
- `xtend.component.fabric-boundary.v2`
- `xtend.fabric.telemetry-snapshot.v1`
- Lane Precedence
- A11y- und Performance-Hinweise
- Pfade zu Runtime, Types, Docs, Fixture und Component Suite

## RMT Authoring

RMT kann diese Komponenten als `xtend.component` Records authoren. Der RMT-Kernel importiert keine XTend-Klassen oder -Typen. DOM-Materialisierung, Custom Element Lifecycle, Fabric-Ausfuehrung und XRouter-Registration bleiben im Host.

Boundary: `no-rmt-kernel-import-of-xtend-types`

## Weiterfuehrung

WP-E10-15 nutzt diese Metadata-Linie fuer Browser-, A11y-, Performance- und Visual-Gates.
