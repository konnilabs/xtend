# xheader - XTend Component

> **See also:** [xfooter](./xfooter.md), [xtheme](./xtheme.md)

## Overview

`<x-header>` is a versatile, accessible header component for branding, navigation and flexible app-shell layouts. It supports logos, titles, search, actions/utility and navigation slots, theming, state integration and several menu presentation modes for enterprise app shells.

---

## Features
- Optional logo (`src` attribute)
- Slot system for title, search, actions, legacy utility and navigation
- Sticky header
- State integration via xstate
- Theming via CSS custom properties; fully themeable
- **Responsive behavior:** header content runs through a slot grid. Search and actions wrap predictably on small displays; navigation uses the configured menu presentation mode.
- **Slot alignment:** brand, actions and menu trigger remain in a fixed top row on narrow viewports. Search is placed below, which prevents action buttons from being displaced.
- **Menu presentation modes:** `drawer`, `side-panel`, `popover`, `fullscreen` and `inline-main` cover shell, app and portal navigation.
- **Full-width drawer:** the default `drawer` still renders as a fixed overlay across the available page width and does not extend the document scroll area.
- **Overflow-safe navigation:** direct `x-link` entries and complex `[data-menu-shell]` menus remain inside their menu-surface containers.
- **Burger menu:** animated button; color can be controlled through theme tokens
- **Accessibility:** landmark roles, ARIA, keyboard navigation and focus management
- **Events:** menu opened/closed, logo loaded

---

## Usage

```html
<x-header src="logo.svg" logo-size="40">
  <span slot="title">My App</span>
  <x-form slot="search">...</x-form>
  <button slot="actions">Theme</button>
  <x-link slot="nav" href="/docs">Docs</x-link>
</x-header>
```

**Note:** `utility` remains available as a compatibility alias. New apps should use `search` for search controls and `actions` for buttons, toggles or status controls.

---

## Menu Presentation Modes

`menu-mode` controls how navigation becomes visible. Without the new attribute, `drawer` remains active and keeps the previous full-width drawer behavior compatible.

| Mode | Behavior | A11y behavior |
|------|----------|---------------|
| `drawer` | Fixed overlay below the header, full-width by default | Navigation, Escape, outside click, focus return |
| `side-panel` | Side panel via `menu-placement="start"` or `end` | optionally modal via `menu-modal`, then focus trap and backdrop |
| `popover` | Compact menu near the trigger | non-modal, Escape and outside click |
| `fullscreen` | Full-screen navigation | modal, backdrop, focus trap, Escape and focus return |
| `inline-main` | Menu in the header document flow | no overlay trap, clean navigation landmark |

```html
<x-header
  menu-mode="side-panel"
  menu-placement="end"
  menu-modal
  menu-width="min(32rem, 92vw)"
  menu-max-height="calc(100dvh - 2rem)"
  menu-align="stretch">
  <span slot="title">Enterprise Shell</span>
  <x-link slot="nav" href="/workbench">Workbench</x-link>
</x-header>
```

`menu-open` can be set declaratively. Programmatically, `toggleMenu(true | false, { source })` remains the stable API. `snapshot()` returns `menuMode`, `menuPlacement`, `menuModal`, `menuBreakpoint`, `menuWidth`, `menuMaxHeight` and `menuAlign`; `drawerMode: 'fixed-full-width-overlay'` remains as a legacy alias.

---

## Responsive Slot Logic
- Desktop: brand, search, actions and menu button share a stable grid row.
- Tablet: search occupies its own grid row so input fields do not clip against actions.
- Mobile: brand, actions and menu button remain in the first row. Search occupies the second row. Navigation uses the configured menu presentation mode.
- The drawer is positioned as a `fixed` overlay. This keeps the app shell stable and prevents route changes from an open navigation state to a shorter page from creating extra document height.
- Slotted navigation uses `max-width: 100%`, `min-width: 0`, `box-sizing: border-box` and `overflow-wrap: anywhere` so long menu items do not overflow app-shell containers.
- `header-layout-changed` is emitted when the header enters its compact state.

## Slot Alignment

`x-header` uses the `fixed-responsive-slot-grid` alignment by default.

| Viewport | Slot mapping |
|----------|--------------|
| Desktop | `brand search actions trigger` |
| Tablet | `brand actions trigger` + `search search search` |
| Mobile | `brand actions trigger` + `search search search` |

Corporate designs can override this mapping through CSS custom properties without forking the component:

```css
x-header {
  --header-slot-template-areas: "brand search actions trigger";
  --header-tablet-slot-template-areas: "brand actions trigger" "search search search";
  --header-mobile-slot-template-areas: "brand actions trigger" "search search search";
  --header-mobile-actions-justify: flex-end;
  --header-mobile-actions-wrap: nowrap;
}
```

---

## Slots
| Name | Description |
|------|-------------|
| `title` | Title/branding area |
| `search` | Search form or filter input |
| `actions` | Buttons, theme toggles and status actions |
| `utility` | Compatible alias for actions |
| `nav` | Navigation entries, such as links or menus |
| `logo` | Optional custom logo element |

---

## Attributes
| Attribute | Type | Description |
|-----------|------|-------------|
| `src` | String | Logo URL |
| `logo-size` | String | Logo size, for example 40 or 64px |
| `sticky` | Boolean | Keeps the header fixed at the top |
| `shadow` | Boolean | Enables shadow |
| `menu-mode` | `drawer`, `side-panel`, `popover`, `fullscreen`, `inline-main` | Menu presentation mode |
| `menu-placement` | `start`, `end`, `top`, `bottom` | preferred position |
| `menu-modal` | Boolean | Modal behavior with backdrop and focus trap |
| `menu-open` | Boolean | Opens the menu declaratively |
| `menu-breakpoint` | String | Preset (`sm`, `md`, `lg`, `xl`) or CSS length |
| `menu-width` | String | Width for panel/popover |
| `menu-max-height` | String | Height limit for the menu surface |
| `menu-align` | `start`, `center`, `end`, `stretch` | Alignment inside the menu surface |

---

## Events
| Event | Description |
|-------|-------------|
| `header-layout-changed` | Fired on responsive layout changes |
| `menu-before-open` | Cancelable event before opening |
| `menu-before-close` | Cancelable event before closing |
| `menu-opened` | Fired with snapshot when the menu opens |
| `menu-closed` | Fired with snapshot when the menu closes |
| `menu-mode-changed` | Fired when `menu-mode` changes |
| `menu-placement-changed` | Fired when `menu-placement` changes |
| `logo-loaded` | Fired when the logo has loaded |

---

## API
- **Set logo dynamically:** `element.setAttribute('src', 'logo.svg')`
- **Control menu directly:** `header.toggleMenu(false, { source: 'router' })`
- **State integration:** automatic via xstate (`xheader-state-<id>`, for example open/close menu)
- **Open menu programmatically:**
  ```js
  xstate.set('xheader-state-<id>', { menuOpen: true });
  ```

---

## Example: Dynamic JS

```js
const header = document.createElement('x-header');
header.setAttribute('src', 'logo.svg');
document.body.appendChild(header);
```

---

## Styling & Theming

```css
x-header {
  --xtend-header-surface: #fff;
  --xtend-header-text: #222;
  --xtend-header-border-color: #d9dde5;
  --xtend-header-menu-surface: #fff;
  --xtend-header-menu-width: min(30rem, 92vw);
  --xtend-header-menu-max-height: min(72dvh, 820px);
  --xtend-header-menu-backdrop: rgba(15, 23, 42, 0.45);
  --header-bg: var(--xtend-header-surface);
  --header-fg: var(--xtend-header-text);
  --header-title-color: #222; /* title in light mode */
  --burger-color: #222;       /* burger button strokes in light mode */
  --header-menu-bg: var(--xtend-header-menu-surface);
  --header-mobile-slot-template-areas: "brand actions trigger" "search search search";
  --header-drawer-inline-offset: 1rem;
  --header-drawer-content-max: none;
}
x-header[theme="dark"] {
  --header-bg: #222;
  --header-fg: #fff;
  --header-title-color: #fff; /* title in dark mode */
  --burger-color: #fff;       /* burger button strokes in dark mode */
}
```

---

## Accessibility
- Semantic HTML and landmark roles (`role="banner"`)
- ARIA attributes for menu, burger button and navigation
- Keyboard navigation with Tab and Escape
- Focus management in overlays; `fullscreen` and `menu-modal` use focus trap, backdrop and focus return

---

## Changelog
- **2025-07-18:** Modernization, theme variables for title and burger, events, accessibility, API and documentation updated
- **up to 07/2025:** Various bug fixes and responsive improvements

---

*Last updated: July 18, 2025*

## Layout Display Media UX Profile

As of `WP-E11-12`, `x-header` provides the `xtend.component.layout-display-media-ux-profile.v1` profile. The component is RMT-schedulable as a docs/app-shell header and uses the state key `xheader-state-<id>`.

- Profile getter: `xtendLayoutDisplayMediaUxProfile`
- Schedule: `component.visible.mount`
- Events: `header-ready`, `menu-before-open`, `menu-before-close`, `menu-opened`, `menu-closed`, `menu-mode-changed`, `menu-placement-changed`
- Snapshot: `snapshot()`
- CSS parts: `root`, `brand`, `title`, `logo`, `search`, `actions`, `utility`, `trigger`, `trigger-icon`, `menu`, `menu-surface`, `menu-content`, `nav`, `backdrop`
- Legacy CSS parts: `drawer` and `drawer-surface` remain aliases for `menu` and `menu-surface`.

## ECH-WP-07 Token Table and signatureDesign

`signatureDesign`: precise enterprise app shell with calm surface hierarchy, dense slot rhythm, high-quality menu surface and brand-neutral premium feel. The default design should feel distinctive without forcing a single-brand look.

| Token | Purpose |
| --- | --- |
| `--xtend-layout-surface` | Shell and menu surface |
| `--xtend-layout-text` | Header, brand and navigation color |
| `--xtend-layout-border-color` | Header, trigger and menu edges |
| `--xtend-layout-radius` | Header and menu radius |
| `--xtend-layout-elevation` | Header and menu shadow |
| `--xtend-layout-spacing` | Header padding |
| `--xtend-layout-gap` | Slot and menu spacing |
| `--xtend-layout-font-family` | Shell typography |
| `--xtend-layout-font-size` | Brand/navigation typography |
| `--xtend-layout-media-radius` | Logo and media radius |
| `--xtend-layout-focus-ring` | Keyboard focus |
| `--xtend-layout-grid-min` | Slot-grid lower bound |
| `--xtend-layout-content-max` | Menu width and content boundary |

## ECH-WP-07 Foreign Theme

```css
[data-xtend-layout-theme="enterprise-foreign"] x-header {
  --xtend-layout-surface: #f6f2ea;
  --xtend-layout-text: #17231f;
  --xtend-layout-border-color: rgba(23, 35, 31, 0.22);
  --xtend-layout-radius: 0.35rem;
  --xtend-layout-elevation: 0 14px 34px rgba(23, 35, 31, 0.14);
  --xtend-layout-spacing: 0.9rem;
  --xtend-layout-gap: 0.7rem;
  --xtend-layout-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-layout-font-size: 1rem;
  --xtend-layout-media-radius: 0.2rem;
  --xtend-layout-focus-ring: 3px solid #8f4f2a;
  --xtend-layout-grid-min: minmax(0, 1fr);
  --xtend-layout-content-max: 24rem;
}
```

## ECH-WP-09 Token Table and Navigation States

`signatureDesign`: `x-header` combines a high-quality enterprise app shell with visibly stable navigation. Active/current/selected, hover, focus and disabled states apply to slotted `nav` entries in `drawer`, `side-panel`, `popover`, `fullscreen` and `inline-main`.

| Token | Purpose |
| --- | --- |
| `--xtend-nav-surface` | Menu and nav surface |
| `--xtend-nav-text` | Nav text |
| `--xtend-nav-border-color` | Menu and nav edge |
| `--xtend-nav-radius` | Nav radius |
| `--xtend-nav-gap` | Spacing inside the menu |
| `--xtend-nav-font-family` | Navigation typography |
| `--xtend-nav-font-size` | Navigation text size |
| `--xtend-nav-active-surface` | Active/current/selected surface |
| `--xtend-nav-active-text` | Active/current/selected text |
| `--xtend-nav-current-indicator` | Non-color-only current indicator |
| `--xtend-nav-hover-surface` | Hover surface |
| `--xtend-nav-focus-ring` | Keyboard focus |
| `--xtend-nav-disabled-opacity` | Disabled dimming |

## ECH-WP-09 Keyboard Behavior

The menu trigger is an icon control with `part="trigger-icon control icon"`. Overlay modes support Escape, outside click, focus return and, with `menu-modal`, focus trap. Slotted navigation can carry `aria-current="page"`, `aria-selected="true"`, `active`, `disabled` or `aria-disabled="true"`. Nested navigation must mark disclosure icons as icon controls, for example `part="disclosure-icon control icon"`.

## ECH-WP-09 Foreign Theme

```css
[data-xtend-nav-theme="enterprise-foreign"] x-header {
  --xtend-nav-surface: #f7f4ee;
  --xtend-nav-text: #17231f;
  --xtend-nav-border-color: rgba(23, 35, 31, 0.22);
  --xtend-nav-radius: 0.35rem;
  --xtend-nav-gap: 0.45rem;
  --xtend-nav-font-family: "Aptos", "Segoe UI", sans-serif;
  --xtend-nav-font-size: 0.98rem;
  --xtend-nav-active-surface: #173f35;
  --xtend-nav-active-text: #fffaf0;
  --xtend-nav-current-indicator: #b56b35;
  --xtend-nav-hover-surface: rgba(181, 107, 53, 0.14);
  --xtend-nav-focus-ring: 3px solid #b56b35;
  --xtend-nav-disabled-opacity: 0.44;
}
```
