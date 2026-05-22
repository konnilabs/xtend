# xtype - XTend Component

> **See also:** [xwriter](./xwriter.md)

## Overview

`<x-type>` is a component for animated text effects such as typing animation.
It is suitable for hero areas, headings, and interactive UI elements.

---

## Features

- Animated text effects (typing, loop)
- Customizable speed
- Theming through CSS custom properties

---

## Usage

```html
<x-type text="XTend rocks!" speed="80"></x-type>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `text` | String | text to display |
| `speed` | Number | speed in ms per character |
| `loop` | Boolean | endless loop |

---

## Events

| Event | Description |
|-------|-------------|
| `done` | emitted after animation |

---

## API

- **Set text dynamically:** `element.setAttribute('text', 'Hello')`

---

## Example: Dynamic JS

```js
const type = document.createElement('x-type');
type.setAttribute('text', 'Hello world!');
document.body.appendChild(type);
```

---

## Styling and Theming

```css
x-type {
  --type-color: #007bff;
}
```

---

## Accessibility

- Semantic HTML

---

*Last updated: July 16, 2025*

## Layout Display Media UX Profile

Starting with `WP-E11-12`, `x-type` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. The component uses a
Shadow DOM shell for text and cursor, can be hydrated on idle, and writes its
current text to `xtype-current`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.idle.hydrate`
- Events: `typing-started`, `typing-completed`, `text-erased`
- Snapshot: `snapshot()`
- CSS parts: `root`, `text`, `cursor`
