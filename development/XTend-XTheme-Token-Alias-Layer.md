# XTend XTheme Token Alias Layer

Status: Completed
Schema: `xtend.theme.token-alias-layer.v1`
Workpackage: `ECH-WP-03`

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js xtheme-token-alias-layer --json
npm run test:xtheme-token-alias-layer
```

## Ziel

Der Alias Layer normalisiert die Token-Kette zwischen `x-theme`, `XTend.css`, Signature UI und den P0-Komponenten. Externe Enterprise-Apps sollen ein Corporate Design ueber globale Tokens und component-scoped Aliases einspielen koennen, ohne Shadow-DOM-Interna oder lokale Theme-Sonderlogik anfassen zu muessen.

## Kanonische Prefixes

| Prefix | Zweck |
|--------|-------|
| `--xtend-color-*` | interaktive und semantische Farben |
| `--xtend-surface-*` | Seiten-, Panel-, Overlay- und Control-Flaechen |
| `--xtend-text-*` | primaere, gedimmte, inverse und Action-Texte |
| `--xtend-radius-*` | Radius-Skala fuer Panel und Controls |
| `--xtend-space-*` | Density-faehige Abstaende |
| `--xtend-elevation-*` | Schatten, Fokus- und Overlay-Ebenen |
| `--xtend-motion-*` | Dauer und Easing |

## Globale Alias-Beispiele

| Alias | Quelle |
|-------|--------|
| `--xtend-surface-page` | `--xtend-surface` |
| `--xtend-surface-panel` | `--xtend-surface-muted` |
| `--xtend-surface-raised` | `--xtend-signature-surface-raised` |
| `--xtend-text-primary` | `--xtend-text` |
| `--xtend-color-action` | `--xtend-color-primary` |
| `--xtend-border-subtle` | `--xtend-border-color` |
| `--xtend-radius-control` | `--xtend-radius-sm` |
| `--xtend-space-control-gap` | `--xtend-density-spacing` |
| `--xtend-elevation-2` | `--xtend-shadow` |
| `--xtend-font-family-control` | `--xtend-font-family-body` |

## Legacy Mapping

Alte Namen bleiben als Bridge dokumentiert und werden nicht abrupt entfernt:

| Legacy | Normalisiert |
|--------|--------------|
| `--xtend-glass-bg` | `--xtend-surface-overlay` |
| `--xtend-shadow` | `--xtend-elevation-2` |
| `--xtend-radius` | `--xtend-radius-md` |
| `--xtend-font-family` | `--xtend-font-family-body` |
| `--xtend-overlay-bg` | `--xtend-surface-overlay` |
| `--xtend-border-color` | `--xtend-border-subtle` |
| `--header-bg` | `--xtend-header-surface` |
| `--drawer-bg` | `--xtend-drawer-surface` |
| `--button-text-color` | `--xtend-button-text` |

## P0 Component Aliases

Jede P0-Komponente bekommt einen eigenen Prefix:

| Component | Prefix | Mindestrollen |
|-----------|--------|---------------|
| `x-theme` | `--xtend-theme-*` | surface, text |
| `x-header` | `--xtend-header-*` | surface, text, border, radius, elevation, menu |
| `x-icon` | `--xtend-icon-*` | color, size, stroke width |
| `x-button` | `--xtend-button-*` | surface, text, primary surface, radius, elevation, focus |
| `x-menu` | `--xtend-menu-*` | surface, text, `--xtend-menu-item-surface`, `--xtend-menu-item-hover-surface`, radius, elevation |
| `x-drawer` | `--xtend-drawer-*` | surface, text, border, overlay, elevation |
| `x-side-panel` | `--xtend-side-panel-*` | surface, text, border, elevation |
| `x-modal` | `--xtend-modal-*` | surface, text, overlay, elevation |
| `x-dialog` | `--xtend-dialog-*` | surface, text, elevation |
| `x-popover` | `--xtend-popover-*` | surface, text, elevation |
| `x-toast` | `--xtend-toast-*` | surface, text, elevation |

## XTend.css Beispiel

```css
:root {
  --xtend-color-primary: #2457a6;
  --xtend-color-primary-dark: #163d78;
  --xtend-surface: #f7f8fb;
  --xtend-surface-muted: #ffffff;
  --xtend-text: #172033;
  --xtend-border-color: rgba(23, 32, 51, 0.16);
  --xtend-radius: 8px;
  --xtend-shadow: 0 12px 34px rgba(16, 24, 40, 0.14);
  --xtend-font-family: "Aptos", "Inter", system-ui, sans-serif;
}

x-button {
  --xtend-button-radius: 6px;
  --xtend-button-elevation: none;
}

x-header {
  --xtend-header-surface: var(--xtend-surface-panel);
  --xtend-header-menu-surface: var(--xtend-surface-raised);
}
```

## XTheme Beispiel

```js
window.XTend.theme.registerTheme('customer-enterprise', {
  '--xtend-surface-page': '#f7f8fb',
  '--xtend-surface-panel': '#ffffff',
  '--xtend-text-primary': '#172033',
  '--xtend-color-action': '#2457a6',
  '--xtend-text-on-action': '#ffffff',
  '--xtend-radius-control': '6px',
  '--xtend-elevation-2': '0 12px 34px rgba(16, 24, 40, 0.14)',
  '--xtend-button-primary-surface': 'var(--xtend-color-action)',
  '--xtend-header-surface': 'var(--xtend-surface-panel)'
});
```

## Theme-Matrix

Die Fixture `tests/browser/fixtures/xtheme-token-alias-layer-smoke.html` bildet Light, Dark, High Contrast und Forced Colors ab. Forced Colors muss Systemfarben verwenden: `Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonFace` und `ButtonText`.

## Definition of Done

- `x-theme.getTokenAliasLayer()` liefert die Alias-Schicht zur Laufzeit.
- `x-theme.getDesignTokenContract()` referenziert `ECH-WP-03` ueber `aliasLayer`.
- Neue globale Tokens decken Color, Surface, Text, Radius, Space, Elevation und Motion ab.
- P0-Komponenten haben component-scoped Alias-Prefixes.
- `x-button` und `x-menu` nutzen die Alias-Schicht als sichtbare Pilot-Haertung.
- Host-Apps koennen sichtbare Flaechen ueber `XTend.css` oder `x-theme.registerTheme()` ueberschreiben.
