# xlink - XTend Component

## Overview

`<x-link>` is the declarative link component for XTend SPAs. It works with
`<x-router>`, detects hash and history mode, and keeps active state current
even during programmatic navigation.

## Usage

```html
<x-link href="/docs">Open documentation</x-link>
<x-link href="https://example.com">External link</x-link>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `href` | string | target path or external URL |
| `active` | boolean | set when the link is currently active |
| `state` | string | optional JSON for `history.pushState()` |

## Events

| Event | Description |
|-------|-------------|
| `before-navigate` | cancelable, before navigation |
| `after-navigate` | after successful navigation |

`before-navigate` and `after-navigate` provide:

```js
{
  href: '/docs',
  mode: 'history',
  state: { ... },
  source: 'x-link',
  stateKey: 'xlink-active-link-123',
  scheduleRef: 'ui.user-blocking.navigation'
}
```

## Contract

- internal links are normalized and navigate in SPA-compatible mode
- external links keep default behavior and automatically receive
  `target="_blank"` plus `rel="noopener noreferrer"`
- active state updates on `popstate`, `hashchange`, `x-navigate`, and
  `xrouter-after-navigate`
- active links mirror `aria-current="page"` and `xlink-active-<id>`
- Enter and Space activate the same navigation path
- long labels and slotted icon/text content remain overflow-safe in narrow
  menus, sidebars, and header drawers

## Navigation Routing UX Profile

`<x-link>` exposes `xtendNavigationRoutingUxProfile` with
`xtend.component.navigation-routing-ux-profile.v1`. The profile describes
`x-link` as a router link with `before-navigate`, `after-navigate`,
`x-navigate`, `xlink-active-<id>`, `ui.user-blocking.navigation`, active state,
keyboard activation, Fabric lane `user-blocking`, and RMT shell authoring.

The link component delegates route announcements to `x-router`, but remains
responsible for visible active state, keyboard activation, and safe external
links.

## Overflow Safety

`x-link` is overflow-safe for app-shell navigation, menus, and sidebars. The
host constrains itself to the available container, slotted content receives
`min-width: 0`, and long labels may wrap. For intentionally one-line links,
set `--xtend-link-white-space: nowrap`.

## Notes

- router mode is detected from the first discovered `<x-router>`
- identical target paths do not trigger redundant URL changes
- `x-link` uses the same navigation contract as `x-router`

## ECH-WP-09 Token Table and Navigation States

`signatureDesign`: `x-link` is the compact enterprise router link with visible
current indicator and tokenized active/disabled behavior. Active/current/
selected, hover, focus, and disabled states must remain readable in dense
headers, sidebars, and menus.

| Token | Purpose |
| --- | --- |
| `--xtend-nav-surface` | link surface |
| `--xtend-nav-text` | link text |
| `--xtend-nav-border-color` | shared navigation edge |
| `--xtend-nav-radius` | link radius |
| `--xtend-nav-gap` | spacing between icon and label |
| `--xtend-nav-font-family` | link typography |
| `--xtend-nav-font-size` | link text size |
| `--xtend-nav-active-surface` | active/current/selected surface |
| `--xtend-nav-active-text` | active/current/selected text |
| `--xtend-nav-current-indicator` | non-color-only current indicator |
| `--xtend-nav-hover-surface` | hover surface |
| `--xtend-nav-focus-ring` | keyboard focus |
| `--xtend-nav-disabled-opacity` | disabled dimming |

## ECH-WP-09 Keyboard Behavior

`Enter` and `Space` activate internal links through the same navigation path as
click. Disabled links remove the internal `href`, set `aria-disabled="true"`,
and are not keyboard-activatable. Active/current is mirrored through
`aria-current="page"`; composite navigation can add `aria-selected="true"` on
the host.

## ECH-WP-09 External Theme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-link {
  --xtend-nav-surface: transparent;
  --xtend-nav-text: #17231f;
  --xtend-nav-border-color: transparent;
  --xtend-nav-radius: 0.3rem;
  --xtend-nav-gap: 0.4rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 0.96rem;
  --xtend-nav-active-surface: rgba(181, 107, 53, 0.16);
  --xtend-nav-active-text: #173f35;
  --xtend-nav-current-indicator: #b56b35;
  --xtend-nav-hover-surface: rgba(181, 107, 53, 0.1);
  --xtend-nav-focus-ring: 3px solid #b56b35;
  --xtend-nav-disabled-opacity: 0.44;
}
```
