# WP-E11-15 - Visual Regression und Theme Matrix fuer Component Shells aufbauen

Status: `completed`

Schema: `xtend.epic11.component-shell-theme-matrix.v1`

Lokaler Gate: `node scripts/run_xtend_tests.js component-shell-theme-matrix --json`

## Ziel

Dieses Paket schliesst die browsernahen UX-Smokes aus `WP-E11-14` an eine reproduzierbare Visual- und Theme-Matrix an. XTend-Komponenten werden damit nicht nur funktional, sondern auch ueber Shell-, Theme-, Motion-, Density- und Viewport-Vertraege pruefbar.

## Umgesetzte Artefakte

| Artefakt | Ergebnis |
| --- | --- |
| `tests/browser/component-shell-theme-matrix-plan.js` | maschinenlesbarer WP-E11-15 Plan mit Factory, Validator und Gate |
| `tests/browser/fixtures/epic11-theme-matrix-smoke.html` | self-checking Browser-Fixture fuer Theme, Motion, Density, Viewports und Visual States |
| `tests/browser/component_shell_theme_matrix_suite.js` | lokaler Gate fuer Plan, Fixture, Docs, Package, Scaffold und Runner |
| `tests/browser/browser_smoke_suite.js` | Browser-Harness registriert die Theme-Matrix-Fixture |
| `package.json` | Script, PR-Gate und XTend-Metadaten fuer `component-shell-theme-matrix` |
| `xtend-builder/scaffold.config.js` | Scaffold-Handoff und Gate-Metadaten fuer die Theme Matrix |
| `development/XTend-Epic11-Component-Shell-Visual-Theme-Matrix.md` | Contract-Dokument fuer den neuen Matrix-Vertrag |

## Matrix

| Dimension | Werte |
| --- | --- |
| Themes | `light`, `dark`, `high-contrast`, `forced-colors` |
| Motion | `default-motion`, `reduced-motion` |
| Density | `comfortable`, `compact`, `dense` |
| Viewports | `desktop-1280`, `tablet-768`, `mobile-390` |
| UX-Familien | `form-controls`, `feedback-status`, `navigation-routing`, `overlay-interaction`, `layout-display-media` |

Die Matrix deckt `360` Shell-Kombinationen ab und bleibt bewusst lokal-only. Sie bereitet echte Visual Snapshot Automation vor, erzwingt diese aber noch nicht.

## Akzeptanzkriterien

- [x] `xtend.epic11.component-shell-theme-matrix.v1` ist als stabiler Contract angelegt.
- [x] Der Plan leitet seine UX-Familien aus `xtend.epic11.component-ux-browser-smokes.v1` ab.
- [x] Der Plan referenziert `xtend.catalog.component-regression-priority-plan.v1`.
- [x] Light, Dark, High Contrast, Forced Colors, Reduced Motion, Density und Viewports sind gatebar.
- [x] Die Fixture nutzt den lokalen Loader `/xtend-loader.js` und das lokale Manifest.
- [x] Keine CDN- oder Importmap-Abhaengigkeit wird eingefuehrt.
- [x] Browser-Harness, Package Script, Scaffold Config und Referenzdokumente kennen den neuen Gate.
- [x] `WP-E11-16` ist als naechster Handoff fuer Docs und Authoring Guides markiert.

## Verifikation

```bash
node scripts/run_xtend_tests.js component-shell-theme-matrix --json
```

Zusaetzlich ist die Matrix Teil der PR-Gate-Kette:

```bash
npm run test:pr
```

## Handoff

`WP-E11-16` kann die Component-UX-Dokumentation und Authoring Guides nachziehen. Dabei sollte die neue Matrix als sichtbarer UX-Reifevertrag beschrieben werden, damit Autorinnen und Autoren wissen, welche Shell-, Theme-, Motion- und Density-Regeln neue Komponenten erfuellen muessen.
