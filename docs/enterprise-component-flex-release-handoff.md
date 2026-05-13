# Enterprise Component Flex Release Handoff

- Contract: `xtend.enterprise.component-flex-release-handoff.v1`
- Workpackage: `ECH-WP-12`
- Status: `accepted-enterprise-design-system-ready-handoff`
- Target: `enterprise-design-system-ready-release-candidate`
- Current Version: `0.0.0-enterprise-readiness`
- Proposed Version: `0.1.0-enterprise-design-system-rc.1`
- Publish Boundary: `private-until-release-owner-acceptance`
- Local Gate: `node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json`
- Package Script: `npm run test:enterprise-component-flex-release-handoff`

## Zweck

Dieses Handoff schliesst die Enterprise Component Flexibilitaets- und Theme-Hardening-Welle ab. Es bewertet die SemVer-Auswirkung der neuen Attribute, Tokens, Parts und Doku-Oberflaechen, dokumentiert Deprecated Aliases, beschreibt die Migration fuer bestehende Apps und benennt die letzten Adoption Risiken vor einem Release Owner Review.

Das Paket ist release-ready, aber nicht automatisch publish-ready. `package.json` bleibt `private: true`; ein Publish braucht weiterhin Release Owner Acceptance und bei Bedarf Conditional Network Evidence.

## SemVer-Bewertung

Die Haertungswelle wird als `minor-pre-1.0-additive-public-api-hardening` bewertet.

| Bereich | Klassifizierung | Default kompatibel | Migration Pflicht | Notiz |
|---------|-----------------|--------------------|-------------------|-------|
| `x-header-menu-presentation-modes` | `minor-additive-public-api` | ja | nein | `menu-mode`, Placement, Modalitaet und Sizing sind additiv; der Default bleibt `drawer`. |
| `xtheme-token-alias-layer` | `minor-additive-token-api` | ja | nein | Normalisierte `--xtend-*` Aliases werden addiert, waehrend Legacy-Namen gebridged bleiben. |
| `icon-control-hardening` | `patch-compatible-a11y-hardening` | ja | nein | Sichtbare Textglyphen wurden durch echte Icon Controls ersetzt, ohne Host-Command-Intent zu brechen. |
| `overlay-layout-form-navigation-parts` | `minor-additive-css-parts-and-tokens` | ja | nein | Neue Parts und Component Tokens erweitern Skinning-Flaechen ohne dokumentierte Defaults zu entfernen. |
| `visual-dom-snapshot-matrix` | `test-artifact-only` | ja | nein | DOM-Baselines und Visual Quality Reports sind lokale Gates, keine Runtime-Breaking-Changes. |
| `third-party-authoring-guide` | `docs-only-adoption-handoff` | ja | nein | Corporate Design Authoring wird als unterstuetzter Override-Pfad dokumentiert. |

SemVer-Entscheidung:

- Bestehende Defaults bleiben kompatibel.
- Neue Modi sind additive Features.
- Breaking Changes: keine.
- Public Surface Aenderungen sind erwuenscht und dokumentiert: Attribute, Tokens, CSS Parts, Slots, XTheme-Bruecken und Docs-Gates.
- Vorgeschlagene Version: `0.1.0-enterprise-design-system-rc.1`.

## Deprecated Aliases

Deprecated Aliases bleiben fuer bestehende Apps gebridged. Entfernen oder Umbenennen ist erst in einem naechsten Major oder in einem expliziten Migration Window erlaubt.

| Typ | Deprecated | Replacement | Entfernung |
|-----|------------|-------------|------------|
| CSS Token | `--xtend-glass-bg` | `--xtend-surface-overlay` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--xtend-shadow` | `--xtend-elevation-2` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--xtend-radius` | `--xtend-radius-md` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--xtend-font-family` | `--xtend-font-family-body` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--xtend-overlay-bg` | `--xtend-surface-overlay` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--xtend-border-color` | `--xtend-border-subtle` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--header-bg` | `--xtend-header-surface` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--header-fg` | `--xtend-header-text` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--drawer-bg` | `--xtend-drawer-surface` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--drawer-color` | `--xtend-drawer-text` | `not-before-next-major-or-explicit-migration-window` |
| CSS Token | `--button-text-color` | `--xtend-button-text` | `not-before-next-major-or-explicit-migration-window` |
| CSS Part | `drawer` | `menu` | `not-before-next-major-or-explicit-migration-window` |
| CSS Part | `drawer-surface` | `menu-surface` | `not-before-next-major-or-explicit-migration-window` |
| Slot | `utility` | `actions` | `not-before-next-major-or-explicit-migration-window` |
| Density | `spacious` | `comfortable` | `normalized-at-runtime` |

## Migration Notes

| ID | Owner | Aktion | Risiko |
|----|-------|--------|--------|
| `adopt-token-alias-layer` | Design System | Corporate Tokens zuerst auf `--xtend-*` Aliases mappen, bevor Component Internals ueberschrieben werden. | Legacy Token Overrides koennen von XTheme und Forced Colors abdriften. |
| `replace-glyph-controls-with-icons` | Component Authors | `x-icon`, Inline-SVG oder registrierte Icon Packs fuer Close, Menu, Disclosure und Status Controls verwenden. | Textglyph Controls sind in enterprise-ready Komponenten nicht mehr akzeptiert. |
| `choose-xheader-menu-mode` | App Shell | Default `drawer` behalten oder explizit `side-panel`, `popover`, `fullscreen` oder `inline-main` waehlen. | Custom CSS, das einen fest verdrahteten Full-Width Drawer annimmt, muss auf Tokens und Parts wechseln. |
| `map-overlay-form-nav-parts` | Component Authors | `surface`, `backdrop`, `close`, `content`, `control`, `label`, `icon` und `nav` Parts zum Skinning verwenden. | Shadow-DOM Deep Selectors bleiben unsupported und koennen bei Updates brechen. |
| `run-visual-dom-matrix` | Quality | WP-10 DOM Snapshot Matrix fuer Header-Modi, Themes, Densities, Motion und Typografie laufen lassen. | Corporate Themes koennen statische Token Checks bestehen und trotzdem Kontrast, Fokus oder Layout verlieren. |
| `publish-third-party-guide` | Docs | WP-11 Authoring Guide als Standard-Onboarding fuer externe Designsysteme nutzen. | Teams koennen sonst Komponenten forken, statt XTheme, XTend.css, Parts, Slots und Icon Packs zu nutzen. |
| `keep-release-owner-boundary` | Release Owner | Publishing blockiert halten, bis Owner Review Gates, Migration Notes und optionale Artefakte akzeptiert. | Dieses Handoff macht die Welle release-ready, nicht automatisch published. |

## Release Checklist

- `package-private`
- `all-ech-gates-green`
- `semver-classification-recorded`
- `deprecated-aliases-documented`
- `migration-notes-complete`
- `third-party-authoring-guide-linked`
- `visual-dom-matrix-clean`
- `references-clean`
- `release-owner-review-required`
- `conditional-network-evidence-if-publish`

## Adoption Risiken

| ID | Severity | Mitigation |
|----|----------|------------|
| `shadow-dom-deep-selector-risk` | medium | CSS Parts und Custom Properties statt privater Shadow DOM Selectors nutzen. |
| `legacy-token-drift-risk` | medium | Legacy Tokens auf normalisierte Aliases mappen und XTheme sowie XTend.css synchron halten. |
| `forced-colors-brand-risk` | high | Forced-Colors-Pfade mit `Canvas`, `CanvasText`, `Highlight` und `HighlightText` betreiben. |
| `visual-signature-generic-risk` | medium | Signature UI und Visual DOM Matrix Gates laufen lassen, wenn Corporate Palettes angewendet werden. |
| `publish-boundary-risk` | high | Private Package Boundary bis zur Release Owner Acceptance halten. |

## Gate Matrix

Source Gates:

```bash
node scripts/run_xtend_tests.js signature-ui-visual-quality --json
node scripts/run_xtend_tests.js enterprise-component-flex-hardening-contract --json
node scripts/run_xtend_tests.js enterprise-component-style-audit --json
node scripts/run_xtend_tests.js xtheme-token-alias-layer --json
node scripts/run_xtend_tests.js enterprise-icon-control-audit --json
node scripts/run_xtend_tests.js xheader-menu-modes --json
node scripts/run_xtend_tests.js enterprise-overlay-mode-token-parity --json
node scripts/run_xtend_tests.js enterprise-layout-display-media-tokenization --json
node scripts/run_xtend_tests.js enterprise-form-control-theme-a11y --json
node scripts/run_xtend_tests.js enterprise-navigation-routing-state-hardening --json
node scripts/run_xtend_tests.js enterprise-visual-dom-snapshot-matrix --json
node scripts/run_xtend_tests.js enterprise-third-party-authoring-guide --json
```

Release Handoff Gates:

```bash
node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js design-tokens --json
```

## Handoff Entscheidung

Decision: `enterprise-design-system-ready-release-owner-review`

Naechster Schritt ist kein weiteres Workpackage in diesem Backlogpaket, sondern Release Owner Review. Der Publish Boundary `private-until-release-owner-acceptance` bleibt aktiv, bis die Checkliste angenommen wurde und optionale Netzwerk-Artefakte fuer einen echten Publish bereitstehen.
