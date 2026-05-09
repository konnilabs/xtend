# Design Tokens

XTend nutzt ab `WP-E12-12` den Contract `xtend.design-tokens.product-contract.v1`. Damit sind zentrale Theme-, Density-, Motion-, Focus- und Statuswerte eine stabile Produkt-API, nicht nur interne CSS-Hilfswerte.

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js design-tokens --json
npm run test:design-tokens
```

## Runtime Provider

`x-theme` ist der Runtime Provider. Apps koennen Tokens ueber Theme Packs registrieren:

```js
window.XTend.theme.registerTheme('enterprise-light', {
  '--xtend-color-primary': '#2563eb',
  '--xtend-surface': '#ffffff',
  '--xtend-text': '#111827',
  '--xtend-density-spacing': '0.75rem'
});
```

Die vollstaendige Beispielbasis liegt in `design-tokens/themes/enterprise-light.json`.

## Produkt-Tokens

Wichtige Custom Properties:

| Token | Zweck |
|-------|-------|
| `--xtend-color-primary` | interaktive Primaerfarbe |
| `--xtend-color-primary-dark` | Hover-/Active-Variante |
| `--xtend-color-accent` | Akzent oder inverse Vordergrundfarbe |
| `--xtend-surface` | Standardflaeche |
| `--xtend-surface-muted` | sekundare Flaeche |
| `--xtend-text` | Standardtext |
| `--xtend-overlay-bg` | Overlay-Hintergrund |
| `--xtend-border-color` | semantische Borderfarbe |
| `--xtend-focus-outline` | Keyboard-Fokus |
| `--xtend-focus-outline-offset` | Fokus-Abstand |
| `--xtend-info-bg` / `--xtend-info-fg` | Info-Status |
| `--xtend-success-bg` / `--xtend-success-fg` | Success-Status |
| `--xtend-warning-bg` / `--xtend-warning-fg` | Warning-Status |
| `--xtend-error-bg` / `--xtend-error-fg` | Error-Status |
| `--xtend-shadow` | Elevation |
| `--xtend-radius` | Standardradius |
| `--xtend-font-family` | Schriftfamilie |
| `--xtend-motion-duration-fast` | schnelle Transition |
| `--xtend-motion-duration-base` | Basis-Transition |
| `--xtend-motion-scale` | Motion-Skalierung |
| `--xtend-density-spacing` | Density-Abstand |
| `--xtend-control-height` | Density-Control-Hoehe |
| `--xtend-font-scale` | Density-Schrift-Skalierung |

## Theme Packs

Pflicht-Packs:

- `light`
- `dark`
- `high-contrast`
- `forced-colors`

`high-contrast` und `forced-colors` sind Teil des Produktvertrags. `forced-colors` nutzt Systemfarben wie `Canvas`, `CanvasText`, `Highlight` und `HighlightText`.

## Density Packs

Pflicht-Packs:

- `comfortable`
- `compact`
- `dense`

`x-theme.setDensity('dense')` setzt `--xtend-density-spacing`, `--xtend-density-scale`, `--xtend-control-height` und `--xtend-font-scale`. `spacious` ist nicht mehr Teil der Enterprise-Token-Linie.

## CSS Parts

Die Token-Schicht ergaenzt den Component Styling Contract. Komponenten dokumentieren weiterhin ihre eigenen `::part(...)` Oberflaechen. Gemeinsame Public Parts sind:

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

RMT kann Theme Packs, Density Packs und Style-Daten schedulen oder deklarieren. Der Kernel importiert keine XTend-Typen; die Boundary bleibt `no-rmt-kernel-import-of-xtend-types`.

Die Component Shell Theme Matrix und Visual Snapshot Fixture nutzen dieselben `--xtend-*` Tokens wie `x-theme`. Dadurch koennen XTend Apps spaeter komplett RMT-first templated werden, ohne ein zweites Token-Vokabular mitzuschleppen.

## RC0 Adoption Update

Seit `WP-E12-15` verweist der [RC0 Adoption Guide](./rc0-adoption-guide.md) auf Design Tokens als verpflichtende Styling-Baseline fuer neue Komponenten und RMT-Shells. Token- oder CSS-Part-Aenderungen gelten als Public-API-Aenderungen und brauchen Migration Notes im RC0-Handoff.
