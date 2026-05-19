# RMT State Selector Runtime

- Contract: `xtend.epic18.rmt-state-selector-runtime.v1`
- Fixture: `tests/fixtures/rmt-state-selector-runtime.rmt`
- Runtime: `xtendrmt/rmt-state-selector-runtime.js`
- Types: `xtendrmt/rmt-state-selector-runtime.d.ts`
- Local Gate: `node scripts/run_xtend_tests.js rmt-state-selector-runtime --json`
- Workpackage: `WP-E18-07`

Die State Selector Runtime macht App-Zustand fuer RMT Templates deklarativ
nutzbar. Sie definiert typisierte State Records, wertet Selectors und derived
Values aus, dispatcht Reducer-Commands und erzeugt ein Render-Context-Model fuer
den DOM Descriptor Renderer aus `WP-E18-05`/`WP-E18-06`.

## Primitives

| Primitive | Zweck |
|-----------|-------|
| `state` | typisierte App-Zustaende wie Collection, Selection, Filter, UI und Loading |
| `selector` | abgeleitete, wiederverwendbare Sichten auf State, zum Beispiel gefilterte Listen |
| `derive` | einzelne derived Values wie Selection Count oder Detail Label |
| `reducer` | Command-getriebene State-Aenderungen ohne produktlokale Mini-Frameworks |
| `xstateBridge` | injizierte Host-Bridge zu `xstate`, ohne Runtime-Import |
| `preservePatchPlan` | unterscheidet strukturelle Rerenders von Attribut-/Component-State-Sync |
| `stateBindings` | aktualisiert Attribute, Klassen und Properties bestehender DOM-Knoten |

## Preserve-Regeln

States mit `preserve: "attribute-sync"` oder `preserve: "component-state"`
duerfen DOM-Inseln erhalten. Selection- oder UI-Aenderungen koennen dadurch
Attribute wie `aria-selected`, Klassen wie `is-selected` oder Component
Properties synchronisieren, ohne Listen neu zu materialisieren.

Strukturelle Selectors, zum Beispiel `selector.filtered-items`, duerfen dagegen
einen Rerender anfordern. Filter- oder Collection-Aenderungen bleiben dadurch
korrekt, waehrend reine Selection-Aenderungen Fokus, Scroll und Component
Instanzen erhalten koennen.

## XState Boundary

Die Runtime importiert `xstate` nicht. Host-Code kann ein kompatibles Ziel mit
`set`, `setState`, `get`, `getState` oder `subscribe` injizieren. Die Bridge
spiegelt State-, Selector- und Derived-Keys in dieses Ziel, bleibt aber auch mit
einem internen Snapshot lauffaehig.

`WP-E18-08` kann darauf Actions, Effects, DataSources und Resource Runtime
aufbauen.
