# WP-E18-06 - Component-native Template Primitives fuer RMT implementieren

- Status: `completed`
- Prioritaet: `P0`
- Workstream: `WS3`
- Contract: `xtend.epic18.rmt-component-template-primitives.v1`
- Fixture: `xtend.epic18.rmt-component-template-primitives-fixture.v1`
- Local Gate: `node scripts/run_xtend_tests.js rmt-component-template-primitives --json`

## Ziel

Entwickler koennen XTend-Komponenten nativ in RMT komponieren. Die Runtime
nutzt den sicheren DOM Descriptor Renderer aus `WP-E18-05` und benoetigt keine
externen HTML-String-Hilfsrenderer.

## Ergebnisartefakte

| Pfad | Zweck |
|------|-------|
| `catalog/epic18-rmt-component-template-primitives.js` | maschinenlesbarer Contract fuer Primitives, Component-Familien und Handoff |
| `tests/fixtures/rmt-component-template-primitives.rmt` | produktneutrale Fixture fuer Component-Familien, Slots, Repeat, Empty, Error und Fallback |
| `tests/rmt/rmt_component_template_primitives_suite.js` | lokaler Gate `rmt-component-template-primitives` |
| `docs/rmt-component-template-primitives.md` | Entwicklerdokumentation |
| `xtendrmt/rmt-dom-descriptor-renderer.js` | erweiterte Runtime fuer `class`, `parts`, `style-token`, `ref`, Slot-Objekte und `fallback` |
| `xtendrmt/rmt-dom-descriptor-renderer.d.ts` | Typoberflaeche fuer Ref-Capture |

## Implementierte Garantien

- `component`, `props`, `attributes`, `parts`, `slots`, `text`, `when`,
  `repeat`, `empty`, `fallback`, `key`, `ref`, `class` und `style-token`
  sind als Runtime-Primitives abgedeckt
- Icons, Tooltips, Form Controls, Navigation, Listen, Selection, Empty State,
  Error State und beliebige Custom Elements werden generisch komponiert
- normale App-UI bleibt `dom_descriptor` und enthaelt keine HTML-String-Sinks
- Component-Familien sind frei definierbar und keine Kopie von Media-Manager-
  Surfaces
- `WP-E18-07` kann Typed State und Selectors auf diese Primitives aufsetzen

## Gate-Ergebnis

- `node scripts/run_xtend_tests.js rmt-component-template-primitives --json`
  - Status: `passed` (1 Suite, 189 Assertions)
- RMT-App-Platform-Kette:
  - `node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json`
  - Status: `passed` (9 Suites, 1159 Assertions)
- Erweiterte Referenz-/Export-Kette:
  - `node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-component-template-primitives rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build references type-exports-rmt type-exports epic13-package-export-lock --json`
  - Status: `passed` (13 Suites, 9585 Assertions)

## Handoff

`WP-E18-07` ist nach Abschluss dieses Gates startbar. Der naechste Slice soll
Typed State, Selectors und XState Bridge liefern, damit component-native
Primitives deklarativ und partiell aktualisiert werden koennen.
