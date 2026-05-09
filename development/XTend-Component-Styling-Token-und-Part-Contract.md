# XTend Component Styling, Token und CSS-Part Contract

- Status: Accepted
- Datum: 7. Mai 2026
- Contract: `xtend.component.styling.v1`
- Report Contract: `xtend.component.styling-report.v1`
- Workpackage: `WP-E11-03`
- Bezug:
  - `development/EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/BACKLOG-EPIC-11-XTend-Component-UX-Shell-Styling-A11y-und-Kompatibilitaetsreife.md`
  - `development/WP-E11-03-Styling-Token-und-CSS-Part-Contract-definieren.md`
  - `development/XTend-Component-Shell-Contract.md`
  - `development/XTend-Component-UX-Reifegradmodell.md`
  - `development/XTend-Component-Contract-v2.md`
  - `development/XTend-A11y-Component-Contract.md`
  - `development/XTend-Motion-und-Contrast-Policy.md`
  - `xtend-builder/typing/component-styling-contract.js`
  - `tests/components/component_styling_contract_suite.js`

## Zweck

Der Styling Contract macht die visuelle Anpassbarkeit von XTend-Komponenten zur stabilen Public API. Enterprise-Komponenten duerfen Styling nicht als internes CSS-Detail behandeln: Tokens, CSS Custom Properties, CSS Parts, Variants, Sizes, Density, Theme-Bridges, Motion und Contrast sind Teil der Component Experience.

Der Contract erweitert den Shell Contract `xtend.component.shell.v1`. Die Shell definiert die sichtbaren Zonen, States und Parts; der Styling Contract definiert, wie diese Zonen kontrolliert, robust und framework-agnostisch gestaltet werden.

## Leitentscheidung

Styling ist API, nicht Nebenwirkung.

Ab Epic 11 gilt:

- Tokens erhalten stabile Namen, Defaults und Fallbacks.
- CSS Custom Properties sind component-scoped und duerfen globale Theme Tokens referenzieren.
- CSS Parts sind Public API und nur mit Migration entfernbar.
- Variants, Sizes und Density sind geschlossene, dokumentierte Wertemengen.
- Theme-Bridges laufen ueber `x-theme` oder Host Tokens, nicht ueber CDN- oder Runtime-Pflicht.
- High Contrast, Forced Colors und Reduced Motion sind Styling-Pflichten.
- RMT kann Style-Daten deklarieren, ohne XTend in den RMT Kernel einzubetten.

## Interface

```ts
export interface XtendComponentStylingContract {
  schema: 'xtend.component.styling.v1';
  status: 'contract-draft' | 'accepted' | 'deprecated';
  workpackage: 'WP-E11-03';
  componentContract: 'xtend.component.contract.v2';
  shellContract: 'xtend.component.shell.v1';
  uxMaturityModel: 'xtend.component.ux-maturity-model.v1';
  tag: string;
  tokens: XtendDesignTokenContract[];
  customProperties: XtendCustomPropertyContract;
  parts: XtendCssPartContract[];
  variants: XtendVariantContract;
  sizes: XtendSizeContract;
  density: XtendDensityContract;
  themes: XtendThemeBridgeContract;
  motion: XtendMotionStylingContract;
  contrast: XtendContrastStylingContract;
  rmt: XtendRmtStyleAuthoringContract;
  fabric: XtendStylingFabricContract;
  compatibility: XtendStylingCompatibilityContract;
  docs: XtendStylingDocsContract;
  tests: XtendStylingTestContract;
}
```

## Pflichtdomains

| Domain | Pflicht |
|--------|---------|
| `tokens` | stabile Design Tokens mit Kategorie, Default und Fallback |
| `customProperties` | component-scoped CSS Custom Properties |
| `parts` | CSS Parts als Skinning-Oberflaeche |
| `variants` | erlaubte semantische Varianten |
| `sizes` | Groessenprofile |
| `density` | Enterprise-Dichteprofile |
| `themes` | Light, Dark, High Contrast und Forced Colors |
| `motion` | Standard- und Reduced-Motion-Verhalten |
| `contrast` | Fokus, Status und nicht farb-only Feedback |
| `rmt` | Adapterdaten fuer `xtend.rmt.style-authoring.v1` |
| `fabric` | Diagnostics und Telemetry fuer Styling-Entscheidungen |
| `compatibility` | Host- und Framework-Kompatibilitaet |
| `docs` | Autorendokumentation |
| `tests` | lokale Gates, Fixtures und Visual/Theme-Folgepflichten |

## Token-Kategorien

Jede Enterprise-reife Styling-Deklaration muss Tokens in diesen Kategorien kennen:

| Kategorie | Zweck |
|-----------|-------|
| `color` | Akzent-, Border- oder interaktive Farben |
| `surface` | Hintergrund- und Containerflaechen |
| `text` | Text- und Icon-Farben |
| `space` | Abstaende und Gap-Regeln |
| `radius` | Ecken und Form |
| `typography` | Schriftfamilie, Groesse, Gewicht oder Zeilenhoehe |
| `motion` | Dauer, Timing und Transition-Regeln |
| `elevation` | Schatten, Ebenen und Layer-Hinweise |
| `state` | Statusfarben, Validierung, Busy oder Active States |

Token-Namen muessen mit `--xtend-` beginnen. Komponentenlokale Tokens nutzen den Prefix `--xtend-<component>-`.

Beispiel:

```css
--xtend-button-color: var(--xtend-color-text, currentColor);
--xtend-button-surface: var(--xtend-color-surface, transparent);
--xtend-button-gap: var(--xtend-space-2, 0.5rem);
--xtend-button-radius: var(--xtend-radius-sm, 4px);
--xtend-button-motion-duration: var(--xtend-motion-duration-fast, 120ms);
```

Fallbacks sind Pflicht. Ein Token ohne Fallback ist fuer Enterprise-Shells nicht `ux-stable`.

## CSS Custom Properties

Custom Properties sind die bevorzugte Anpassungsoberflaeche fuer Host Apps.

Pflichten:

- component-scoped Prefix
- Fallbacks fuer alle produktiven Werte
- keine ungeplanten globalen `--foo` Properties
- keine CDN- oder Remote-Theme-Pflicht
- Host Theme Bridge ueber `x-theme`, globale XTend Tokens oder app-eigene Tokens

## CSS Parts

CSS Parts verbinden Shell und Styling. Basisparts:

- `root`
- `control`
- `label`
- `content`
- `helper`
- `error`

Weitere Shell-spezifische Parts wie `icon`, `overlay`, `backdrop`, `listbox`, `option`, `thumb`, `track`, `panel` oder `media` sind erlaubt, muessen aber dokumentiert werden.

CSS Parts sind Public API. Entfernen oder Umbenennen ist ein Contract Change und braucht Migration Notes.

## Variants

Pflichtvarianten:

- `default`
- `primary`
- `secondary`
- `success`
- `warning`
- `danger`
- `neutral`

Komponenten duerfen weitere Varianten wie `ghost`, `outline`, `quiet`, `subtle` oder fachliche Varianten definieren. Unbekannte Varianten werden ignoriert und diagnostiziert, nicht hart zur Laufzeit gebrochen.

## Sizes

Pflichtgroessen:

- `sm`
- `md`
- `lg`

`md` ist Default. Komponenten, fuer die Groessen semantisch keinen Sinn ergeben, brauchen eine dokumentierte Ausnahme.

## Density

Pflichtprofile: `comfortable`, `compact`, `dense`.

Kurzform fuer Gates und Doku: `comfortable`, `compact`, `dense`.

Density ist fuer Enterprise-UIs wichtig, weil dieselbe Komponente in formularlastigen Admin-Oberflaechen, dichtem Monitoring oder grosszuegigen Produktseiten nutzbar bleiben muss.

## Themes

Pflichtthemes:

- `light`
- `dark`
- `high-contrast`
- `forced-colors`

Theme-Vererbung erfolgt ueber `x-theme`, Host Tokens oder app-eigene globale Tokens. Komponenten duerfen keine Remote Theme Bundles erzwingen.

## Motion und Contrast

Motion-Pflichten:

- `standard`
- `reduced`
- Kernfunktion ohne Motion
- `prefers-reduced-motion` kompatible Defaults

Contrast-Pflichten:

- sichtbarer Fokus
- Forced Colors kompatibel
- High Contrast kompatibel
- kein rein farbbasiertes Feedback
- Error, Disabled, Busy und Invalid States bleiben wahrnehmbar

## RMT Style Authoring

Der Styling Contract bereitet `xtend.rmt.style-authoring.v1` vor.

RMT darf folgende Felder deklarieren:

- `style`
- `tokens`
- `parts`
- `variant`
- `size`
- `density`
- `theme`
- `motion`
- `contrast`

Beispiel:

```json
{
  "id": "settings.submit",
  "kind": "custom_element",
  "adapter": "xtend.component",
  "tag": "x-button",
  "props": {
    "variant": "primary",
    "size": "md"
  },
  "style": {
    "tokens": {
      "--xtend-button-surface": "var(--xtend-color-accent, #1358ff)"
    },
    "parts": {
      "control": ["enterprise-action"]
    },
    "density": "compact",
    "theme": "dark"
  }
}
```

RMT bleibt host-neutral. Der XTend Component Adapter konsumiert Style-Daten. Boundary: `no-rmt-kernel-import-of-xtend-types`.

## Fabric Diagnostics

Styling-Entscheidungen muessen fuer Fabric diagnostizierbar sein:

- `style.token.missing`
- `style.variant.unknown`
- `style.theme.unsupported`

Telemetry-Felder:

- `componentId`
- `variant`
- `size`
- `density`
- `theme`
- `forcedColors`
- `reducedMotion`

## Compatibility

Der Styling Contract muss in folgenden Host-Modi funktionieren:

- `xtend-only`
- `rmt-first`
- `vanilla`
- `react`
- `vue`
- `custom-shell`

Shadow-DOM-Skinning erfolgt ueber CSS Parts und Tokens. Inline-Styles sind nur als tokenisierte Werte akzeptiert, nicht als beliebiger Host-Override fuer interne Struktur.

## Gate

Lokaler Gate:

```bash
node scripts/run_xtend_tests.js component-styling-contract --json
```

Package Script:

```bash
npm run test:component-styling-contract
```

Die Suite validiert Factory, Validator, Package-Metadaten, Scaffold-Anschluss, Runner, Epic-/Backlog-Status und Doku.

## Handoff

`WP-E11-03` ist Grundlage fuer:

- `WP-E11-04` Runtime-A11y, weil Fokus, Contrast, Motion und Statussignale visuell anschlussfaehig sein muessen
- `WP-E11-05` Performance-Profile, weil Styling-Kosten, Motion und Theme-Wechsel budgetiert werden muessen
- `WP-E11-07` RMT Shell Authoring, weil RMT Style-Daten deklarieren koennen soll
- `WP-E11-08` bis `WP-E11-12`, weil Komponentenfamilien gegen Styling-Reife bewertet werden
- `WP-E11-15` Visual Regression und Theme Matrix
