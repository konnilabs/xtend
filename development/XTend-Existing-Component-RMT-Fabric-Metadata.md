# XTend Existing Component RMT/Fabric Metadata

Contract: `xtend.epic10.existing-component-metadata.v1`

Status: `accepted-migration`

Workpackage: `WP-E10-14`

## Ziel

Dieses Paket zieht bestehende priorisierte XTend-Komponenten in die Epic-10-RMT/Fabric-Metadata-Linie nach, ohne eine Big-Bang-TypeScript-Migration auszulösen. Die Runtime bleibt vorerst `js-legacy`; der neue Contract-Overlay-Katalog macht die Komponenten aber sofort RMT/Fabric-kompatibel dokumentiert und gatebar.

## Strategie

Migration Strategy: `js-legacy-contract-overlay-no-runtime-rewrite`

Die Entscheidung ist bewusst konservativ:

- keine Runtime-Rewrites in `components/*.js`
- keine TypeScript-Pflicht fuer bestehende Komponenten in diesem Paket
- keine neuen Runtime-Dependencies
- keine CDN-Abhaengigkeit
- Contract v2, RMT, Fabric, Telemetry, A11y und Performance werden zentral als Metadata Overlay beschrieben

Der maschinenlesbare Katalog liegt in `catalog/epic10-existing-component-metadata.js`.

## Zielkomponenten

| Komponente | Prioritaet | Rolle |
|------------|------------|-------|
| `x-router` | `P0` | Routing Host, XRouter Adapter, Runtime Route Registration |
| `x-link` | `P0` | Navigation, Route Activation, Keyboard Link Contract |
| `x-input` | `P0` | Form Value, Validation, Event Commands |
| `x-form` | `P0` | Form Aggregation, Child Control Discovery |
| `x-modal` | `P0` | Overlay State, Focus Trap, Modal Actions |
| `x-dialog` | `P0` | Overlay State, Focus Trap, Size Hints |
| `x-tabs` | `P0` | Tab Records, Keyboard Selection, Route Panel Mapping |
| `x-toast` | `P1` | Feedback Status, Dismissal Command, Timer Policy |
| `x-alert` | `P1` | Feedback Status, Dismissal Command, State Sync |

## Contract Mapping

Jeder Record im Katalog liefert:

- `xtend.component.contract.v2`
- `xtend.rmt.component-contract.v1`
- `xtend.component.fabric-boundary.v2`
- `xtend.fabric.telemetry-snapshot.v1`
- Lane Precedence aus `rmt.schedule-record`, `rmt.component-metadata`, `fabric.runtime-override`, `component.static-contract`, `scaffold.blueprint-default`
- RMT Template Mode `dom_descriptor`
- Event Binding Mode `dom-event-to-rmt-command`
- Kernel Boundary `no-rmt-kernel-import-of-xtend-types`

## RMT Boundary

RMT darf die bestehenden Komponenten als Records authoren, aber nicht deren Klassen oder Typen importieren. Der RMT-Kernel sieht nur:

- Tag
- Props
- Attribute
- Slots
- Events
- Schedule
- Hydration
- Fabric
- A11y
- Performance

Die DOM-Ausfuehrung bleibt bei XTend Host-Adaptern.

## Lokaler Gate

```bash
node scripts/run_xtend_tests.js existing-component-metadata --json
```

Der Gate prueft:

- Zielkomponenten und Reihenfolge
- Contract-v2-Validierung pro Komponente
- RMT/Fabric/Telemetry/Lane-Metadata
- vorhandene Runtime-, Type-, Docs-, Fixture- und Suite-Pfade
- Package-, Scaffold-, Epic-, Backlog-, Docs- und Referenzpfade

## Handoff

`WP-E10-15` kann diese Metadata-Linie fuer Browser-, A11y-, Performance- und Visual-Gates verwenden. Eine spaetere TypeScript-Migration bleibt moeglich, ist aber nicht Voraussetzung fuer RMT-first App Authoring.
