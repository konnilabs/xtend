# XTend Component Catalog Coverage Matrix

- Status: Accepted
- Datum: 6. Mai 2026
- Contract: `xtend.catalog.component-coverage-matrix.v1`
- Entry Contract: `xtend.catalog.component-coverage-entry.v1`
- Gate Contract: `xtend.catalog.component-coverage-gate.v1`
- Workpackage: `ER-WP-31`
- Regression Priority Contract: `xtend.catalog.component-regression-priority-plan.v1`
- Bezug:
  - `components/manifest.json`
  - `catalog/component-catalog-coverage.js`
  - `tests/catalog/component_catalog_coverage_suite.js`
  - `docs/component-catalog-coverage.md`
  - `catalog/component-regression-priority.js`
  - `docs/visual-browser-regression.md`
  - `development/XTend-Component-Catalog-Naming-Konvention.md`
  - `development/ROADMAP-XTend-Enterprise-Reife.md`

## Zweck

Diese Matrix macht den Component Catalog nach Epic 05 und den Enterprise-Reife-Paketen maschinenlesbar sichtbar. Sie bewertet jede Manifest-Komponente entlang der Dimensionen `source`, `docs`, `componentSuite`, `fixture`, `types`, `a11y` und `performance`.

Wichtig: Die Matrix ist kein "alles muss sofort rot sein"-Gate. Fehlende Source-Dateien waeren blockierend. Fehlende Long-Tail-Suites, Fixtures, Types, A11y- und Performance-Profile sind aktuell bewusst Warnungen. Die Docs-/Naming-Luecke aus `ER-WP-31` ist mit `ER-WP-32` geschlossen; die priorisierten Component-Level-Suites aus `ER-WP-33` und die Public Types aus `ER-WP-34` sind umgesetzt. `ER-WP-35` hat die offenen Visual-/Browser-/Performance-Luecken in einen separaten Regression-Priority-Plan ueberfuehrt.

## Statusmodell

| Status | Bedeutung |
|--------|-----------|
| `enterprise-ready` | Source, Docs, Component-Suite, Fixture, Types, A11y und Performance sind vollstaendig vorhanden. |
| `typed-contract-gated` | Source, Docs, Component-Suite, Fixture, Types und A11y sind vorhanden; Performance-Profil fehlt noch. |
| `contract-gated` | Source, Docs, Component-Suite und Fixture sind vorhanden. |
| `documented` | Source und Docs sind vorhanden, aber Component-Level-Gates fehlen. |
| `source-only` | Source ist vorhanden, aber Docs oder Contract-Gates fehlen. |
| `missing-source` | Manifest zeigt auf keine lokale Source-Datei; dieser Zustand ist blockierend. |

## Aktueller Snapshot

| Dimension | Covered | Missing | Prozent |
|-----------|---------|---------|---------|
| `source` | 42 | 0 | 100 |
| `docs` | 42 | 0 | 100 |
| `componentSuite` | 42 | 0 | 100 |
| `fixture` | 42 | 0 | 100 |
| `types` | 42 | 0 | 100 |
| `a11y` | 41 | 1 | 98 |
| `performance` | 40 | 2 | 95 |

Statusverteilung:

| Status | Anzahl |
|--------|--------|
| `documented` | 0 |
| `contract-gated` | 1 |
| `typed-contract-gated` | 1 |
| `enterprise-ready` | 40 |

## Matrix

| Tag | Profile | Status | Prio | Docs | Suite | Fixture | Types | A11y | Performance | Next |
|-----|----------|--------|------|------|-------|---------|-------|------|-------------|------|
| `xstate` | `stateful, infrastructure` | `contract-gated` | `P1` | yes | yes | yes | yes | no | no | ER-WP-35: A11y-Profil und Browser-Regression priorisieren |
| `x-theme` | `theme, stateful` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-button` | `interactive` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-icon` | `display, iconography` | `enterprise-ready` | `P2` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-spinner` | `feedback, display` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-tabs` | `interactive, routing` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-menu` | `interactive` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-footer` | `display` | `enterprise-ready` | `P2` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-alert` | `feedback, stateful` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-toast` | `feedback` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-dialog` | `overlay` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-lightbox` | `overlay, media` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-masonry` | `display` | `enterprise-ready` | `P2` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-code` | `display` | `enterprise-ready` | `P2` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-header` | `display` | `enterprise-ready` | `P2` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-hero` | `display` | `enterprise-ready` | `P2` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-type` | `display` | `enterprise-ready` | `P2` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-input` | `form` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-select` | `form, interactive, stateful` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-checkbox` | `form, interactive` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-radio` | `form, interactive` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-rmt-lifecycle-demo-build` | `display, stateful` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-textarea` | `form, stateful` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-status` | `feedback, stateful` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-progress` | `feedback, stateful` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-tooltip` | `overlay, feedback` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-popover` | `overlay, interactive` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-drawer` | `overlay, routing` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-surface-manager` | `overlay, stateful` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-surface-window` | `overlay, interactive` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-side-panel` | `overlay, stateful, interactive` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-form` | `form, stateful` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-calendar` | `form, interactive` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-summary` | `display, stateful` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-section` | `display` | `enterprise-ready` | `P2` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-cards` | `display` | `enterprise-ready` | `P2` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-player` | `media, interactive` | `enterprise-ready` | `P1` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-writer` | `form, stateful` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-router` | `routing` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-link` | `routing, interactive` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |
| `x-utils` | `utility` | `typed-contract-gated` | `P2` | yes | yes | yes | yes | yes | no | ER-WP-35: Performance-Profil und Browser-Regression priorisieren |
| `x-modal` | `overlay` | `enterprise-ready` | `P0` | yes | yes | yes | yes | yes | yes | release-candidate: Coverage halten und CI-Gates produktisieren |

## Gate-Verhalten

Der lokale Gate ist:

```bash
npm run test:catalog-coverage
node scripts/run_xtend_tests.js catalog-coverage --json
```

Der Gate ist aktuell gruen, wenn alle Manifest-Quellen lokal aufloesbar sind und der Report valide ist. Die offenen Dimensionen werden als `warnings` ausgegeben, damit Folgepakete die Luecken gezielt abarbeiten koennen.

## Handoff

| Folgepaket | Aufgabe |
|------------|---------|
| `ER-WP-32` | abgeschlossen: Naming- und Docs-Luecken geschlossen, insbesondere `x-summary` und `x-utils`; Manifest-/Docs-Namenskonvention finalisiert. |
| `ER-WP-33` | abgeschlossen: Component-Level-Suites und Fixtures fuer P0/P1-Routing-, Form-, Overlay-, Feedback-, Interaction-, Theme- und Media-Komponenten nachgezogen. |
| `ER-WP-34` | abgeschlossen: Public Types und Event Contracts fuer priorisierte Komponenten vervollstaendigt. |
| `ER-WP-35` | abgeschlossen: Long-Tail-Suites, Performance-Profile sowie visuelle und browsernahe Regression aus der Matrix priorisiert. |
| `ER-WP-36` | abgeschlossen: CI Workflow fuer Default-Gates produktisiert. |
| `ER-WP-37` | abgeschlossen: Coverage-, Regression- und Performance-Gates in Fast-/Full-Gates geschnitten. |
| `WP-E11-12` | abgeschlossen: Layout-, Display- und Media-Komponenten mit Suites, Fixtures, Types, A11y- und Performance-Profilen auf `enterprise-ready` gehoben. |
| `WP-E12-09` | abgeschlossen: `x-utils` Utility Boundary, Import Policy, Suite, Fixture und Public Types nachgezogen. |

## Regression-Priority-Ergaenzung aus ER-WP-35

`catalog/component-regression-priority.js` erzeugt `xtend.catalog.component-regression-priority-plan.v1` aus dieser Matrix. Der Plan enthaelt alle 42 Komponenten, Mindest-Viewports `desktop-1280` und `mobile-390`, Theme-/Preference-Varianten `light`, `dark`, `forced-colors` und `reduced-motion`, profilabhaengige Browser-Smokes und abgeleitete Performance-Profile nach `xtend.performance.component-profile.v1`.

Der lokale Gate ist:

```bash
npm run test:regression-priority
node scripts/run_xtend_tests.js regression-priority --json
```

## Definition of Done fuer ER-WP-31/ER-WP-32/ER-WP-33/ER-WP-34/ER-WP-35

- `catalog/component-catalog-coverage.js` erzeugt einen strukturierten Report und Markdown-Matrix.
- `tests/catalog/component_catalog_coverage_suite.js` prueft Report, Statusmodell, Handoff, Package-Metadaten und Docs.
- `catalog/component-regression-priority.js` erzeugt den ER-WP-35 Visual-/Browser-Regression-Prioritaetsplan.
- `tests/catalog/component_regression_priority_suite.js` prueft Plan, Viewports, Theme-Varianten, P0/P1/P2-Wellen, Performance-Profil-Ableitung und bekannte Warnungen.
- `package.json` exportiert den Catalog-Coverage-Contract und bietet `npm run test:catalog-coverage`.
- `package.json` exportiert den Regression-Priority-Contract und bietet `npm run test:regression-priority`.
- `development/ROADMAP-XTend-Enterprise-Reife.md`, `development/XTend-Enterprise-Reife-Implementierungsplan.md`, Docs und Referenzregister zeigen `ER-WP-31`, `ER-WP-32`, `ER-WP-33`, `ER-WP-34` und `ER-WP-35` als abgeschlossen.
- `development/XTend-Component-Catalog-Naming-Konvention.md`, `docs/components/xsummary.md` und `docs/components/xutils.md` schliessen die frueheren Docs-/Naming-Luecken.
- `tests/components/component_suite.js`, die SurfaceManager-Suites und die RMT Lifecycle Build Suite decken 42 Component-Level-Suites ab; `componentSuite` und `fixture` liegen bei 42/42.
- `components/xtend-public-types.d.ts` und 42 priorisierte Komponenten-`.d.ts` Dateien typisieren Public Events, Detail Payloads, Attribute und Element-/Window-Mappings; `types` liegt bei 42/42.
- `x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-form`, `x-calendar`, `x-writer`, `x-status`, `x-progress`, `x-tooltip`, `x-popover`, `x-drawer`, `x-surface-manager`, `x-surface-window`, `x-modal`, `x-dialog`, `x-alert`, `x-toast`, `x-spinner`, `x-router`, `x-link`, `x-tabs`, `x-theme`, `x-footer`, `x-lightbox`, `x-masonry`, `x-code`, `x-header`, `x-hero`, `x-type`, `x-summary`, `x-section`, `x-cards` und `x-player` bilden nach `WP-SM-03` die aktuelle `enterprise-ready` Referenzlinie mit expliziten Performance-Profilen.
