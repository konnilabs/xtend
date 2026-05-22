# xfooter - XTend Component

> **See also:** [xheader](./xheader.md), [xtheme](./xtheme.md)

## Overview

`<x-footer>` is a customizable footer component with logo, sticky option, and
state integration. It is useful for branding and navigation at the end of a
page.

---

## Features

- Optional logo (`src` attribute)
- Sticky behavior (stays at the bottom)
- State integration through xstate
- Theming through CSS custom properties

---

## Usage

```html
<x-footer src="logo.svg" logo-size="48" sticky></x-footer>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `src` | String | logo URL |
| `logo-size` | String | logo size, for example 48, 64px |
| `sticky` | Boolean | footer stays at the bottom |

---

## Events

| Event | Description |
|-------|-------------|
| - | - |

---

## API

- **Set logo dynamically:** `element.setAttribute('src', 'logo.svg')`
- **Enable sticky:** `element.setAttribute('sticky', '')`
- **State integration:** automatic through xstate

---

## Example: Dynamic JS

```js
const footer = document.createElement('x-footer');
footer.setAttribute('src', 'logo.svg');
document.body.appendChild(footer);
```

---

## Styling and Theming

```css
x-footer {
  --header-bg: #222;
  --header-fg: #fff;
}
```

---

## Accessibility

- Semantic HTML, ARIA

---

*Last updated: July 16, 2025*

## Layout Display Media UX Profile

Starting with `WP-E11-12`, `x-footer` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. The component can be
mounted visibly as an RMT shell footer and uses the state key
`xfooter-state-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.visible.mount`
- Events: `footer-ready`, `theme-applied`, `logo-loaded`
- Snapshot: `snapshot()`
- CSS parts: `root`, `title`, `logo`, `nav`, `extra`

## ECH-WP-07 Token Table and signatureDesign

`signatureDesign`: calm enterprise footer with precise navigation,
logo-safe media area, and subtle signature depth. The default design remains
polished, but can be fully overridden by corporate themes.

| Token | Purpose |
| --- | --- |
| `--xtend-layout-surface` | footer surface |
| `--xtend-layout-text` | text and link color |
| `--xtend-layout-border-color` | footer and link edge |
| `--xtend-layout-radius` | footer and link radius |
| `--xtend-layout-elevation` | footer shadow |
| `--xtend-layout-spacing` | footer padding |
| `--xtend-layout-gap` | title, nav, and content spacing |
| `--xtend-layout-font-family` | footer typography |
| `--xtend-layout-font-size` | footer font size |
| `--xtend-layout-media-radius` | logo radius |
| `--xtend-layout-focus-ring` | link focus |
| `--xtend-layout-grid-min` | responsive footer cell width |
| `--xtend-layout-content-max` | footer max width |

## ECH-WP-07 External Theme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-footer {
  --xtend-layout-surface: #f8f4ef;
  --xtend-layout-text: #1e2420;
  --xtend-layout-border-color: rgba(30, 36, 32, 0.2);
  --xtend-layout-radius: 0.25rem;
  --xtend-layout-elevation: 0 8px 24px rgba(30, 36, 32, 0.1);
  --xtend-layout-spacing: 1.15rem;
  --xtend-layout-gap: 0.85rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 0.95rem;
  --xtend-layout-media-radius: 0.15rem;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(11rem, 1fr);
  --xtend-layout-content-max: 72rem;
}
```
