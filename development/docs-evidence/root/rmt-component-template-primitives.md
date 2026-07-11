# RMT Component Template Primitives

- Schema: `xtend.epic18.rmt-component-template-primitives.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-component-template-primitives --json`
- Workpackage: `WP-E18-06`
- Handoff: `WP-E18-07`

Component template primitives erlauben RMT, Custom Elements deklarativ zu materialisieren. Die Primitive bleibt component-native und erzeugt keine HTML-Strings.

## Primitive

- `component`
- `props`
- `attributes`
- `parts`
- `slots`
- `class`
- `style-token`
- `ref`
- `when`
- `repeat`
- `empty`
- `fallback`

## Component Families

Die Fixture deckt generische Familien wie `x-tooltip`, `x-select`, Navigation, Listen, Selection, Empty State und Error State ab.
