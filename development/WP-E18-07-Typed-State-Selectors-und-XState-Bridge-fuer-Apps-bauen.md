# WP-E18-07 - Typed State, Selectors und XState Bridge fuer Apps bauen

- Status: `completed`
- Prioritaet: `P0`
- Workstream: `WS4`
- Contract: `xtend.epic18.rmt-state-selector-runtime.v1`
- Fixture: `xtend.epic18.rmt-state-selector-runtime-fixture.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-state-selector-runtime --json`

## Ziel

App-Zustand ist deklarativ, typisiert und komponentennah verwendbar. Der Slice
setzt auf den component-native Template Primitives aus `WP-E18-06` auf und
liefert die State-Schicht, ohne `xstate` direkt in den RMT Kernel zu ziehen.

## Ergebnisartefakte

| Pfad | Zweck |
|------|-------|
| `catalog/epic18-rmt-state-selector-runtime.js` | maschinenlesbarer Contract fuer Typed State, Selectors, Reducers, XState Bridge und Preserve-Regeln |
| `tests/fixtures/rmt-state-selector-runtime.rmt` | produktneutrale Fixture fuer Collection, Selection, Filter, UI-State und DOM-Preserve |
| `tests/rmt/rmt_state_selector_runtime_suite.js` | lokaler Gate `rmt-state-selector-runtime` |
| `docs/rmt-state-selector-runtime.md` | Entwicklerdokumentation |
| `xtendrmt/rmt-state-selector-runtime.js` | Runtime fuer State Graph, Selectors, Reducers, XState Bridge und State Bindings |
| `xtendrmt/rmt-state-selector-runtime.d.ts` | TypeScript-Oberflaeche fuer die neue Runtime |

## Implementierte Garantien

- State Definitions pruefen `collection`, `object`, `boolean`, `string`,
  `number` und `nullable`
- Selectors und derived Values speisen direkt das Render-Context-Model
- Reducer-Commands aktualisieren State deterministisch und spiegeln nach
  injiziertem `xstate`
- Selection- und UI-State koennen DOM erhalten und nur Attribute/Klassen
  synchronisieren
- Filter- und Collection-Aenderungen koennen strukturelle Rerenders anfordern
- die Runtime importiert weder XTend-Komponenten noch `xstate`

## Gate-Ergebnis

- `node scripts/run_xtend_tests.js rmt-state-selector-runtime --json`
  - Status: `passed` (1 Suite, 175 Assertions)
- RMT-App-Platform-Kette:
  - `node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json`
  - Status: `passed` (10 Suites, 1334 Assertions)
- Erweiterte Referenz-/Export-Kette:
  - `node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-state-selector-runtime rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build references type-exports-rmt type-exports epic13-package-export-lock --json`
  - Status: `passed` (14 Suites, 9773 Assertions)

## Handoff

`WP-E18-08` ist nach Abschluss dieses Gates startbar. Der naechste Slice soll
Actions, Effects, DataSources und Resource Runtime auf den State Graph setzen.
