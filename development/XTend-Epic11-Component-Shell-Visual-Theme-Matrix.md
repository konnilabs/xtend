# XTend Epic 11 Component Shell Visual Theme Matrix

Schema: `xtend.epic11.component-shell-theme-matrix.v1`

Status: `accepted-theme-matrix`

Workpackage: `WP-E11-15`, fortgeschrieben durch `WP-E12-03`

## Ziel

`WP-E11-15` fuehrt die browsernahen UX-Journeys aus `WP-E11-14` in einen stabilen Visual-, Theme-, Motion-, Density- und Viewport-Vertrag. Das Paket ist noch kein Screenshot-Diff-Runner. Es schafft die lokale, self-checking Baseline, an die spaeter echte Snapshot-Automation oder visuelle CI-Artefakte angeschlossen werden koennen.

Die Matrix bleibt framework-agnostisch und lokal-only. RMT und XTendRMT werden nicht in XTend eingebettet; die Component Shells werden lediglich als renderbare UI-Oberflaechen betrachtet, die ueber RMT, Fabric, Loader und Browser-Harness konsistent pruefbar sein muessen.

## Artefakte

| Artefakt | Pfad |
| --- | --- |
| Maschinenlesbarer Plan | `tests/browser/component-shell-theme-matrix-plan.js` |
| Self-checking Fixture | `tests/browser/fixtures/epic11-theme-matrix-smoke.html` |
| Lokale Suite | `tests/browser/component_shell_theme_matrix_suite.js` |
| Browser-Harness | `tests/browser/browser_smoke_suite.js` |
| Package Script | `npm run test:component-shell-theme-matrix` |
| Lokaler Gate | `node scripts/run_xtend_tests.js component-shell-theme-matrix --json` |

## Matrix-Dimensionen

| Dimension | Werte |
| --- | --- |
| Theme | `light`, `dark`, `high-contrast`, `forced-colors` |
| Motion | `default-motion`, `reduced-motion` |
| Density | `comfortable`, `compact`, `dense` |
| Viewport | `desktop-1280`, `tablet-768`, `mobile-390` |
| UX-Familien | `form-controls`, `feedback-status`, `navigation-routing`, `overlay-interaction`, `layout-display-media` |

Damit entstehen `360` pruefbare Shell-Kombinationen:

```text
5 UX-Familien * 4 Themes * 2 Motion-Modi * 3 Densities * 3 Viewports = 360
```

## Familien und Visual States

| Familie | Komponenten | Visual States |
| --- | --- | --- |
| `form-controls` | `x-form`, `x-input`, `x-select`, `x-checkbox` | `default`, `focus`, `invalid`, `disabled` |
| `feedback-status` | `x-alert`, `x-toast`, `x-status`, `x-progress` | `info`, `success`, `warning`, `error`, `progress` |
| `navigation-routing` | `x-router`, `x-link`, `x-tabs` | `initial-route`, `active-route`, `route-announced`, `tab-selected`, `tab-focus-visible` |
| `overlay-interaction` | `x-modal`, `x-drawer` | `closed`, `open`, `focus-trapped`, `reduced-motion-open` |
| `layout-display-media` | `x-section`, `x-cards`, `x-code`, `x-player` | `default-layout`, `narrow-layout`, `lazy-media-shell` |

## Quellen

Die Matrix leitet ihre produktiven UX-Journeys aus `xtend.epic11.component-ux-browser-smokes.v1` ab. Die Regression-Prioritaeten bleiben mit `xtend.catalog.component-regression-priority-plan.v1` verbunden, damit die neue Epic-11-Matrix nicht an der bestehenden ER-WP-35-Linie vorbei entsteht.

Wichtige Boundary:

```text
no-rmt-kernel-import-of-xtend-types
```

Das bedeutet: Die Matrix darf XTend-Komponenten testen und aus RMT heraus orchestrierbare Shell-Anforderungen beschreiben. Sie darf aber keine XTend-Typen in den RMT-Kernel ziehen.

## Fixture-Vertrag

Die Fixture `tests/browser/fixtures/epic11-theme-matrix-smoke.html` prueft lokal:

- Loader und Manifest bleiben lokal, ohne CDN und ohne Importmap.
- Light, Dark, High Contrast und Forced Colors sind als Token-Zustaende sichtbar.
- Reduced Motion ist als eigener Motion-Vertrag sichtbar.
- Comfortable, Compact und Dense Density sind pruefbar.
- Desktop, Tablet und Mobile Viewports sind als Matrix-Vertrag sichtbar.
- Alle fuenf UX-Familien liefern Shell-States und Visual-State-Marker.
- Seit `WP-E12-03` enthaelt die Navigation/Routing-Familie zusaetzlich `x-tabs` mit `tab-selected`, `tab-focus-visible`, ARIA-Panel-Verknuepfung und Keyboard-State-Checks.

Der Browser-Harness registriert die Fixture unter dem Result-Key:

```text
__xtendEpic11ThemeMatrixResult
```

## Akzeptanz

`WP-E11-15` gilt als abgeschlossen, wenn:

- `tests/browser/component-shell-theme-matrix-plan.js` einen validen Plan erzeugt.
- `tests/browser/fixtures/epic11-theme-matrix-smoke.html` lokal-only bleibt.
- `tests/browser/browser_smoke_suite.js` die Fixture als browsernahe Shell-Pruefung kennt.
- `package.json`, `xtend-builder/scaffold.config.js`, `tests/README.md` und `tests/browser/README.md` den Gate referenzieren.
- Epic und Backlog `WP-E11-15` als `completed` markieren und den Handoff an die inzwischen abgeschlossene `WP-E11-16` Docs-Linie sichtbar halten.

## Handoff

`WP-E11-16` kann nun Docs und Authoring Guides fuer Component UX aktualisieren. Die Guides sollten die Matrix als sichtbaren UX-Reifevertrag erklaeren und spaeter auf echte Screenshot-Snapshot-Automation vorbereiten.
