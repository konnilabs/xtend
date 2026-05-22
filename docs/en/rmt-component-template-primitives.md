# RMT Component Template Primitives

- Contract: `xtend.epic18.rmt-component-template-primitives.v1`
- Fixture: `tests/fixtures/rmt-component-template-primitives.rmt`
- Runtime base: `xtendrmt/rmt-dom-descriptor-renderer.js`
- Local gate: `node scripts/run_xtend_tests.js rmt-component-template-primitives --json`
- Workpackage: `WP-E18-06`

RMT can now compose XTend components natively without host apps assembling HTML strings. This slice extends the DOM Descriptor Renderer with component-close primitives for app shells, lists, forms, tooltips, icons, empty states and error states.

## Primitives

| Primitive | Purpose |
|-----------|---------|
| `component` | Resolves a component ID to a custom element such as `x-section`, `x-card`, `x-tooltip` or arbitrary developer tags. |
| `props` | Sets safe DOM properties and mirrors primitive values as attributes. |
| `attributes` | Sets safe attributes without inline-event or URL sinks. |
| `parts` | Writes CSS parts for themeable components. |
| `slots` | Fills slots with text, templates, components or fragments. |
| `text` | Creates text nodes through `createTextNode`. |
| `when` | Renders conditional subtrees. |
| `repeat` | Renders lists and uses `key` for stable nodes. |
| `empty` | Renders an explicit empty state. |
| `fallback` | Renders declarative fallback content. |
| `key` | Marks reusable list elements with `data-rmt-key`. |
| `ref` | Writes `data-rmt-ref` and stores the element reference in `refs`. |
| `class` | Maps classes from strings, arrays or conditional objects. |
| `style-token` | Mirrors design tokens as `data-style-token-*` and `--xtend-*`. |

## Component Families

The fixture proves generic families instead of product surfaces: icons, tooltips, form controls (`x-input`, `x-select`, `x-checkbox`), navigation, lists, selection, empty state, error state and free custom elements. Components remain developer-defined; RMT only knows descriptors and adapter capabilities.

## Component Capability Registry

The vNext layer connects these primitives to the full XTend component stack
through `xtendrmt/rmt-component-capability-registry.js`. The registry
normalizes all 42 public manifest entries, classifies 38 renderable UI
components, and connects Component Contracts, `xtendRmtMetadata`,
`observedAttributes`, events, slots, parts, form state, and lazy import with the
generic DOM descriptors.

That keeps `component`, `props`, `attributes`, `parts`, `slots`, `repeat`, and
`key` as the same primitives, but gives them a stack-wide compatibility matrix.
Product code does not need Shadow-DOM patches, private component maps, or
component-specific renderers.

See [RMT vNext Component Primitives and XTend UI](./rmt-vnext-component-primitives.md).
