# XTend P0-Komponentenwelle und Contract-Stubs

- Status: `accepted-contract`
- Workpackage: `WP-E10-08`
- Contract: `xtend.epic10.p0-component-wave.v1`
- Stub-Contract: `xtend.epic10.p0-component-contract-stub.v1`
- Gate: `xtend.epic10.p0-component-wave-gate.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic10-p0-component-wave --json`

## Zielbild

WP-E10-08 schneidet die erste Enterprise-Komponentenwelle so, dass die folgenden Implementierungspakete nicht mehr ueber Scope, Reifeziel oder Schnittstellenform entscheiden muessen. Die Komponenten werden noch nicht produktiv gebaut. Sie erhalten aber verbindliche Contract-Stubs auf Basis von `xtend.component.contract.v2`, TypeScript Source Strategy, RMT Component Metadata, Fabric Boundary, Telemetry, Lanes, A11y und Performance-Profilen.

Die Welle ist bewusst klein genug fuer stabile Umsetzung und gross genug, um die wichtigsten Blind Spots nach `x-input`, `x-form`, `x-dialog`, `x-modal`, `x-router` und `x-link` zu schliessen.

## Priorisierte P0-Komponenten

| Reihenfolge | Komponente | Paket | Familie | Reifeziel | Warum P0 |
|-------------|------------|-------|---------|-----------|----------|
| 1 | `x-select` | `WP-E10-09` | Form Selection | `stable` | schliesst die groesste Form-Control-Luecke und definiert Option-Slots, Value Events und Validierung |
| 2 | `x-checkbox` | `WP-E10-09` | Form Selection | `stable` | liefert Binary-Input, `checked`, `indeterminate` und Form-Integration |
| 3 | `x-radio` | `WP-E10-09` | Form Selection | `stable` | vervollstaendigt Selection Controls mit Group Coordination und Keyboard-Navigation |
| 4 | `x-textarea` | `WP-E10-10` | Form Input | `stable` | ergaenzt Long-Form Input, Validation, Counter und Stateful Value Contracts |
| 5 | `x-status` | `WP-E10-10` | Feedback | `stable` | standardisiert Status-, Validation- und Scheduler-Feedback mit Live-Region-Semantik |
| 6 | `x-progress` | `WP-E10-10` | Feedback | `stable` | macht geplante/langlaufende Tasks, Uploads und Hydration-Fortschritt RMT-schedulbar |
| 7 | `x-tooltip` | `WP-E10-11` | Overlay Feedback | `stable` | liefert leichte Kontext-Hilfe ohne Popover-Abhaengigkeit |
| 8 | `x-popover` | `WP-E10-11` | Overlay Interactive | `stable` | deckt interaktive, verankerte Overlays fuer Menues, Filter und Aktionen ab |
| 9 | `x-drawer` | `WP-E10-11` | Overlay Navigation | `stable` | bringt Shell-, Navigation- und Side-Panel-Muster fuer RMT-first Apps |

## Paketgrenzen

`WP-E10-09` baut die erste Referenzlinie fuer Form Selection Controls: `x-select`, `x-checkbox`, `x-radio`.

`WP-E10-10` erweitert Form und Feedback: `x-textarea`, `x-status`, `x-progress`.

`WP-E10-11` liefert Overlay- und Navigationserweiterungen: `x-tooltip`, `x-popover`, `x-drawer`.

`WP-E10-15` nutzt die Welle spaeter fuer Browser-, A11y-, Performance- und Visual-Gates.

## Contract-Stub Mindestform

Jeder Stub muss folgende Domains enthalten:

- `componentContract`: `xtend.component.contract.v2`
- `sourceState`: `ts-planned`
- `targetMaturity`: `stable`
- `rmt.adapter`: `xtend.component`
- `rmt.kernelBoundary`: `no-rmt-kernel-import-of-xtend-types`
- `fabric.api`: `@xtend-fabric`
- `telemetry.snapshot`: `xtend.fabric.telemetry-snapshot.v1`
- `a11y.contract`: `xtend.a11y.component-contract.v1`
- `performance.contract`: `xtend.performance.component-profile.v1`

Jeder Stub muss die TypeScript-Blueprint-Artefakte verlangen:

- `ts-source`
- `ts-contract`
- `ts-rmt`
- `ts-a11y`
- `ts-performance`
- `ts-fixture`

Runtime- und Begleitartefakte bleiben weiterhin `component`, `types`, `manifest`, `docs`, `tests`, `fixtures` und `demo`.

## RMT- und Fabric-Regeln

RMT bleibt host-neutral. Die Stubs beschreiben nur, wie XTend-Komponenten als `xtend.component` Records authorbar werden. Der RMT-Kernel importiert keine XTend-Typen und kennt keine konkreten Klassen.

Fabric ist Pflichtoberflaeche fuer Lifecycle-Schutz, Diagnostics und Telemetry. Die Komponenten muessen Fabric-Kontext, Lane-Hints, Fiber-Hints und Telemetry-Aufrufe aufnehmen koennen. Die Lane-Quelle bleibt deterministisch:

1. `rmt.schedule-record`
2. `rmt.component-metadata`
3. `fabric.runtime-override`
4. `component.static-contract`
5. `scaffold.blueprint-default`

## A11y- und Performance-Regeln

Form Controls muessen Label, Error Region, Keyboard-Navigation und Screenreader-Signale ab dem ersten produktiven Commit enthalten.

Feedback-Komponenten muessen Live-Regionen, Reduced Motion und non-color Statussignale abdecken.

Overlay-Komponenten muessen Escape, Fokus-Rueckgabe, Outside Click, modal/non-modal Verhalten und Reduced Motion klaeren.

Performance bleibt Profile-first. Jeder Stub enthaelt Budgetklasse, Lane, Hydration Policy und kritische Messpunkte.

## Maschinenlesbare Quelle

Die maschinenlesbare Quelle liegt in:

- `catalog/epic10-p0-component-wave.js`

Sie exportiert:

- `createP0ComponentWavePlan()`
- `validateP0ComponentWavePlan(plan)`
- `createP0ComponentWaveGate()`
- `P0_COMPONENT_WAVE_DEFINITIONS`
- `EXPECTED_COMPONENT_ORDER`
- `WORKPACKAGE_COMPONENT_MAP`

## Abnahme

WP-E10-08 ist abgeschlossen, wenn:

- alle neun P0-Komponenten als Stub modelliert sind
- `WP-E10-09`, `WP-E10-10` und `WP-E10-11` klare Komponentenscopes haben
- Package-, Scaffold- und Reference-Metadaten auf den Contract zeigen
- `node scripts/run_xtend_tests.js epic10-p0-component-wave --json` erfolgreich laeuft
- `node scripts/run_xtend_tests.js references --json` die neuen Pfade sieht

