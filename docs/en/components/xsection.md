# xsection - XTend Component

> **See also:** [xhero](./xhero.md), [xmasonry](./xmasonry.md)

## Overview

`<x-section>` is a flexible layout component for page sections, containers, and
structured areas. It supports slots, theming, and responsive design.

---

## Features

- Container for arbitrary content
- Slots for flexible structure
- Theming through CSS custom properties
- Responsive design

---

## Usage

```html
<x-section>
  <h2>Section</h2>
  <p>Content...</p>
</x-section>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `variant` | String | layout variant, for example primary, secondary |

---

## Events

| Event | Description |
|-------|-------------|
| - | - |

---

## API

- **Set variant:** `element.setAttribute('variant', 'primary')`

---

## Example: Dynamic JS

```js
const section = document.createElement('x-section');
section.setAttribute('variant', 'primary');
document.body.appendChild(section);
```

---

## Styling and Theming

```css
x-section {
  --section-bg: #f9f9f9;
  --section-color: #222;
}
```

---

## Accessibility

- Semantic HTML

---

*Last updated: July 16, 2025*

## Layout Display Media UX Profile

Starting with `WP-E11-12`, `x-section` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. The component is suitable
as a shell-first layout surface for RMT and uses the state key
`xsection-state-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `layout.measure`
- Event: `section-rendered`
- Snapshot: `snapshot()`
- CSS parts: `root`, `container`, `header`, `aside`, `content`, `footer`

## ECH-WP-07 Token Table and signatureDesign

`signatureDesign`: editorial enterprise section with controlled surface
hierarchy, optional edge, and overflow-safe content lanes. It can be plain,
framed, or a dense dashboard layout without requiring new attributes.

| Token | Purpose |
| --- | --- |
| `--xtend-layout-surface` | section surface |
| `--xtend-layout-text` | main text color |
| `--xtend-layout-border-color` | optional section edge |
| `--xtend-layout-radius` | section radius |
| `--xtend-layout-elevation` | optional section shadow |
| `--xtend-layout-spacing` | section and content padding |
| `--xtend-layout-gap` | slot spacing |
| `--xtend-layout-font-family` | section typography |
| `--xtend-layout-font-size` | content font size |
| `--xtend-layout-media-radius` | media radius for slotted content |
| `--xtend-layout-focus-ring` | focus inside the section |
| `--xtend-layout-grid-min` | responsive content base |
| `--xtend-layout-content-max` | section max width |

## ECH-WP-07 External Theme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-section {
  --xtend-layout-surface: #fffaf2;
  --xtend-layout-text: #1d2722;
  --xtend-layout-border-color: rgba(29, 39, 34, 0.18);
  --xtend-layout-radius: 0.4rem;
  --xtend-layout-elevation: none;
  --xtend-layout-spacing: 1.6rem;
  --xtend-layout-gap: 1.2rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 1rem;
  --xtend-layout-media-radius: 0.35rem;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(14rem, 1fr);
  --xtend-layout-content-max: 76rem;
}
```
