# WP-E18-05 - Sicheren DOM Descriptor Renderer und No-Manual-HTML-Gate bauen

- Status: `completed`
- Prioritaet: `P0`
- Workstream: `WS2`
- Contract: `xtend.epic18.rmt-dom-descriptor-renderer.v1`
- Fixture: `xtend.epic18.rmt-dom-descriptor-renderer-fixture.v1`
- Diagnostic Schema: `xtend.epic18.rmt-dom-renderer-diagnostic.v2`
- Local Gate: `node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json`

## Ziel

RMT Templates koennen jetzt ohne produktspezifischen Host-Renderer und ohne
externe HTML-String-Hilfskruecken als DOM Descriptor ausgefuehrt werden.

## Ergebnisartefakte

| Pfad | Zweck |
|------|-------|
| `xtendrmt/rmt-dom-descriptor-renderer.js` | generischer Runtime-Renderer fuer DOM Descriptoren |
| `xtendrmt/rmt-dom-descriptor-renderer.d.ts` | oeffentliche Typoberflaeche |
| `catalog/epic18-rmt-dom-descriptor-renderer.js` | maschinenlesbarer Contract, Gate- und Handoff-Metadaten |
| `tests/fixtures/rmt-dom-descriptor-renderer.rmt` | produktneutrale RMT-Fixture fuer Shell, Slots, Repeat und Trusted Boundary |
| `tests/rmt/rmt_dom_descriptor_renderer_suite.js` | lokaler Gate `rmt-dom-descriptor-renderer` |
| `docs/en/rmt-dom-descriptor-renderer.md` | Entwicklerdokumentation |

## Implementierte Garantien

- normale App-UI wird ueber `createElement`, `createTextNode`,
  `createDocumentFragment` und `replaceChildren` materialisiert
- Attribute, Properties, Styles und Events laufen ueber strukturierte sichere
  Setter
- keyed Children werden per `data-rmt-key` wiederverwendet und gepatcht
- Trusted HTML ist nur ueber `xtend.rmt.trusted-dom-boundary.explicit` und
  einen expliziten `trustedDomRenderer` moeglich
- das No-Manual-HTML-Gate blockiert normale Shell-Hilfsrenderer mit
  `root.innerHTML`, `element.innerHTML`, `template.innerHTML`,
  `insertAdjacentHTML`, `outerHTML`, `document.write` und
  `createContextualFragment`
- Runtimefehler tragen Source-Diagnostics mit RMT `documentId`, `templateId`
  und `pointer`

## Gate-Ergebnis

- `node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json`
  - Status: `passed`
  - Assertions: `153`
  - Failures: `0`
- RMT-App-Platform-Kette:
  - `node scripts/run_xtend_tests.js rmt-app-platform-authoring rmt-dom-descriptor-renderer rmt-vnext-compiler rmt-vnext-events rmt-vnext-surfaces rmt-vnext-security rmt-first-demo-app scaffold-rmt-build --json`
  - Status: `passed`
  - Suites: `8`
  - Assertions: `970`
  - Failures: `0`

## Handoff

`WP-E18-06` ist jetzt startbar. Der naechste Slice soll component-native
Template-Primitives auf dem generischen Renderer aufbauen, statt wieder
produktspezifische oder HTML-stringbasierte Host-Renderer einzufuehren.
