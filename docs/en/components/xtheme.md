# xtheme - XTend Core Module

## Overview

`xtheme.js` is XTend's central theme management module. The runtime is exposed
under `window.XTend.theme`; `window.XTheme` remains as the public compatibility
facade.

## Public API

| Method | Description |
|--------|-------------|
| `getCurrentTheme()` | returns the active theme |
| `getAvailableThemes()` | returns all known themes |
| `setTheme(themeName)` | switches to a theme |
| `toggleDarkMode()` | switches between `light` and `dark` |
| `registerTheme(name, properties)` | registers or extends a theme |
| `loadExternalTheme(name, cssUrl)` | loads an external theme CSS |
| `removeExternalTheme(name)` | removes an external theme CSS |
| `set(name, value)` | compatibility facade for theme or CSS variable |
| `get(name)` | reads current theme or CSS variable |
| `subscribe(fn)` | registers a listener for theme changes |
| `getDesignTokens(themeName?)` | returns central XTend design tokens for a theme |
| `getDesignTokenContract()` | returns the productive contract `xtend.design-tokens.product-contract.v1` with theme packs, density packs, and CSS parts |
| `setDensity(density)` | sets the global density boundary to `compact`, `comfortable`, or `dense` |
| `getDensity()` | returns the active density |
| `getAvailableDensities()` | returns all supported density presets |
| `getThemeContext()` | returns propagated theme/density/preference context |
| `snapshotPerformance()` | returns the current performance/Fabric diagnostics snapshot |
| `getPerformanceProfile()` | returns the performance profile `xtend.performance.component-profile.v1` |
| `getRmtMetadata()` | returns RMT shell authoring metadata without RMT kernel coupling |
| `getComponentNetworkContext()` | returns the Component Network Provider Contract |
| `getA11yPreferences()` | returns reduced-motion, forced-colors, and color-scheme snapshot |
| `getMotionPreference()` | returns `default` or `reduced` |
| `getContrastPreference()` | returns `normal` or `forced-colors` |
| `getA11yProfile()` | returns the runtime a11y provider contract |
| `getMotionContrastPolicy()` | returns the motion/contrast policy for gates |

## `set(name, value)` Contract

```js
window.XTend.theme.setTheme('dark');
window.XTend.theme.set('light');
window.XTend.theme.set('--primary-color', '#0e4e81');
```

- `set('dark')` is an alias for `setTheme('dark')`
- `set('--primary-color', '#0e4e81')` writes a CSS variable into the current
  theme

## Theme Lifecycle

- the active theme is mirrored to `data-theme` on `document.documentElement`
- density is mirrored to `data-xtend-density` on `document.documentElement`
- motion and contrast preferences are mirrored to `data-xtend-motion`,
  `data-xtend-contrast`, and `data-xtend-forced-colors`
- `document.documentElement.style.colorScheme` follows the active theme
  (`light`/`dark`)
- registered CSS variables are managed per theme and reapplied on switch
- externally loaded themes are cached and reapplied when activated later
- theme changes are synchronized through `xstate`:
  - `theme`
  - `themes`
  - `xtend.theme.current`
  - `xtend.theme.density`
  - `xtend.theme.available`
  - `xtend.theme.preferences`
  - `xtend.theme.context`
  - `xtend.theme.performanceProfile`
  - `xtend.theme.performanceSnapshot`
  - `xtend.theme.rmtMetadata`
  - `xtend.theme.componentNetwork`
  - `xtend.theme.prefersReducedMotion`
  - `xtend.theme.forcedColors`
  - `xtend.a11y.motion`
  - `xtend.a11y.contrast`

## Central XTend Tokens

The default themes provide productive base tokens for core components,
including:

- `--xtend-color-primary`
- `--xtend-color-primary-dark`
- `--xtend-color-accent`
- `--xtend-glass-bg`
- `--xtend-glass-blur`
- `--xtend-shadow`
- `--xtend-border`
- `--xtend-radius`
- `--xtend-font-family`
- `--xtend-focus-outline`
- `--xtend-focus-outline-offset`
- `--xtend-surface`
- `--xtend-surface-muted`
- `--xtend-text`
- `--xtend-overlay-bg`
- `--xtend-motion-duration-fast`
- `--xtend-motion-duration-base`
- `--xtend-motion-scale`
- `--xtend-density-scale`
- `--xtend-density-spacing`
- `--xtend-control-height`
- `--xtend-font-scale`

Starting with `WP-E12-12`, these tokens are part of the product contract
`xtend.design-tokens.product-contract.v1`. `getDesignTokenContract()` returns
theme packs (`light`, `dark`, `high-contrast`, `forced-colors`), density packs
(`compact`, `comfortable`, `dense`), and stable CSS parts. The separate
developer documentation is [Design Tokens](../design-tokens.md).

## Performance Profile and Density Boundary

Since `WP-E12-05`, `x-theme` is the central theme, preference, and density
boundary for the component stack. The module has an explicit performance
profile:

- Schema: `xtend.performance.component-profile.v1`
- Lane: `user-blocking`
- Hydration Policy: `eager`
- Measurement points: `xtend.theme.initialize`, `xtend.theme.apply`,
  `xtend.theme.propagate`, `xtend.theme.density`, and
  `xtend.theme.external-css`
- Fabric Snapshot Path: `xtend.theme.performanceSnapshot`

Density is treated as provider context, not as a local component property.
`setDensity('compact')`, `setDensity('comfortable')`, and
`setDensity('dense')` set `data-xtend-density` and the tokens
`--xtend-density-scale`, `--xtend-density-spacing`,
`--xtend-control-height`, and `--xtend-font-scale`. `spacious` is no longer a
productive density name and is normalized to `comfortable` for old persisted
data.

The propagated context lives under `xtend.theme.context` and uses schema
`xtend.theme.context.v1`. It contains theme, density, a11y preferences, active
tokens, density tokens, RMT metadata, Fabric lane, and a `propagationVersion`.

## RMT and Component Network

`x-theme` provides RMT shell authoring metadata without embedding XTend in the
RMT kernel:

- RMT Schema: `xtend.rmt.component-contract.v1`
- Adapter: `xtend.theme-provider`
- Shell Authoring Schema: `xtend.rmt.shell-authoring.component.v1`
- Kernel Boundary: `no-rmt-kernel-import-of-xtend-types`

The Component Network Contract uses `xtend.component.network.v1`. Consumers
such as `xtend.component`, `xtend.xrouter`, `xtend.fabric-telemetry`, or
`rmt.shell-authoring` read the published context through events and `xstate`,
not through hard imports.

## Reduced Motion and Forced Colors

Since `WP-E12-04`, `x-theme` is the central a11y preference boundary for the
component stack. The module observes `prefers-reduced-motion: reduce`,
`forced-colors: active`, and `prefers-color-scheme: dark` without importing
XTendRMT or host frameworks.

- Reduced motion sets `data-xtend-motion="reduced"` and reduces central motion
  tokens to `0ms`.
- Forced colors sets `data-xtend-contrast="forced-colors"` and
  `data-xtend-forced-colors="active"`.
- Internal CSS rules use `forced-color-adjust: auto`, `Canvas`, `CanvasText`,
  `Highlight`, and `HighlightText`.
- System preference changes fire `theme-preference-changed`.
- An invisible live region with `role="status"` and `aria-live="polite"`
  announces theme and preference changes for screen readers.
- The policy exists as `xtend.a11y.motion-contrast-policy.v1` and is exposed
  through `getMotionContrastPolicy()`.

## Events

| Event | Description |
|-------|-------------|
| `theme-initialized` | after theme manager initialization |
| `theme-changed` | after theme switch |
| `theme-variable-changed` | after a CSS variable change |
| `theme-preference-changed` | after reduced-motion, forced-colors, or system preference changes |
| `theme-a11y-announcement` | after screen reader announcement for theme or preference change |
| `theme-density-changed` | after density change |
| `theme-context-changed` | after propagation of a new theme context |
| `theme-performance-measured` | after local theme/density/propagation measurement |

## Example

```js
window.XTend.theme.setTheme('light');
window.XTend.theme.set('--body-bg', '#f9f9f9');

window.XTend.theme.registerTheme('dark', {
  '--body-bg': '#181a1b',
  '--text-color': '#fff'
});
```

## Notes

- `xtheme.js` is a core module, not a separate styling framework.
- The runtime is namespaced under `window.XTend.theme`; `window.XTheme` is only
  the public compatibility facade.
- External theme CSS files remain available for later activations after their
  first load.
