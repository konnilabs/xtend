# XTend Visuelle und Browsernahe Regression Prioritaetsplan

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.catalog.component-regression-priority-plan.v1`
- Entry Contract: `xtend.catalog.component-regression-priority-entry.v1`
- Gate Contract: `xtend.catalog.component-regression-priority-gate.v1`
- Workpackage: `ER-WP-35`
- Bezug:
  - `catalog/component-regression-priority.js`
  - `tests/catalog/component_regression_priority_suite.js`
  - `catalog/component-catalog-coverage.js`
  - `development/XTend-Component-Catalog-Coverage-Matrix.md`
  - `docs/visual-browser-regression.md`
  - `development/ROADMAP-XTend-Enterprise-Reife.md`

## Zweck

ER-WP-35 priorisiert sichtbare Regression, Browser-Smokes, mobile Viewports, Theme-Varianten, Performance-Profile und Long-Tail-Haertung fuer den Component Catalog.

Der Plan ist bewusst noch kein Screenshot-Runner. Er ist der maschinenlesbare Handoff zwischen Catalog-Coverage, bestehenden Browser-/A11y-/Performance-Gates und den spaeteren CI-/Release-Paketen. Damit ist klar, welche Oberflaechen zuerst in echte Browser- und Visual-Regression automatisiert werden muessen, ohne `npm test` heute von externer Browser-Automation abhaengig zu machen.

## Gate

```bash
node scripts/run_xtend_tests.js regression-priority
node scripts/run_xtend_tests.js regression-priority --json
npm run test:regression-priority
```

Der Gate prueft:

- 41 Manifest-Komponenten sind im Plan enthalten.
- jede Komponente hat `desktop-1280` und `mobile-390` als Mindest-Viewports.
- jede Komponente hat `light`, `dark`, `forced-colors` und `reduced-motion` als Theme-/Preference-Varianten.
- jede Komponente erhaelt ein abgeleitetes Performance-Profil nach `xtend.performance.component-profile.v1`.
- P0-Komponenten werden als `p0-browser-critical` klassifiziert.
- Custom Elements besitzen geplante visuelle Zustandsabdeckung.
- bekannte Restpunkte bleiben als Warnungen sichtbar: Performance-Profil-Authoring und A11y-Remediation. Suite-/Fixture-/Type-Gaps sind seit `WP-E12-09` geschlossen.

## Priorisierungswellen

| Wave | Label | Ziel |
|------|-------|------|
| `1` | P0 browser-critical regression baseline | Routing, Forms und Overlays zuerst browsernah und mobil absichern |
| `2` | P1 visual and performance baseline | Feedback, Interaction, Media, Theme und State-Signale als sichtbare Baseline erfassen |
| `3` | P2 long-tail suite and fixture completion | Display-, Utility- und Infrastruktur-Luecken mit Suites, Fixtures und Types nachziehen |
| `4` | visual snapshot automation handoff | Screenshot-/Pixel-Gates, Diff-Artefakte und CI-Upload spaeter produktisieren |

## Mindest-Varianten

| Dimension | Mindestwerte |
|-----------|--------------|
| Viewports | `desktop-1280`, `mobile-390` |
| Theme/Preferences | `light`, `dark`, `forced-colors`, `reduced-motion` |
| Browser-Gates | `browser`, `performance-regression`, `catalog-coverage`, `references` |
| Performance | `xtend.performance.component-profile.v1`, `xtend.performance.regression-gate.v1` |

## Profil-Mapping

| Profil | Browser-Smokes | Visuelle Zustaende |
|--------|----------------|--------------------|
| `routing` | `route-change`, `keyboard-navigation`, `history-state`, `rmt-route-adapter` | `initial-route`, `active-route`, `rmt-scheduled-route` |
| `form` | `input-sync`, `validation-feedback`, `keyboard-entry`, `form-associated-submit` | `default`, `focus`, `invalid`, `disabled` |
| `overlay` | `focus-trap`, `escape-close`, `scroll-lock`, `focus-restore` | `closed`, `open`, `focus-trapped`, `reduced-motion-open` |
| `feedback` | `live-region`, `dismiss-timer`, `reduced-motion` | `info`, `warning`, `error`, `dismissed` |
| `interactive` | `keyboard-activation`, `focus-visible`, `mobile-tap` | `default`, `hover`, `focus-visible`, `active`, `disabled` |
| `media` | `media-controls`, `poster-load`, `fullscreen-toggle` | `poster`, `playing`, `controls-focus` |
| `theme` | `theme-switch`, `token-contrast`, `forced-colors` | `light-theme`, `dark-theme`, `forced-colors` |
| `display` | `layout-stability`, `responsive-overflow` | `default-layout`, `narrow-layout` |
| `iconography` | `layout-stability`, `theme-token-color` | `default-layout`, `high-contrast-currentColor` |
| `utility` | `utility-integration-probe` | `helper-ready` |

## Aktueller Snapshot

Der Plan leitet sich aus dem Catalog nach `WP-E12-09` ab:

| Kennzahl | Wert |
|----------|------|
| Manifest-Komponenten | 38 |
| P0 browserkritisch | 17 Komponenten |
| P1 visuell/performancekritisch | mindestens 11 Komponenten |
| P2 Long-Tail | mindestens 8 Komponenten |
| Performance-Profil-Authoring offen | 2 Komponenten |
| A11y-Remediation offen | 1 Komponente |
| Long-Tail-Suite/Fixture offen | 0 Komponenten |

Besonders wichtige Startpunkte:

| Komponente | Prioritaet | Grund |
|------------|------------|-------|
| `x-router` | Wave 1 | Route-Wechsel, Keyboard-Navigation, RMT Route Adapter und Route Performance |
| `x-link` | Wave 1 | aktive Route, Enter/Space, mobile Tap und Router-Signale |
| `x-modal` | Wave 1 | Fokusfalle, Escape, Scroll Lock und Reduced Motion |
| `x-input` / `x-select` / `x-checkbox` / `x-radio` / `x-textarea` / `x-form` | Wave 1 | Eingabe, Auswahl, Validierung, Submit und mobile Keyboard-Flows |
| `x-tooltip` / `x-popover` / `x-drawer` | Wave 1 | Overlay-Hilfe, interaktive Popover, Shell-Navigation, Escape, Focus Return und Route-Signale |
| `x-status` / `x-progress` | Wave 2 | Live Regions, Scheduler-Feedback, Progress-Updates und Reduced Motion |
| `x-theme` | Wave 2 | Theme Switch, Token Contrast, Forced Colors und gehaertete Theme-Propagation |
| `x-icon` | Wave 4 | lokale Icon Packs, CurrentColor, Forced Colors und Docs-Shell-Ikonographie |
| `x-menu` | Wave 2 | Keyboard-Navigation, XRouter-Kompatibilitaet und gehaertetes Navigation-Budget |
| `x-writer` | Wave 1 | Form-/Stateful-Editor, Autosave, Export und A11y-Remediation |
| `x-utils` | Wave 3 | kein Custom Element, deshalb Integration-Probe statt Visual Snapshot |

## Nicht-Ziele

- kein neuer externer Browser-Runner in ER-WP-35
- keine Bilddateien oder Pixel-Diffs im Repository
- keine harte Performance-Coverage in `xtend.catalog.component-coverage-matrix.v1`
- keine Umklassifizierung zu `enterprise-ready`, solange Runtime-Performance-Profile in den Komponenten fehlen

## Handoff

| Folgepaket | Aufgabe |
|------------|---------|
| `ER-WP-36` | abgeschlossen: CI Workflow fuer Default Gates und `regression-priority` produktisiert |
| `ER-WP-37` | abgeschlossen: schnelle PR-Gates und volle Release-Gates mit Regression-Priority-Zuschnitt getrennt |
| `ER-WP-38` | abgeschlossen: Release Checklist und SemVer Policy um Visual-/Browser-Regression erweitert |
| `ER-WP-39` | Enterprise Adoption Guide mit Regression-Baselines und QS-Empfehlungen schreiben |

## Ergebnis

`ER-WP-35` ist abgeschlossen, sobald `catalog/component-regression-priority.js`, `tests/catalog/component_regression_priority_suite.js`, diese Spezifikation, die Entwicklerdokumentation und die Roadmap denselben Contract referenzieren. Die offene Catalog-Reife ist damit nicht geloest, aber als belastbarer, testbarer Ausfuehrungsplan fuer CI und Release Readiness geschnitten.
