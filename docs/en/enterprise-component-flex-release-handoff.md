# Enterprise Component Flex Release Handoff

- Contract: `xtend.enterprise.component-flex-release-handoff.v1`
- Workpackage: `ECH-WP-12`
- Status: `accepted-enterprise-design-system-ready-handoff`
- Target: `enterprise-design-system-ready-release-candidate`
- Current Version: `0.1.0-rc.1`
- Proposed Version: `0.1.0-enterprise-design-system-rc.1`
- Publish Boundary: `private-until-release-owner-acceptance`
- Local Gate: `node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json`
- Package Script: `npm run test:enterprise-component-flex-release-handoff`

## Purpose

This handoff closes the Enterprise Component flexibility and theme-hardening wave. It evaluates the SemVer impact of the new attributes, tokens, parts and docs surfaces, documents deprecated aliases, describes the migration for existing apps and names the remaining adoption risks before release-owner review.

The package is release-ready, but it is not published automatically. `package.json` has already been set to `private: false` for RC1 publish prep; publishing still requires the manual release-owner command and, if needed, conditional network evidence.

## SemVer Assessment

The hardening wave is classified as `minor-pre-1.0-additive-public-api-hardening`.

| Area | Classification | Default compatible | Migration required | Note |
|------|----------------|--------------------|--------------------|------|
| `x-header-menu-presentation-modes` | `minor-additive-public-api` | yes | no | `menu-mode`, placement, modality and sizing are additive; the default remains `drawer`. |
| `xtheme-token-alias-layer` | `minor-additive-token-api` | yes | no | Normalized `--xtend-*` aliases are added while legacy names remain bridged. |
| `icon-control-hardening` | `patch-compatible-a11y-hardening` | yes | no | Visible text glyphs were replaced by real icon controls without breaking host command intent. |
| `overlay-layout-form-navigation-parts` | `minor-additive-css-parts-and-tokens` | yes | no | New parts and component tokens extend skinning surfaces without removing documented defaults. |
| `visual-dom-snapshot-matrix` | `test-artifact-only` | yes | no | DOM baselines and Visual Quality Reports are local gates, not runtime-breaking changes. |
| `third-party-authoring-guide` | `docs-only-adoption-handoff` | yes | no | Corporate Design Authoring is documented as a supported override path. |

SemVer decision:

- Existing defaults remain compatible.
- New modes are additive features.
- Breaking changes: none.
- Public surface changes are intentional and documented: attributes, tokens, CSS parts, slots, XTheme bridges and docs gates.
- Proposed version: `0.1.0-enterprise-design-system-rc.1`.

## Deprecated Aliases

Deprecated aliases remain bridged for existing apps. Removal or renaming is only allowed in a future major or in an explicit migration window.

| Type | Deprecated | Replacement | Removal |
|------|------------|-------------|---------|
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

| ID | Owner | Action | Risk |
|----|-------|--------|------|
| `adopt-token-alias-layer` | Design System | Map corporate tokens to `--xtend-*` aliases before overriding component internals. | Legacy token overrides can drift away from XTheme and Forced Colors. |
| `replace-glyph-controls-with-icons` | Component Authors | Use `x-icon`, inline SVG or registered icon packs for close, menu, disclosure and status controls. | Text-glyph controls are no longer accepted in enterprise-ready components. |
| `choose-xheader-menu-mode` | App Shell | Keep the default `drawer` or explicitly choose `side-panel`, `popover`, `fullscreen` or `inline-main`. | Custom CSS that assumes a hard-wired full-width drawer must move to tokens and parts. |
| `map-overlay-form-nav-parts` | Component Authors | Use `surface`, `backdrop`, `close`, `content`, `control`, `label`, `icon` and `nav` parts for skinning. | Shadow DOM deep selectors remain unsupported and can break on updates. |
| `run-visual-dom-matrix` | Quality | Run the WP-10 DOM Snapshot Matrix for header modes, themes, densities, motion and typography. | Corporate themes can pass static token checks and still lose contrast, focus or layout. |
| `publish-third-party-guide` | Docs | Use the WP-11 Authoring Guide as the standard onboarding path for external design systems. | Teams may otherwise fork components instead of using XTheme, XTend.css, parts, slots and icon packs. |
| `keep-release-owner-boundary` | Release Owner | Keep publishing blocked until owner review gates, migration notes and optional artifacts are accepted. | This handoff makes the wave release-ready, not automatically published. |

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

## Adoption Risks

| ID | Severity | Mitigation |
|----|----------|------------|
| `shadow-dom-deep-selector-risk` | medium | Use CSS parts and custom properties instead of private Shadow DOM selectors. |
| `legacy-token-drift-risk` | medium | Map legacy tokens to normalized aliases and keep XTheme plus XTend.css synchronized. |
| `forced-colors-brand-risk` | high | Run forced-colors paths with `Canvas`, `CanvasText`, `Highlight` and `HighlightText`. |
| `visual-signature-generic-risk` | medium | Run Signature UI and Visual DOM Matrix gates when corporate palettes are applied. |
| `publish-boundary-risk` | high | Keep the private package boundary until release-owner acceptance. |

## Gate Matrix

Source gates:

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

Release handoff gates:

```bash
node scripts/run_xtend_tests.js enterprise-component-flex-release-handoff --json
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js design-tokens --json
```

## Handoff Decision

Decision: `enterprise-design-system-ready-release-owner-review`

The next step is not another workpackage in this backlog package, but release-owner review. The publish boundary `private-until-release-owner-acceptance` remains active until the checklist has been accepted and optional network artifacts for a real publish are available.
