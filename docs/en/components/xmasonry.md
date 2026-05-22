# xmasonry - XTend Component

> **See also:** [xcards](./xcards.md), [xsection](./xsection.md)

## Overview

`<x-masonry>` is a flexible grid layout for tile-like arrangements
(masonry layout). It is suitable for galleries, cards, and dynamic content.

---

## Features

- Masonry layout (Pinterest style)
- Responsive design
- Theming through CSS custom properties

---

## Usage

```html
<x-masonry>
  <div>Item 1</div>
  <div>Item 2</div>
</x-masonry>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `columns` | Number | number of columns (default: 3) |
| `gap` | String | spacing between items (default: 1rem) |

---

## Events

| Event | Description |
|-------|-------------|
| - | - |

---

## API

- **Set columns dynamically:** `element.setAttribute('columns', 4)`

---

## Example: Dynamic JS

```js
const masonry = document.createElement('x-masonry');
masonry.setAttribute('columns', 4);
document.body.appendChild(masonry);
```

---

## Styling and Theming

```css
x-masonry {
  --masonry-gap: 2rem;
}
```

---

## Accessibility

- Semantic HTML

---

*Last updated: July 16, 2025*

## Layout Display Media UX Profile

Starting with `WP-E11-12`, `x-masonry` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. The component can be
authored as a responsive layout grid with deterministic reflow scheduling and
uses the state key `xmasonry-state-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `layout.reflow.commit`
- Event: `masonry-layout`
- Snapshot: `snapshot()`
- CSS parts: `root`, `grid`, `item`, `toggle`, `content`

## ECH-WP-07 Token Table and signatureDesign

`signatureDesign`: reorderable enterprise masonry with tactile depth,
icon-only toggle control, and themeable drag feedback. The component is suited
for galleries, dashboards, and knowledge layouts without text-character
controls.

| Token | Purpose |
| --- | --- |
| `--xtend-layout-surface` | masonry item surface |
| `--xtend-layout-text` | item text color |
| `--xtend-layout-border-color` | item and drop edges |
| `--xtend-layout-radius` | item radius |
| `--xtend-layout-elevation` | item and drag shadow |
| `--xtend-layout-spacing` | item padding |
| `--xtend-layout-gap` | grid spacing |
| `--xtend-layout-font-family` | masonry typography |
| `--xtend-layout-font-size` | item text size |
| `--xtend-layout-media-radius` | toggle/media radius |
| `--xtend-layout-focus-ring` | toggle focus |
| `--xtend-layout-grid-min` | grid lower bound |
| `--xtend-layout-content-max` | masonry max width |

## ECH-WP-07 External Theme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-masonry {
  --xtend-layout-surface: #fbf7f1;
  --xtend-layout-text: #1b2823;
  --xtend-layout-border-color: rgba(27, 40, 35, 0.2);
  --xtend-layout-radius: 0.35rem;
  --xtend-layout-elevation: 0 10px 28px rgba(27, 40, 35, 0.12);
  --xtend-layout-spacing: 1.25rem;
  --xtend-layout-gap: 1rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 1rem;
  --xtend-layout-media-radius: 999px;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(14rem, 1fr);
  --xtend-layout-content-max: 72rem;
}
```
