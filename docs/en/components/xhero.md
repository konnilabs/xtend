# xhero - XTend Component

> **See also:** [xsection](./xsection.md), [xbutton](./xbutton.md)

## Overview

`<x-hero>` is a flexible hero component for high-impact headers, landing pages,
and entry points. It supports slots for title, subtitle, actions, and media.

---

## Features

- Flexible layout for hero areas
- Slots for title, text, actions, and media
- Theming through CSS custom properties
- Theme variants through `background-light`, `background-dark`,
  `font-color-light`, `font-color-dark`, `overlay-light`, and `overlay-dark`
- Responsive design

---

## Usage

```html
<x-hero>
  <h1 slot="title">Welcome!</h1>
  <p slot="subtitle">XTend makes web development simple.</p>
  <x-button slot="action">Get started</x-button>
</x-hero>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `background` | String | fixed background or CSS variable |
| `background-light` | String | background for light themes |
| `background-dark` | String | background for dark themes |
| `background-image` | String | image background |
| `overlay` | Boolean | activates overlay surface |
| `overlay-light` | String | overlay color for light themes |
| `overlay-dark` | String | overlay color for dark themes |
| `font-color` | String | fixed text color |
| `font-color-light` | String | text color for light themes |
| `font-color-dark` | String | text color for dark themes |
| `animate` | Boolean | activates entrance transition with reduced-motion fallback |

---

## Events

| Event | Description |
|-------|-------------|
| - | - |

---

## API

- **Insert content through slots**
- **State integration:** optional through xstate

---

## Example: Dynamic JS

```js
const hero = document.createElement('x-hero');
hero.innerHTML = '<h1 slot="title">Hello XTend!</h1>';
document.body.appendChild(hero);
```

---

## Styling and Theming

```css
x-hero {
  --hero-bg: #f5f5f5;
  --hero-color: #222;
}
```

## Viewport Safety

`x-hero` constrains host, root, and content to `max-width: 100%` and avoids
inner `100vw` width on narrow viewports. The component therefore stays inside
the visible viewport even in padded app shells or docs layouts.

---

## Accessibility

- Semantic HTML, ARIA

---

*Last updated: July 16, 2025*

## Layout Display Media UX Profile

Starting with `WP-E11-12`, `x-hero` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. The component remains a
hero/display shell and can be rendered first in RMT with
`component.shell.render`. The state key is `xhero-state-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.shell.render`
- Events: `hero-rendered`, `hero-animated`
- Snapshot: `snapshot()`
- CSS parts: `root`, `overlay`, `content`, `scroll-button`

## ECH-WP-07 Token Table and signatureDesign

`signatureDesign`: immersive enterprise hero composition with editorial depth,
media-capable surface, and tokenized content block. The default effect should
feel elegant and independent while allowing image, app, and corporate
presentation.

| Token | Purpose |
| --- | --- |
| `--xtend-layout-surface` | hero and content surface |
| `--xtend-layout-text` | hero text color |
| `--xtend-layout-border-color` | scroll-control edge |
| `--xtend-layout-radius` | hero, content, and title radius |
| `--xtend-layout-elevation` | hero, content, and title shadow |
| `--xtend-layout-spacing` | hero and content padding |
| `--xtend-layout-gap` | composition spacing for theme authors |
| `--xtend-layout-font-family` | hero typography |
| `--xtend-layout-font-size` | control and content scaling |
| `--xtend-layout-media-radius` | image/hero radius |
| `--xtend-layout-focus-ring` | scroll-control focus |
| `--xtend-layout-grid-min` | responsive composition base |
| `--xtend-layout-content-max` | content width |

## ECH-WP-07 External Theme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-hero {
  --xtend-layout-surface: rgba(248, 244, 239, 0.88);
  --xtend-layout-text: #15231d;
  --xtend-layout-border-color: rgba(21, 35, 29, 0.22);
  --xtend-layout-radius: 0.45rem;
  --xtend-layout-elevation: 0 20px 60px rgba(21, 35, 29, 0.16);
  --xtend-layout-spacing: 4rem 2rem;
  --xtend-layout-gap: 1rem;
  --xtend-layout-font-family: "Aptos Display", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 1.05rem;
  --xtend-layout-media-radius: 0.65rem;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(0, 1fr);
  --xtend-layout-content-max: 42rem;
}
```
