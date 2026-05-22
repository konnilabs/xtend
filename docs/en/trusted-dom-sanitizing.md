# Trusted DOM and Sanitizing

- Contract: `xtend.docs.trusted-dom-sanitizing.v1`
- Security Policy: `xtend.security.trusted-dom-policy.v1`
- Sanitizing Boundary: `xtend.security.sanitizing-boundary.v1`
- Sanitizer Contract: `xtend.security.trusted-dom-sanitizer.v1`
- Machine-readable contract: `security/trusted-dom-policy.js`

## Goal

XTend treats dynamic markup as its own trust boundary. This matters especially
for RMT `html_fragment`, RMT template authoring, and the Parsedown-based Docs
App.

This page describes the developer rule: markup is classified first and then
written into an appropriate DOM sink. Raw HTML strings must not casually land in
`innerHTML`.

## Markup Classes

| Class | Source | Default |
|-------|--------|---------|
| `text` | labels, Markdown text, body copy | `textContent` |
| `attribute` | `aria-label`, `href`, `slot`, `data-*` | validated `setAttribute` |
| `structuredTemplate` | RMT `dom_descriptor`, component trees | nodes via `replaceChildren` |
| `htmlFragment` | RMT `html_fragment` | sanitizing boundary |
| `parsedownHtml` | HTML from `docs/index.php` / Parsedown | sanitizing boundary |

## Allowed and Restricted Sinks

Allowed:

- `textContent`
- validated `setAttribute`
- `classList`
- `dataset` without secrets and without code values
- `append` and `replaceChildren` with nodes

Restricted:

- `innerHTML`
- `insertAdjacentHTML`
- `template.innerHTML`

These restricted sinks require `xtend.security.sanitizing-boundary.v1`.
Browser-near docs/RMT sinks must also expose the sanitizer contract
`xtend.security.trusted-dom-sanitizer.v1`.

Forbidden by default:

- inline handlers such as `onclick`
- `eval`
- `new Function`
- dynamic script tags from RMT, manifest, event, or docs data

## RMT Templates

For XTendRMT:

- `dom_descriptor` is preferred.
- `html_fragment` is allowed only with a Trusted DOM boundary.
- Events use `actionRef`, `commandName`, `routeRef`, or typed payloads.
- The RMT kernel schedules records and diagnostics but does not sanitize HTML
  itself.
- Host adapters own the DOM sink.

```json
{
  "id": "settings.shell",
  "mode": "html_fragment",
  "markup": "<x-card></x-card>",
  "security": {
    "markupClass": "htmlFragment",
    "trustBoundary": "xtend.security.sanitizing-boundary.v1",
    "sink": "trustedDomBoundary"
  }
}
```

## Parsedown Docs App

The Docs App renders Markdown through `docs/index.php` and
`docs/utils/parsedown.php`. `Parsedown::setSafeMode(true)` remains mandatory,
but it does not replace a Trusted DOM policy. The app shell is now generated
shell-first from `docs.app.shell` in the RMT document; Parsedown HTML is then
inserted only into the `data-rmt-slot="content"` slot.

Rules:

- Markdown files are content.
- Parsedown output is `parsedownHtml`.
- RMT renders shell descriptors and may schedule Parsedown work.
- `docs.rich-content` and `docs.media.lazy` prepare future rich HTML and
  XPlayer tutorial slots.
- Sanitizing and DOM sinks remain host responsibilities.
- `WP-E13-11` checks this boundary in a browser-near way with
  [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md),
  `xtend.epic13.trusted-dom-boundary.v1`, and
  `node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json`.

## Diagnostics

Future implementations should use these codes:

- `xtend.security.trusted_dom.required`
- `xtend.security.sanitizer.missing`
- `xtend.security.sink.refused`
- `xtend.security.attribute.refused`
- `xtend.security.event.refused`

## Gates

```bash
node --check security/trusted-dom-policy.js
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
node scripts/run_xtend_tests.js references --json
```

## Related Documents

- [XTendRMT Native Authoring](./xtendrmt-native-authoring.md)
- [Trusted DOM Boundary Browser Proof](./trusted-dom-boundary-browser-proof.md)
- [XTendRMT Parsedown Scheduling Pilot](./xtendrmt-parsedown-scheduling.md)
- [XTendRMT App DSL Reference](./xtendrmt-app-dsl.md)
