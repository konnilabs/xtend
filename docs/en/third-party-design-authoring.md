# Third-Party Design Authoring

Docs Contract: `xtend.enterprise.third-party-authoring-guide.v1`

Workpackage: `ECH-WP-11`

Local gate:

```bash
node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json
npm run test:enterprise-third-party-authoring-guide
```

This guide is for teams that want to embed XTend components into their own corporate design, white-label product or internal enterprise design system. The target path is: XTend remains visually polished and distinct, but every visible decision flows through XTend.css, XTheme, CSS parts, slots, attributes or icon packs. Component forks are not a regular skinning path.

## Principles

1. Define corporate tokens first, then derive component tokens.
2. Keep XTend Signature UI as the quality baseline, but deliberately replace brand color, typography, radius, elevation and density.
3. Do not select Shadow DOM internals. Skinning happens through CSS Custom Properties and `::part(...)`.
4. Light, Dark, High Contrast, Forced Colors, Reduced Motion, Comfortable, Compact and Dense are required variants.
5. Controls use `x-icon`, inline SVG or tokenized CSS graphics, never visible text characters.
6. Status, active, error, disabled and focus states must not communicate only through color.

## XTend.css Override Patterns

Corporate overrides belong in their own cascade layer. This keeps host tokens traceable, and product teams can apply XTend updates without copying Shadow DOM rules.

```css
@layer xtend-customer {
  :root {
    --acme-ink: #17231f;
    --acme-muted: #5f6b64;
    --acme-canvas: #f7f4ee;
    --acme-panel: #fffdf8;
    --acme-action: #0e6e8f;
    --acme-action-strong: #173f35;
    --acme-warm: #b56b35;
    --acme-edge: rgba(23, 35, 31, 0.22);
    --acme-radius-control: 0.35rem;
    --acme-radius-panel: 0.55rem;
    --acme-focus: 3px solid var(--acme-warm);
    --acme-font-body: "Aptos", "Segoe UI", system-ui, sans-serif;
    --acme-font-display: "Aptos Display", "Aptos", "Segoe UI", system-ui, sans-serif;
    --acme-font-code: "Cascadia Code", "SFMono-Regular", Consolas, monospace;

    --xtend-surface: var(--acme-canvas);
    --xtend-surface-muted: var(--acme-panel);
    --xtend-text: var(--acme-ink);
    --xtend-color-primary: var(--acme-action);
    --xtend-border-color: var(--acme-edge);
    --xtend-focus-outline: var(--acme-focus);
    --xtend-radius: var(--acme-radius-panel);
    --xtend-font-family: var(--acme-font-body);
    --xtend-font-family-body: var(--acme-font-body);
    --xtend-font-family-heading: var(--acme-font-display);
    --xtend-font-family-control: var(--acme-font-body);
    --xtend-font-family-code: var(--acme-font-code);
  }

  :root[data-theme="dark"] {
    --acme-ink: #f6f1e8;
    --acme-muted: #d4c9b8;
    --acme-canvas: #121916;
    --acme-panel: #1c2823;
    --acme-action: #8bd4e6;
    --acme-action-strong: #b56b35;
    --acme-edge: rgba(246, 241, 232, 0.2);
  }

  :root[data-theme="high-contrast"] {
    --acme-ink: #ffffff;
    --acme-muted: #ffffff;
    --acme-canvas: #000000;
    --acme-panel: #000000;
    --acme-action: #ffff00;
    --acme-action-strong: #ffffff;
    --acme-edge: #ffffff;
    --acme-focus: 3px solid #ffff00;
  }

  :root[data-theme="forced-colors"] {
    --acme-ink: CanvasText;
    --acme-muted: CanvasText;
    --acme-canvas: Canvas;
    --acme-panel: Canvas;
    --acme-action: Highlight;
    --acme-action-strong: Highlight;
    --acme-edge: CanvasText;
    --acme-focus: 2px solid Highlight;
  }
}
```

## XTheme Token Bridge

`x-theme` and `window.XTend.theme` are the runtime path for theme changes, density, reduced motion and forced colors. A corporate theme should set the same values as XTend.css so static CSS overrides and runtime changes stay identical.

```js
window.XTend.theme.registerTheme('acme-enterprise', {
  '--xtend-surface-page': '#f7f4ee',
  '--xtend-surface-panel': '#fffdf8',
  '--xtend-surface-raised': '#ffffff',
  '--xtend-text-primary': '#17231f',
  '--xtend-text-muted': '#5f6b64',
  '--xtend-color-action': '#0e6e8f',
  '--xtend-color-action-hover': '#173f35',
  '--xtend-text-on-action': '#fffaf0',
  '--xtend-border-subtle': 'rgba(23, 35, 31, 0.22)',
  '--xtend-radius-control': '0.35rem',
  '--xtend-radius-panel': '0.55rem',
  '--xtend-space-control-gap': '0.55rem',
  '--xtend-elevation-2': '0 14px 34px rgba(23, 35, 31, 0.14)',
  '--xtend-font-family-body': '"Aptos", "Segoe UI", system-ui, sans-serif',
  '--xtend-font-family-heading': '"Aptos Display", "Aptos", "Segoe UI", system-ui, sans-serif',
  '--xtend-header-surface': 'var(--xtend-surface-panel)',
  '--xtend-header-menu-surface': 'var(--xtend-surface-raised)',
  '--xtend-button-primary-surface': 'var(--xtend-color-action)',
  '--xtend-button-primary-text': 'var(--xtend-text-on-action)',
  '--xtend-menu-item-hover-surface': 'rgba(181, 107, 53, 0.14)',
  '--xtend-drawer-overlay-surface': 'rgba(23, 35, 31, 0.45)',
  '--xtend-modal-overlay-surface': 'rgba(23, 35, 31, 0.45)',
  '--xtend-icon-color': 'currentColor'
});

window.XTend.theme.setTheme('acme-enterprise');
window.XTend.theme.setDensity('compact');
```

Required modes:

| Mode | Rule |
|------|------|
| `light` | text, icons, controls and focus must remain readable on light surfaces |
| `dark` | no hard-coded light surfaces without dark text fallback |
| `high-contrast` | active and error states need shape, border or marker |
| `forced-colors` | use system colors such as `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonFace`, `ButtonText` |

Density presets:

| Density | Use |
|---------|-----|
| `comfortable` | default for mixed enterprise shells |
| `compact` | toolbars, data density, workbench shells |
| `dense` | navigation, filter bars, table surroundings |

## CSS Parts

CSS parts are the skinning API. Use them for zones, not private Shadow DOM structures.

```css
@layer xtend-customer {
  x-header::part(root) {
    border-block-end: 1px solid var(--acme-edge);
  }

  x-header::part(menu-surface),
  x-drawer::part(surface),
  x-modal::part(surface),
  x-dialog::part(surface),
  x-popover::part(surface) {
    border: 1px solid var(--acme-edge);
    border-radius: var(--acme-radius-panel);
  }

  x-button::part(control),
  x-menu::part(item) {
    border-radius: var(--acme-radius-control);
  }

  x-icon::part(icon),
  x-header::part(trigger-icon) {
    color: currentColor;
  }
}
```

Rule: a `::part(...)` may set corporate styling, but must not remove semantic usability. Focus, disabled, busy, active and error states must remain intact.

## Icon Pack Registration

Product icons belong in a local icon pack. Remote CDNs are not an XTend default path.

```js
window.XTend.icons.register({
  id: 'acme',
  label: 'Acme Enterprise Icons',
  cdnAllowed: false,
  icons: {
    product: {
      aliases: ['brand-mark'],
      nodes: [
        { tag: 'path', attrs: { d: 'M12 3 21 8v8l-9 5-9-5V8Z' } }
      ]
    },
    command: {
      nodes: [
        { tag: 'path', attrs: { d: 'M5 7h14M5 12h14M5 17h14' } }
      ]
    }
  }
});
```

Controls need a real button element, an accessible name and separate parts for control and icon. Visible characters such as `X`, `+`, `-`, `...` or emoji are not allowed as control graphics.

## Layout Modes

Layout variants are public API. Host apps should set modes declaratively and fine-tune them through tokens.

```html
<x-header
  menu-mode="side-panel"
  menu-placement="end"
  menu-modal
  menu-width="min(30rem, 92vw)"
  menu-max-height="calc(100dvh - 2rem)"
  menu-align="stretch">
  <span slot="title">Acme Operations</span>
  <x-link slot="nav" href="/overview" aria-current="page">Overview</x-link>
  <x-link slot="nav" href="/control-room">Control Room</x-link>
</x-header>
```

`x-header` supports `drawer`, `side-panel`, `popover`, `fullscreen` and `inline-main`. Modal variants need escape, focus return and, when focus trap is used, a visible backdrop. Non-modal variants must not remove main content from reading flow.

Overlay-near components use shared skinning zones:

| Component | Modes/Variant | Required Parts |
|-----------|---------------|----------------|
| `x-drawer` | Drawer/Overlay | `surface`, `backdrop`, `close`, `content` |
| `x-side-panel` | docked, pinned, overlay, collapsed | `surface`, `backdrop`, `close`, `content` |
| `x-modal` | modal overlay | `surface`, `backdrop`, `close`, `content` |
| `x-dialog` | modal dialog | `surface`, `backdrop`, `close`, `content` |
| `x-popover` | non-modal or `modal` | `surface`, `backdrop`, `close`, `content` |

## A11y Dos and Donts

| Do | Dont |
|----|------|
| keep a visible `focus-visible` ring through tokens | remove focus through `outline: none` without replacement |
| respect `prefers-reduced-motion` down into overlay and feedback components | test motion only in light mode |
| test `forced-colors` with `Canvas`, `CanvasText`, `Highlight` and `HighlightText` | force brand colors in Forced Colors |
| do not represent active, selected, error and disabled only through color | communicate status only through red/green |
| protect long labels with `overflow-wrap` and stable control height | clip text in buttons, tabs or menus |
| author icon controls with `aria-label`, `part="... control"` and `part="... icon"` | use visible text glyphs for close/menu/disclosure |

Status and route information must remain readable in every theme and must not communicate only through color. Use border, marker, underline, icon, text or shape as a second signal.

## Complete Third-Party Theme Example

This example combines XTend.css, XTheme, CSS parts, icon pack, header mode, density and a11y modes. It is deliberately not generic blue: the palette mixes ink, warm panel, cool action blue, deep green and copper accent.

```html
<html data-theme="light" data-xtend-density="compact">
  <head>
    <link rel="stylesheet" href="/xtend.css">
    <meta name="xtend-preload" content="x-theme,x-header,x-link,x-button,x-icon">
    <style>
      @layer xtend-customer {
        :root {
          --acme-ink: #17231f;
          --acme-canvas: #f7f4ee;
          --acme-panel: #fffdf8;
          --acme-action: #0e6e8f;
          --acme-action-strong: #173f35;
          --acme-warm: #b56b35;
          --acme-edge: rgba(23, 35, 31, 0.22);
          --acme-focus: 3px solid var(--acme-warm);
          --acme-font-body: "Aptos", "Segoe UI", system-ui, sans-serif;
          --acme-font-display: "Aptos Display", "Aptos", "Segoe UI", system-ui, sans-serif;

          --xtend-surface: var(--acme-canvas);
          --xtend-surface-muted: var(--acme-panel);
          --xtend-text: var(--acme-ink);
          --xtend-border-color: var(--acme-edge);
          --xtend-color-primary: var(--acme-action);
          --xtend-focus-outline: var(--acme-focus);
          --xtend-font-family-body: var(--acme-font-body);
          --xtend-font-family-heading: var(--acme-font-display);
          --xtend-header-surface: var(--acme-panel);
          --xtend-header-menu-surface: #ffffff;
          --xtend-header-menu-backdrop: rgba(23, 35, 31, 0.45);
          --xtend-button-primary-surface: var(--acme-action);
          --xtend-button-primary-text: #fffaf0;
          --xtend-menu-item-hover-surface: rgba(181, 107, 53, 0.14);
          --xtend-nav-current-indicator: var(--acme-warm);
          --xtend-overlay-surface: #ffffff;
          --xtend-overlay-text: var(--acme-ink);
          --xtend-overlay-backdrop: rgba(23, 35, 31, 0.45);
        }

        :root[data-theme="dark"] {
          --acme-ink: #f6f1e8;
          --acme-canvas: #121916;
          --acme-panel: #1c2823;
          --acme-action: #8bd4e6;
          --acme-action-strong: #b56b35;
          --acme-edge: rgba(246, 241, 232, 0.2);
          --xtend-button-primary-text: #121916;
        }

        :root[data-theme="forced-colors"] {
          --acme-ink: CanvasText;
          --acme-canvas: Canvas;
          --acme-panel: Canvas;
          --acme-action: Highlight;
          --acme-action-strong: Highlight;
          --acme-warm: Highlight;
          --acme-edge: CanvasText;
          --xtend-button-primary-text: HighlightText;
          --xtend-overlay-backdrop: Canvas;
        }

        @media (prefers-reduced-motion: reduce) {
          :root {
            --xtend-motion-duration-fast: 0ms;
            --xtend-motion-duration-base: 0ms;
          }
        }

        x-header::part(root),
        x-modal::part(surface),
        x-drawer::part(surface) {
          border: 1px solid var(--acme-edge);
        }

        x-header::part(trigger-icon),
        x-button::part(icon),
        x-menu::part(disclosure-icon) {
          color: currentColor;
        }
      }
    </style>
    <script type="module" src="/xtend-loader.js" data-manifest="/components/manifest.json"></script>
  </head>
  <body>
    <x-header menu-mode="side-panel" menu-placement="end" menu-modal>
      <span slot="title">Acme Operations</span>
      <x-link slot="nav" href="/overview" aria-current="page">Overview</x-link>
      <x-link slot="nav" href="/reports">Reports</x-link>
      <x-button slot="actions" variant="primary">
        <x-icon pack="acme" name="command" decorative></x-icon>
        Command
      </x-button>
    </x-header>
  </body>
</html>
```

## P0 Token/Part Reference

Every P0 component must have a token/part reference in this guide. The detail tables remain in the component documents so they can be maintained beside attributes, slots, events and a11y rules.

| Component | Docs | Alias Prefix | Token/Part Table | Required Parts |
|-----------|------|--------------|------------------|----------------|
| `x-theme` | [xtheme](./components/xtheme.md) | `--xtend-theme-` | `Central XTend Tokens` / [Design Tokens](./design-tokens.md) | `root` |
| `x-header` | [xheader](./components/xheader.md) | `--xtend-header-` | `ECH-WP-07 Token Table and signatureDesign`, `ECH-WP-09 Token Table and Navigation States` | `root`, `brand`, `trigger`, `trigger-icon`, `menu`, `menu-surface`, `backdrop` |
| `x-icon` | [xicon](./components/xicon.md) | `--xtend-icon-` | `Styling & Theming`, `ECH-WP-04 Control Rule` | `root`, `control`, `icon` |
| `x-button` | [xbutton](./components/xbutton.md) | `--xtend-button-` | `Styling & Theming` | `root`, `control`, `label`, `icon` |
| `x-menu` | [xmenu](./components/xmenu.md) | `--xtend-menu-` | `ECH-WP-09 Token Table and Navigation States` | `root`, `nav`, `item`, `disclosure-icon` |
| `x-drawer` | [xdrawer](./components/xdrawer.md) | `--xtend-drawer-` | `ECH-WP-06 Overlay Parity` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-side-panel` | [xsidepanel](./components/xsidepanel.md) | `--xtend-side-panel-` | `ECH-WP-06 Overlay Parity` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-modal` | [xmodal](./components/xmodal.md) | `--xtend-modal-` | `ECH-WP-06 Overlay Parity` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-dialog` | [xdialog](./components/xdialog.md) | `--xtend-dialog-` | `ECH-WP-06 Overlay Parity` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-popover` | [xpopover](./components/xpopover.md) | `--xtend-popover-` | `ECH-WP-06 Overlay Parity` | `root`, `surface`, `backdrop`, `close`, `content` |
| `x-toast` | [xtoast](./components/xtoast.md) | `--xtend-toast-` | `Styling & Theming` | `root`, `surface`, `content`, `close`, `icon` |

## Migrating Legacy Token Names

Legacy tokens remain visible as bridges, but new corporate themes should map them to the normalized alias layer.

| Legacy Token | New Alias |
|--------------|-----------|
| `--xtend-glass-bg` | `--xtend-surface-overlay` |
| `--xtend-shadow` | `--xtend-elevation-2` |
| `--xtend-radius` | `--xtend-radius-md` |
| `--xtend-font-family` | `--xtend-font-family-body` |
| `--xtend-overlay-bg` | `--xtend-surface-overlay` |
| `--xtend-border-color` | `--xtend-border-subtle` |
| `--header-bg` | `--xtend-header-surface` |
| `--header-fg` | `--xtend-header-text` |
| `--drawer-bg` | `--xtend-drawer-surface` |
| `--drawer-color` | `--xtend-drawer-text` |
| `--button-text-color` | `--xtend-button-text` |

Migration rule: old names may remain as fallback, but new documentation, new themes and new components must lead with the `--xtend-*` alias chain. Removing or renaming public parts and tokens requires migration notes.

## Acceptance for Corporate Themes

Before handoff to a host design system, these gates should run:

```bash
node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json
node scripts/run_xtend_tests.js xtheme-token-alias-layer --json
node scripts/run_xtend_tests.js enterprise-component-style-audit --json
node scripts/run_xtend_tests.js enterprise-visual-dom-snapshot-matrix --json
node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
```

Acceptance is only robust when Light, Dark, High Contrast, Forced Colors, Reduced Motion, Comfortable, Compact and Dense have been tested in the same corporate theme.

## Release Handoff

Starting with `ECH-WP-12`, [Enterprise Component Flex Release Handoff](./enterprise-component-flex-release-handoff.md) carries the contract `xtend.enterprise.component-flex-release-handoff.v1`. It connects SemVer assessment, deprecated aliases, migration notes, release checklist and adoption risks for corporate themes. The local gate `node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json` must be green before release-owner review; publishing remains blocked by `private-until-release-owner-acceptance` until then.
