# RMT DOM Descriptor Renderer

- Contract: `xtend.epic18.rmt-dom-descriptor-renderer.v1`
- Fixture: `tests/fixtures/rmt-dom-descriptor-renderer.rmt`
- Runtime: `xtendrmt/rmt-dom-descriptor-renderer.js`
- Local gate: `node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json`
- Workpackage: `WP-E18-05`

The renderer implements the `WP-E18-04` authoring model as a generic app platform. Normal app UI is built from structured descriptors: `createElement`, `createTextNode`, `createDocumentFragment`, `replaceChildren`, safe attributes/properties and keyed child reuse.

## Descriptor Rules

| Area | Rule |
|------|------|
| Shell | Root render units use `replaceChildren` and mark the root with `data-rmt-rendered-shell`. |
| Elements | Tags must be simple custom-element or HTML tag names. |
| Attributes | Inline handlers, `srcdoc` and unsafe URL values are rejected. |
| Properties | HTML-sink properties are blocked for normal UI. |
| Lists | `renderKeyed` preserves nodes via `data-rmt-key` and patches attributes/children. |
| Events | Events run through `addEventListener`, not through string attributes. |
| Diagnostics | Runtime errors include RMT source information such as `documentId`, `templateId` and `pointer`. |

## Trusted Boundary

HTML fragments are not a normal template path. They may only be rendered as `trusted_html` with `xtend.rmt.trusted-dom-boundary.explicit` and an external `trustedDomRenderer`. The default renderer creates no HTML fragments from strings.

## No Manual HTML

The gate `createNoManualHtmlGate()` blocks normal app shells that use manual HTML sinks such as `root.innerHTML`, `element.innerHTML`, `template.innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` and `createContextualFragment`.

`WP-E18-06` can build component-native template primitives on top of this slice without requiring external HTML helper renderers.
