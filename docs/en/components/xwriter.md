# xwriter - XTend Component

> **See also:** [xcode](./xcode.md), [xinput](./xinput.md)

## Overview

`<x-writer>` is a component for rich-text editing and simple WYSIWYG editors.
It supports formatting, theming, state integration, autosave, export, and API
integration.

---

## Features

- Rich-text editing (bold, italic, lists, links, colors, sizes)
- State integration through xstate
- Theming through CSS custom properties
- Autosave (local or API)
- Export as Markdown/HTML
- Drag and drop for images/text
- API integration (save to server)

---

## Usage

```html
<x-writer></x-writer>
```

---

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `value` | String | initial text content (property, not attribute) |
| `api` | String | API endpoint for saving, for example `/api/save` or `local` for LocalStorage |
| `method` | String | HTTP method for API (default: `POST`) |
| `autosave` | Number | autosave interval in ms, for example `10000` for 10s |
| `storage-key` | String | key for LocalStorage (default: `xwriter-content`) |

---

## Events

| Event | Description |
|-------|-------------|
| `writer:change` | emitted on text change, detail: `{html, markdown, plain}` |
| `writer:save` | after save (local/API), detail: `{status, response}` |
| `writer:autosave` | after autosave |
| `writer:export` | after export, detail: `{filename, success}` |
| `writer:error` | on errors, detail: `{error}` |

---

## API

- **Set/read text:** `element.value = 'Text'` (property, not attribute)
- **State integration:** automatic through xstate
- **Save:**
  - Local: `<x-writer api="local"></x-writer>`
  - API: `<x-writer api="/api/save" method="POST"></x-writer>`
- **Export:** through export button (Markdown/HTML)

## Form Controls UX from WP-E11-08

`<x-writer>` exposes `xtendFormControlUxProfile` with
`xtend.component.form-control-ux-profile.v1`. The profile describes rich text
as a form-control-adjacent UX surface with `writer:change`, `writer:error`,
`xwriter-content`, `component.idle.hydrate`, Fabric lane `idle`, and RMT shell
authoring. `x-form` can consume `writer:change` and aggregate the value into
`xform-data-<id>`.

---

## Example: Dynamic JS

```js
const writer = document.createElement('x-writer');
writer.value = 'Hello world!';
document.body.appendChild(writer);
```

---

## Styling and Theming

```css
x-writer {
  --writer-bg: #fff;
  --writer-color: #222;
  /* See CSS for more custom properties */
}
```

---

## Accessibility

- Semantic HTML, ARIA
- Keyboard operation

---

*Last updated: July 16, 2025*
