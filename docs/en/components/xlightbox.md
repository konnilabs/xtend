# xlightbox - XTend Component

> **See also:** [xplayer](./xplayer.md)

## Overview

`<x-lightbox>` displays images in a viewport-wide overlay. It supports trigger
slots, API-controlled opening, Escape close, focus return, and
viewport-bounded media scaling.

---

## Features

- Overlay for images and media
- Trigger slot and global helper API
- Keyboard support with Escape close
- Viewport-bounded image scaling with body portal
- Theming through CSS custom properties

---

## Usage

```html
<x-lightbox id="logo-lightbox" src="/assets/logo.png" alt="XTend Logo">
  <x-button slot="trigger" variant="secondary">View logo</x-button>
</x-lightbox>

<img src="/assets/preview.jpg" data-xlightbox alt="Preview" />
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `src` | String | image source for trigger, API, and `data-xlightbox` |
| `open` | Boolean | opens the lightbox in controlled mode when `src` is set |
| `alt` | String | alternative text for the displayed image |

---

## Events

| Event | Description |
|-------|-------------|
| `lightbox-opened` | emitted on open, detail: `{ src }` |
| `lightbox-closed` | emitted on close |

---

## API

- **Open:** `element.open(src)`
- **Close:** `element.close()`
- **Global helper:** `window.showLightbox(src)`
- **State:** `xlightbox-open-<id>`

`src` configures the image source but does not open the lightbox
automatically. For direct UI usage, place an element in the `trigger` slot.
When opened, the lightbox portals itself to `document.body` so overlay and
image are not clipped by app-shell containers, `main`, cards, or transformed
demo frames.

---

## Example: Dynamic JS

```js
const lightbox = document.createElement('x-lightbox');
document.body.appendChild(lightbox);
lightbox.open('/assets/image.jpg');
```

---

## Styling and Theming

```css
x-lightbox {
  --lightbox-bg: rgba(0,0,0,0.9);
  --lightbox-padding: clamp(0.75rem, 2vw, 2rem);
  --lightbox-radius: 0.75rem;
}
```

---

## Accessibility

- focus management, keyboard navigation, and focus return
- `role="dialog"`, `aria-modal="true"`, and closed state with `aria-hidden`
  and `inert`
- image scaling via `object-fit: contain` and
  `max-height: calc(100dvh - padding)`

---

*Last updated: July 16, 2025*

## Layout Display Media UX Profile

Starting with `WP-E11-12`, `x-lightbox` exposes the profile
`xtend.component.layout-display-media-ux-profile.v1`. The component combines
overlay and media maturity and uses the state key `xlightbox-open-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `media.lazy.load`
- Events: `lightbox-opened`, `lightbox-closed`
- Snapshot: `snapshot()`
- CSS parts: `overlay`, `content`, `close`, `media`
