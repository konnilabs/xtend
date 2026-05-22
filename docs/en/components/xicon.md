# xicon - XTend Component

> **See also:** [xbutton](./xbutton.md), [xtheme](./xtheme.md), [xrouter](./xrouter.md)

## Overview

`<x-icon>` is the universal iconography adapter for XTend apps. The component
renders local inline SVG icons, registered icon packs, or controlled URL
sources while remaining framework-agnostic, RMT-compatible, and CDN-free.

The included `core` pack covers the most important XTend UI symbols. The local
`lucide` adapter serves as a larger superset, loads from local ESM artifacts,
and avoids external CDN dependencies, FCP slowdowns, and privacy issues.

## Features

- local `core` icon pack with base icons for shell, docs, status, and
  navigation
- local `lucide` IconPack adapter as a superset without remote runtime import
- global registry `window.XTend.icons` for custom icon packs and corporate
  design sets
- direct sources through `src` for SVG files from repo, app bundle, or host CDN
  policies
- raw SVG pack entries are reduced to allowed nodes and attributes before
  rendering
- a11y mode for decorative and semantic icons
- state integration through `xicon-state-<id>`
- RMT shell authoring through `xtend.rmt.component-contract.v1`
- performance profile `xtend.performance.component-profile.v1` with
  `display-micro` budget

## Usage

```html
<x-icon name="search" label="Search"></x-icon>
<x-icon name="gauge" pack="lucide" size="1.25rem" label="Performance"></x-icon>
<x-icon src="/assets/icons/company.svg" label="Corporate Icon"></x-icon>
<x-icon name="chevron-right" decorative></x-icon>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `name` | String | icon name or alias from the registry |
| `pack` | String | optional icon pack, for example `core` or `lucide` |
| `src` | String | controlled URL source for an icon from repo, app bundle, or host policy |
| `label` | String | accessible name for screen readers |
| `size` | String | CSS size, for example `1em`, `20px`, `1.25rem` |
| `stroke-width` | String | stroke width for inline SVG paths |
| `color` | String | CSS color value; default is `currentColor` |
| `decorative` | Boolean | sets `aria-hidden` and removes semantic image role |

## Events

| Event | Description |
|-------|-------------|
| `icon-ready` | icon was resolved from pack or `src` |
| `icon-missing` | registry could not resolve `name`/`pack` |
| `icon-pack-registered` | a pack was registered in the global registry |

## API

| Method | Purpose |
|--------|---------|
| `setIcon(name, options?)` | sets icon, pack, label, or `src` programmatically |
| `registerPack(pack, options?)` | registers a pack through the component |
| `snapshot()` | returns `xtend.component.x-icon.state.v1` including registry snapshot |
| `window.XTend.icons.register(pack, options?)` | global pack registration |
| `window.XTend.icons.resolve(name, options?)` | global resolution without rendering |
| `window.XTend.icons.snapshot()` | registry snapshot for diagnostics |

## Custom Icon Packs

```js
window.XTend.icons.register({
  id: 'brand',
  label: 'Corporate Design Icons',
  cdnAllowed: false,
  icons: {
    product: {
      aliases: ['logo-mark'],
      nodes: [
        { tag: 'path', attrs: { d: 'M12 3 21 8v8l-9 5-9-5V8Z' } }
      ]
    }
  }
});
```

Packs can contain custom SVG node descriptors, individual path strings, inline
SVG records, or URL records. Remote sources are not the XTend default; hosts
must intentionally provide them as `src` or pack URLs.

## ECH-WP-04 Control Rule

No text glyphs as controls: close, menu, disclosure, status, and action
controls must not be styled with visible characters such as `x`, `&times;`,
arrows, or emoji. Use `x-icon`, inline SVG, or a tokenized CSS graphic.

Required for icon controls:

- The button has an accessible name, for example `aria-label`.
- The button exposes a stable control part, for example `part="close control"`.
- The graphic exposes an icon part, for example `part="control icon"` or
  `part="close-icon control icon"`.
- The core pack contains at least `close`, `menu`, `chevron-left`,
  `chevron-right`, `chevron-up`, `chevron-down`, `success`, `warning`, `error`,
  and `info` for framework controls.
- Custom icon packs must use local SVG node descriptors or safe `src` sources;
  CDN dependencies are not an XTend default base.

## RMT and Fabric

`x-icon` declares `xtendRmtMetadata` with `adapter: 'xtend.component'`,
`templateMode: 'dom_descriptor'`, `shellAuthoring.attributes`, and the boundary
`no-rmt-kernel-import-of-xtend-types`. RMT can therefore author icons in app
shells, navigation, buttons, or docs templates without importing the XTend
kernel or an icon vendor.

Fabric consumes:

- `icon-ready`
- `icon-missing`
- `icon-pack-registered`
- State key `xicon-state-<id>`
- `snapshot()`

## Styling and Theming

```css
x-icon {
  --xtend-icon-size: 1rem;
  --xtend-icon-color: currentColor;
  --xtend-icon-stroke-width: 2;
}
```

The icon follows `currentColor` and therefore integrates into `x-theme`,
`x-header`, `x-button`, `x-menu`, and custom corporate design tokens. In
forced-colors mode, the component remains readable through system colors.

## Accessibility

- with `label`, the host renders `role="img"` and `aria-label`
- without label or with `decorative`, the component renders `aria-hidden`
- URL icons receive an empty `alt` when decorative
- `icon-missing` is available as a diagnostic event without burdening screen
  readers with error signals
