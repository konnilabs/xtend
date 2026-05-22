# xcards - XTend Component

> **See also:** [xmasonry](./xmasonry.md), [xcalendar](./xcalendar.md), [xstate](./xstate.md)

## Overview

`<x-cards>` is a flexible grid layout for arbitrary content. It supports
responsive design, theming, and state integration.

---

## Features

- Grid layout with variable column count
- Responsive behavior (one column on mobile)
- Theming through CSS custom properties
- State integration through xstate

---

## Usage

```html
<x-cards columns="4" gap="2rem">
  <div>Card 1</div>
  <div>Card 2</div>
</x-cards>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `columns` | Number | number of columns (default: 3) |
| `gap` | String | spacing between cards (default: 1.5rem) |

---

## Events

| Event | Description |
|-------|-------------|
| - | - |

---

## API

- **Set columns dynamically:** `element.setAttribute('columns', 2)`
- **State integration:** automatic through xstate

---

## Example: Dynamic JS

```js
const cards = document.createElement('x-cards');
cards.setAttribute('columns', 2);
document.body.appendChild(cards);
```

---

## Styling and Theming

```css
x-cards {
  --card-columns: 4;
  --card-gap: 2rem;
}
```

---

## Accessibility

- Grid role, semantic HTML

---

*Last updated: July 16, 2025*

## Layout Display Media UX Profile

Starting with `WP-E11-12`, `x-cards` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. The component describes a
responsive card grid for RMT shell authoring and uses the state key
`xcards-state-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `layout.reflow.commit`
- Event: `cards-layout`
- Snapshot: `snapshot()`
- CSS parts: `root`, `grid`, `item`

## ECH-WP-07 Token Table and signatureDesign

`signatureDesign`: independent enterprise card rhythm with tokenized glass,
edge, depth, and typography. The default grid should not look like a generic
SaaS card grid while still remaining fully themeable.

| Token | Purpose |
| --- | --- |
| `--xtend-layout-surface` | card surface |
| `--xtend-layout-text` | card text color |
| `--xtend-layout-border-color` | card edge |
| `--xtend-layout-radius` | card radius |
| `--xtend-layout-elevation` | card shadow |
| `--xtend-layout-spacing` | card padding |
| `--xtend-layout-gap` | grid spacing |
| `--xtend-layout-font-family` | card typography |
| `--xtend-layout-font-size` | card text size |
| `--xtend-layout-media-radius` | image/media radius |
| `--xtend-layout-focus-ring` | card focus |
| `--xtend-layout-grid-min` | grid lower bound |
| `--xtend-layout-content-max` | grid max width |

## ECH-WP-07 External Theme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-cards,
[data-xtend-layout-theme="enterprise-foreign"] x-card {
  --xtend-layout-surface: #f8f4ef;
  --xtend-layout-text: #1b2823;
  --xtend-layout-border-color: rgba(27, 40, 35, 0.18);
  --xtend-layout-radius: 0.3rem;
  --xtend-layout-elevation: 0 12px 30px rgba(27, 40, 35, 0.12);
  --xtend-layout-spacing: 1.35rem;
  --xtend-layout-gap: 1.1rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 1rem;
  --xtend-layout-media-radius: 0.25rem;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(15rem, 1fr);
  --xtend-layout-content-max: 74rem;
}
```
