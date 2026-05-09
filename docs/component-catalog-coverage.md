# Component Catalog Coverage

- Contract: `xtend.docs.component-catalog-coverage.v1`
- Matrix Contract: `xtend.catalog.component-coverage-matrix.v1`
- Gate Contract: `xtend.catalog.component-coverage-gate.v1`
- Workpackage: `ER-WP-31`, fortgeschrieben durch `ER-WP-32`, `ER-WP-33`, `ER-WP-34`, `ER-WP-35`, `WP-E11-12`, `WP-E11-17`, `WP-E12-02`, `WP-E12-03`, `WP-E12-04`, `WP-E12-05`, `WP-E12-06`, `WP-E12-07`, `WP-E12-08`, `WP-E12-09`, `WP-E13-12A`, `WP-SM-03` und `WP-SM-04`

Die Component Catalog Coverage Matrix zeigt, wie reif jede Komponente aus `components/manifest.json` gerade ist. Sie verbindet Source, Dokumentation, Component-Level-Suite, Fixture, Types, A11y und Performance zu einem Statusmodell.

## Lokal pruefen

```bash
npm run test:catalog-coverage
node scripts/run_xtend_tests.js catalog-coverage --json
```

Der Gate ist aktuell gruen, wenn alle Manifest-Sources lokal aufloesbar sind und der Matrix-Report strukturell valide ist. Fehlende Suites, Fixtures, Types, A11y- und Performance-Profile erscheinen als Warnungen. So kann der Catalog Schritt fuer Schritt gehaertet werden, ohne offene Folgepakete zu verstecken.

## Statusmodell

| Status | Bedeutung |
|--------|-----------|
| `enterprise-ready` | vollstaendige Source-, Docs-, Suite-, Fixture-, Types-, A11y- und Performance-Coverage |
| `typed-contract-gated` | Types und A11y sind vorhanden, Performance fehlt noch |
| `contract-gated` | Source, Docs, Component-Suite und Fixture sind vorhanden |
| `documented` | Source und Docs sind vorhanden |
| `source-only` | Source ist vorhanden, Docs oder Gates fehlen |
| `missing-source` | Manifest zeigt auf keine lokale Source; dieser Zustand blockiert |

## Aktueller Stand

Der Snapshot nach `WP-SM-04` zeigt:

- 41 Manifest-Komponenten
- 41 lokale Source-Dateien
- 41 Komponenten-Dokumente
- 41 Component-Level-Suites und Fixtures
- 41 Public-Type-Artefakte fuer priorisierte Komponenten
- 40 Komponenten mit erkennbarer A11y-Oberflaeche
- 39 Komponenten mit explizitem Performance-Profil

`x-input`, `x-select`, `x-checkbox`, `x-radio`, `x-textarea`, `x-form`, `x-calendar`, `x-writer`, `x-status`, `x-progress`, `x-tooltip`, `x-popover`, `x-drawer`, `x-surface-manager`, `x-surface-window`, `x-side-panel`, `x-modal`, `x-dialog`, `x-alert`, `x-toast`, `x-spinner`, `x-router`, `x-link`, `x-tabs`, `x-theme`, `x-button`, `x-icon`, `x-menu`, `x-footer`, `x-lightbox`, `x-masonry`, `x-code`, `x-header`, `x-hero`, `x-type`, `x-summary`, `x-section`, `x-cards` und `x-player` bilden die aktuelle `enterprise-ready` Linie: Source, Docs, Component-Suite, Fixture, Public Types, A11y und Performance-Profil sind vollstaendig vorhanden. `xstate` ist als nicht-visuelle Boundary-Probe `contract-gated`; `x-utils` ist als Utility-Boundary `typed-contract-gated` und braucht nur noch die Performance-Boundary-Entscheidung.

Seit `ER-WP-35` existiert zusaetzlich der Regression-Priority-Plan `xtend.catalog.component-regression-priority-plan.v1`. Er priorisiert alle 41 Komponenten fuer `desktop-1280`, `mobile-390`, `light`, `dark`, `forced-colors`, `reduced-motion`, Browser-Smokes und Performance-Profil-Ableitung; 39 Komponenten bringen ihre Performance-Profile bereits mit.

## Handoff

| Paket | Aufgabe |
|-------|---------|
| `ER-WP-32` | abgeschlossen: Docs- und Naming-Luecken schliessen |
| `ER-WP-33` | abgeschlossen: Component-Level-Suites und Fixtures fuer priorisierte Komponenten nachziehen |
| `ER-WP-34` | abgeschlossen: Public Types und Event Contracts fuer priorisierte Komponenten vervollstaendigen |
| `ER-WP-35` | abgeschlossen: Long-Tail-Suites, Performance-Profile sowie visuelle und browsernahe Regression priorisieren |
| `WP-E11-12` | abgeschlossen: Layout-, Display- und Media-Shell-Reife in Katalog, Types, Suites und Performance-Profilen nachziehen |

`WP-E11-17` fuehrt diese Matrix mit dem Regression-Priority-Plan in `xtend.epic11.legacy-long-tail-migration.v1` zusammen. Nach `WP-E12-09` sind `x-tabs`, `x-theme`, `x-button` und `x-menu` aus diesem Long-Tail geschlossen; `xstate` besitzt Suite, Fixture und Types und bleibt als Boundary-Probe fuer A11y-/Performance-Entscheidungen sichtbar. `x-utils` besitzt Utility Contract, Import Policy, Fixture und Public Types. Offen bleiben nur `xstate` als A11y-/Performance-Boundary-Probe und `x-utils` als Performance-Boundary-Entscheidung, gatebar ueber `node scripts/run_xtend_tests.js component-long-tail-migration --json`.

Die vollstaendige Matrix liegt in `development/XTend-Component-Catalog-Coverage-Matrix.md`. Die Naming-Konvention liegt in `development/XTend-Component-Catalog-Naming-Konvention.md`. Public Types sind in `docs/public-component-types.md` dokumentiert. Visual-/Browser-Regression ist in `docs/visual-browser-regression.md` dokumentiert. Das maschinenlesbare Coverage-Modul liegt in `catalog/component-catalog-coverage.js`; der Regression-Priority-Plan liegt in `catalog/component-regression-priority.js`; der Long-Tail-Migrationsplan liegt in `catalog/component-long-tail-migration.js`.
