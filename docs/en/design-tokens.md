# Design Tokens

Starting with `WP-E12-12`, XTend uses the contract
`xtend.design-tokens.product-contract.v1`. Central theme, density, motion,
focus, and status values are therefore a stable product API, not just internal
CSS helper values.

Local gate:

```bash
node scripts/run_xtend_tests.js design-tokens --json
npm run test:design-tokens
```

## Runtime Provider

`x-theme` is the runtime provider. Apps can register tokens through theme
packs:

```js
window.XTend.theme.registerTheme('enterprise-light', {
  '--xtend-color-primary': '#2563eb',
  '--xtend-surface': '#ffffff',
  '--xtend-text': '#111827',
  '--xtend-density-spacing': '0.75rem'
});
```

The complete example base lives in
`design-tokens/themes/enterprise-light.json`.

## Product Tokens

Important custom properties:

| Token | Purpose |
|-------|---------|
| `--xtend-color-primary` | interactive primary color |
| `--xtend-color-primary-dark` | hover/active variant |
| `--xtend-color-accent` | accent or inverse foreground color |
| `--xtend-surface` | default surface |
| `--xtend-surface-muted` | secondary surface |
| `--xtend-text` | default text |
| `--xtend-overlay-bg` | overlay background |
| `--xtend-border-color` | semantic border color |
| `--xtend-focus-outline` | keyboard focus |
| `--xtend-focus-outline-offset` | focus offset |
| `--xtend-info-bg` / `--xtend-info-fg` | info status |
| `--xtend-success-bg` / `--xtend-success-fg` | success status |
| `--xtend-warning-bg` / `--xtend-warning-fg` | warning status |
| `--xtend-error-bg` / `--xtend-error-fg` | error status |
| `--xtend-shadow` | elevation |
| `--xtend-radius` | default radius |
| `--xtend-font-family` | font family |
| `--xtend-motion-duration-fast` | fast transition |
| `--xtend-motion-duration-base` | base transition |
| `--xtend-motion-scale` | motion scaling |
| `--xtend-density-spacing` | density spacing |
| `--xtend-control-height` | density control height |
| `--xtend-font-scale` | density font scaling |

## Theme Packs

Required packs:

- `light`
- `dark`
- `high-contrast`
- `forced-colors`

`high-contrast` and `forced-colors` are part of the product contract.
`forced-colors` uses system colors such as `Canvas`, `CanvasText`,
`Highlight`, and `HighlightText`.

## Density Packs

Required packs:

- `comfortable`
- `compact`
- `dense`

`x-theme.setDensity('dense')` sets `--xtend-density-spacing`,
`--xtend-density-scale`, `--xtend-control-height`, and `--xtend-font-scale`.
`spacious` is no longer part of the enterprise token line.

## CSS Parts

The token layer complements the component styling contract. Components continue
to document their own `::part(...)` surfaces. Shared public parts are:

- `root`
- `control`
- `label`
- `content`
- `helper`
- `error`
- `icon`
- `panel`
- `overlay`
- `backdrop`
- `listbox`
- `option`
- `track`
- `thumb`
- `media`

## RMT Authoring

RMT can schedule or declare theme packs, density packs, and style data. The
kernel imports no XTend types; the boundary remains
`no-rmt-kernel-import-of-xtend-types`.

The Component Shell Theme Matrix and Visual Snapshot Fixture use the same
`--xtend-*` tokens as `x-theme`. XTend apps can therefore later be templated
fully RMT-first without carrying a second token vocabulary.

## RC0 Adoption Update

Since `WP-E12-15`, the [RC0 Adoption Guide](./rc0-adoption-guide.md) points to
Design Tokens as the required styling baseline for new components and RMT
shells. Token or CSS part changes count as public API changes and need
migration notes in the RC0 handoff.

## ECH-WP-11 Third-Party Design Authoring Update

The guide [Third-Party Design Authoring](./third-party-design-authoring.md)
translates the token layer into a corporate-design path for host apps. It
describes XTend.css override patterns, XTheme token bridge, CSS parts, icon
pack registration, layout modes, a11y dos and don'ts, P0 token/part
references, and migration from legacy token names.

Local gate:

```bash
node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json
```
