# XTend Enterprise Design System Token Contract

- Status: Accepted
- Datum: 8. Mai 2026
- Contract: `xtend.design-tokens.product-contract.v1`
- Pack Contract: `xtend.design-tokens.pack.v1`
- Report Contract: `xtend.design-tokens.report.v1`
- Workpackage: `WP-E12-12`
- Lokaler Gate: `node scripts/run_xtend_tests.js design-tokens --json`
- Bezug:
  - `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md`
  - `development/WP-E12-12-Enterprise-Design-System-Token-Productization-vorbereiten.md`
  - `development/XTend-Component-Styling-Token-und-Part-Contract.md`
  - `development/XTend-Epic11-Component-Shell-Visual-Theme-Matrix.md`
  - `development/XTend-Visual-Snapshot-Automation-Contract.md`
  - `design-tokens/xtend-design-tokens.js`
  - `design-tokens/themes/enterprise-light.json`
  - `tests/tokens/design_token_contract_suite.js`
  - `docs/design-tokens.md`

## Zweck

`WP-E12-12` hebt die bisherige Styling- und Theme-Arbeit auf eine produktnahe Design-System-Schicht. Die Token-Namen sind nicht mehr nur Fixture- oder Component-Konvention, sondern eine stabile Public API fuer Apps, Themes, Component Shells, RMT Authoring und Visual Regression.

Die Leitentscheidung lautet: `x-theme`, Component Shell Theme Matrix und Visual Snapshot Baseline nutzen dieselben `--xtend-*` Token-Namen. Lokale Fixture-Tokens wie `--matrix-*` oder `--snapshot-*` sind damit nicht mehr Teil der Produktlinie.

## Product Surface

| Feld | Entscheidung |
|------|--------------|
| Namespace | `--xtend-` |
| Runtime Provider | `x-theme` |
| Machine Contract | `design-tokens/xtend-design-tokens.js` |
| Beispiel-Theme | `design-tokens/themes/enterprise-light.json` |
| Lokaler Gate | `node scripts/run_xtend_tests.js design-tokens --json` |
| Package Script | `npm run test:design-tokens` |
| Kernel Boundary | `no-rmt-kernel-import-of-xtend-types` |

## Token-Kategorien

| Kategorie | Beispiele |
|-----------|-----------|
| `color` | `--xtend-color-primary`, `--xtend-color-primary-dark`, `--xtend-color-accent` |
| `surface` | `--xtend-surface`, `--xtend-surface-muted`, `--xtend-overlay-bg`, `--xtend-glass-bg` |
| `text` | `--xtend-text` |
| `state` | `--xtend-info-bg`, `--xtend-success-bg`, `--xtend-warning-bg`, `--xtend-error-bg` |
| `border` | `--xtend-border`, `--xtend-border-color` |
| `focus` | `--xtend-focus-outline`, `--xtend-focus-outline-offset` |
| `elevation` | `--xtend-shadow` |
| `radius` | `--xtend-radius` |
| `typography` | `--xtend-font-family`, `--xtend-font-scale` |
| `motion` | `--xtend-motion-duration-fast`, `--xtend-motion-duration-base`, `--xtend-motion-scale` |
| `density` | `--xtend-density-scale`, `--xtend-density-spacing`, `--xtend-control-height` |

## Theme Packs

Pflicht-Packs:

- `light`
- `dark`
- `high-contrast`
- `forced-colors`

Jedes Theme Pack nutzt `xtend.design-tokens.pack.v1` und muss die Theme Tokens bereitstellen. `high-contrast` nutzt harte Kontrastwerte wie `#ffff00` und `#ffffff`; `forced-colors` nutzt Systemfarben wie `Canvas`, `CanvasText`, `Highlight` und `HighlightText`.

## Density Packs

Pflicht-Packs:

- `comfortable`
- `compact`
- `dense`

Density Packs schreiben ausschliesslich Density- und Typografie-Skalierung:

- `--xtend-density-scale`
- `--xtend-density-spacing`
- `--xtend-control-height`
- `--xtend-font-scale`

`spacious` ist kein produktiver Density-Name mehr. Wenn ein altes Persistenzartefakt diesen Wert enthaelt, normalisiert `x-theme` ihn auf `comfortable`.

## CSS Custom Properties und CSS Parts

Apps duerfen die Produkt-Tokens direkt setzen oder ueber `x-theme.registerTheme(name, tokens)` registrieren. Komponenten duerfen diese Tokens referenzieren und zusaetzlich component-scoped Tokens aus `xtend.component.styling.v1` anbieten.

Stabile CSS Parts fuer Enterprise-Shells:

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

## RMT Boundary

RMT darf Theme Packs, Density Packs und Style Descriptors schedulen oder in Templates referenzieren. Der Kernel bleibt aber framework-agnostisch: `no-rmt-kernel-import-of-xtend-types`.

## Gates

```bash
node scripts/run_xtend_tests.js design-tokens --json
npm run test:design-tokens
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js visual-snapshots --json
```

Der neue Gate prueft:

- Design Token Contract und Beispiel-Theme
- `x-theme` Token-API `getDesignTokenContract()`
- gemeinsame Token-Namen in Theme Matrix und Snapshot Fixture
- keine `--matrix-*` oder `--snapshot-*` Token in Produktfixtures
- Package-, Scaffold-, Docs- und Referenzpfade

## Handoff

`WP-E12-13` kann auf dieser Produktisierung aufbauen und die RMT DSL Authoring Experience fuer Component Shells verbessern, ohne Token-Namen erneut umzuschneiden.
