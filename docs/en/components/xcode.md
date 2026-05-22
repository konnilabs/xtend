# xcode - XTend Component

> See also: [xwriter](./xwriter.md), [xstate](./xstate.md)

## Overview

`<x-code>` renders code examples as an XTend Web Component with copy control,
state integration, theming, and optional Prism.js syntax highlighting. The
component is Shadow DOM based, so it can be used in any app or Developer Center
surface without global `pre code` selectors leaking into the host.

Prism remains optional and host-neutral. When `window.Prism` or a registered
XCode highlighter is available, XCode renders token spans. When no grammar is
available, the code remains safely escaped and visible as plain text.

## Usage

```html
<x-code lang="js">
  <template data-x-code-mode="text">console.log('Hello XTend!');</template>
</x-code>
```

The alias attribute `language` is supported for existing fixtures and external
hosts:

```html
<x-code language="rmt">
  <template data-x-code-mode="text">template docs.demo { surface root { lane visible { hydrate page } } }</template>
</x-code>
```

## Prism and RMT

The Developer Center loads `components/prism.js` followed by
`components/prism-rmt.js`. The RMT middleware registers `Prism.languages.rmt`
and the aliases `rmt-vnext` and `xtendrmt`. This lets every XCode instance
highlight RMT vNext app shells, primitives, lanes, events, and boundary rules:

- `template`, `state`, `selector`, `datasource`, `action`, `portal`,
  `overlay`, `resource`, `surface`, `remote surface`
- `lane`, lifecycle operations, `when`, `slot`, `trust boundary`, `sanitize`
- event bindings, payloads, reducer, effects, dotted primitive IDs, and
  component tags

Hosts can register their own highlighter:

```js
customElements.get('x-code')?.registerHighlighter({
  highlight({ code, language }) {
    return { html: code, highlighted: false, engine: 'plain-text', language };
  }
});
```

## Developer Center

Markdown code fences from Parsedown are converted to `<x-code>` after Trusted
DOM sanitizing. Every code surface in the Developer Center therefore uses the
same path:

- copy control and a11y signals from XCode
- `docs.syntax.highlight` as an RMT schedule
- Prism highlighting in Shadow DOM
- plain-text fallback without a raw HTML sink

## Attributes

| Attribute | Type | Description |
| --- | --- | --- |
| `lang` | String | primary language, for example `js`, `html`, `rmt` |
| `language` | String | compatibility alias when `lang` is not set |

## Events

| Event | Description |
| --- | --- |
| `code-copied` | emitted after successful copy control |

## API

- `hydrate()` rerenders code and highlighting.
- `snapshot()` returns language, code length, and highlighting metadata.
- `customElements.get('x-code').registerHighlighter(provider)` registers an
  optional host highlighter.

The snapshot adds these non-breaking fields:

- `highlighted`
- `highlightEngine`
- `highlightLanguage`
- `languageAlias`

## Layout Display Media UX Profile

`x-code` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. Code blocks can therefore
be authored in RMT as idle-hydratable display shells and use the state key
`xcode-state-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.idle.hydrate`
- Event: `code-copied`
- Snapshot: `snapshot()`
- CSS parts: `root`, `copy`, `pre`, `code`

## Token Table

ECH-WP-07 remains visible as the tokenization contract. `signatureDesign`:
readable enterprise code surface with clear copy control, internal overflow,
Prism-compatible token coloring, and an independent themeable monospace
personality.

| Token | Purpose |
| --- | --- |
| `--xtend-layout-surface` | code surface |
| `--xtend-layout-text` | code text color |
| `--xtend-layout-border-color` | code and copy edge |
| `--xtend-layout-radius` | code and copy radius |
| `--xtend-layout-elevation` | code shadow |
| `--xtend-layout-spacing` | code padding |
| `--xtend-layout-gap` | theme spacing for tooling |
| `--xtend-layout-font-family` | monospace/code typography |
| `--xtend-layout-font-size` | code font size |
| `--xtend-layout-media-radius` | copy-control radius |
| `--xtend-layout-focus-ring` | copy-control focus |
| `--xtend-layout-grid-min` | code layout minimum |
| `--xtend-layout-content-max` | code max width |
| `--x-code-token-keyword` | Prism keyword and RMT primitive |
| `--x-code-token-string` | Prism string |
| `--x-code-token-property` | Prism property and RMT IDs |
| `--x-code-token-class` | component tags |
| `--x-code-token-comment` | comments |

## External Theme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-code {
  --xtend-layout-surface: #151b19;
  --xtend-layout-text: #f7f1e7;
  --xtend-layout-border-color: rgba(247, 241, 231, 0.18);
  --xtend-layout-radius: 0.35rem;
  --xtend-layout-elevation: 0 16px 40px rgba(21, 27, 25, 0.22);
  --xtend-layout-spacing: 1.25rem 1.4rem;
  --xtend-layout-gap: 0.75rem;
  --xtend-layout-font-family: "Cascadia Code", "Fira Mono", monospace;
  --xtend-layout-font-size: 0.95rem;
  --xtend-layout-media-radius: 999px;
  --xtend-layout-focus-ring: 3px solid #d48b57;
  --xtend-layout-grid-min: minmax(0, 1fr);
  --xtend-layout-content-max: 68rem;
}
```
