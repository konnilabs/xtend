# RMT State Selector Runtime

- Contract: `xtend.epic18.rmt-state-selector-runtime.v1`
- Fixture: `tests/fixtures/rmt-state-selector-runtime.rmt`
- Runtime: `xtendrmt/rmt-state-selector-runtime.js`
- Types: `xtendrmt/rmt-state-selector-runtime.d.ts`
- Local gate: `node scripts/run_xtend_tests.js rmt-state-selector-runtime --json`
- Workpackage: `WP-E18-07`

The State Selector Runtime makes app state declaratively usable for RMT templates. It defines typed state records, evaluates selectors and derived values, dispatches reducer commands and creates a render-context model for the DOM Descriptor Renderer from `WP-E18-05`/`WP-E18-06`.

## Primitives

| Primitive | Purpose |
|-----------|---------|
| `state` | typed app states such as collection, selection, filter, UI and loading |
| `selector` | derived, reusable views on state, for example filtered lists |
| `derive` | individual derived values such as selection count or detail label |
| `reducer` | command-driven state changes without product-local mini-frameworks |
| `xstateBridge` | injected host bridge to `xstate`, without runtime import |
| `preservePatchPlan` | distinguishes structural rerenders from attribute/component-state sync |
| `stateBindings` | updates attributes, classes and properties of existing DOM nodes |

## Preserve Rules

States with `preserve: "attribute-sync"` or `preserve: "component-state"` may preserve DOM islands. Selection or UI changes can therefore sync attributes such as `aria-selected`, classes such as `is-selected` or component properties without materializing lists again.

Structural selectors, for example `selector.filtered-items`, may request a rerender instead. Filter or collection changes therefore stay correct, while pure selection changes can preserve focus, scroll and component instances.

## XState Boundary

The runtime does not import `xstate`. Host code can inject a compatible target with `set`, `setState`, `get`, `getState` or `subscribe`. The bridge mirrors state, selector and derived keys into that target, but also remains runnable with an internal snapshot.

`WP-E18-08` can build actions, effects, datasources and resource runtime on top of this.
