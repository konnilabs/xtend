# ER-WP-35 - Visuelle und browsernahe Regression priorisieren

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.catalog.component-regression-priority-plan.v1`
- Gate Contract: `xtend.catalog.component-regression-priority-gate.v1`
- Coverage Matrix: `xtend.catalog.component-coverage-matrix.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`

## Ziel

ER-WP-35 schneidet die offenen Catalog-Risiken nach ER-WP-34 in einen priorisierten Regression-Plan. Die Komponentenseite hat jetzt Source, Docs, P0/P1-Suites, Fixtures und Public Types; offen bleiben sichtbare Regression, mobile Viewports, Theme-Varianten, Performance-Profile, A11y-Remediation und Long-Tail-Abdeckung.

## Scope

- maschinenlesbaren Visual-/Browser-Regression-Prioritaetsplan anlegen
- alle 28 Manifest-Komponenten in P0/P1/P2-Wellen einordnen
- pro Profil Browser-Smokes und visuelle Zustandsgruppen ableiten
- `desktop-1280`, `mobile-390`, `light`, `dark`, `forced-colors` und `reduced-motion` als Mindestvarianten festlegen
- Performance-Profile aus `xtend.performance.component-profile.v1` ableiten
- A11y- und Long-Tail-Restpunkte als Gate-Warnungen sichtbar halten
- Package-, Runner-, Docs-, Roadmap- und Reference-Pfade aktualisieren

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `catalog/component-regression-priority.js` | Plan- und Gate-Modul fuer ER-WP-35 |
| `tests/catalog/component_regression_priority_suite.js` | lokaler Gate fuer Planstruktur, P0/P1/P2-Wellen, Viewports, Theme-Varianten und Profilableitung |
| `development/XTend-Visuelle-und-Browsernahe-Regression-Prioritaetsplan.md` | akzeptierter Contract und Handoff an CI/Release |
| `docs/visual-browser-regression.md` | offizielle Entwicklerdokumentation |
| `package.json` | Export, Metadaten und `test:regression-priority` |
| `scripts/run_xtend_tests.js` | Runner-Suite `regression-priority` |
| `development/ROADMAP-XTend-Enterprise-Reife.md` | `ER-WP-35`, `ER-WP-36`, `ER-WP-37`, `ER-WP-38`, `ER-WP-39` und `ER-WP-40` abgeschlossen |

## Ergebnis

Aktueller Plan-Snapshot:

| Kennzahl | Wert |
|----------|------|
| Manifest-Komponenten | 28 |
| Mindest-Viewports | `desktop-1280`, `mobile-390` |
| Mindest-Theme-Varianten | `light`, `dark`, `forced-colors`, `reduced-motion` |
| Performance-Profil-Ableitung | 28/28 geplant |
| A11y-Remediation | 4 Komponenten |
| Long-Tail-Suite/Fixture-Remediation | 10 Komponenten |

Die erste Umsetzungswelle fokussiert P0 browserkritische Komponenten: Routing, Links, Forms, Kalender, Writer und Overlays. Die zweite Welle nimmt Feedback, Theme, Media und interaktive Komponenten auf. Die dritte Welle haertet P2-Display-, Utility- und Infrastrukturkomponenten nach. Die vierte Welle ist der explizite Handoff fuer echte Visual Snapshot Automation.

## Validierung

```bash
node scripts/run_xtend_tests.js regression-priority
node scripts/run_xtend_tests.js catalog-coverage
node scripts/run_xtend_tests.js references
npm test
```

## Handoff

| Paket | Status nach ER-WP-36 | Aufgabe |
|-------|----------------------|---------|
| `ER-WP-36` | `completed` | CI Workflow fuer Default Gates und `regression-priority` produktisiert |
| `ER-WP-37` | `completed` | schnelle PR-Gates und volle Release-Gates trennen |
| `ER-WP-38` | `completed` | Release Checklist und SemVer Policy um Visual-/Browser-Regression erweitert |
| `ER-WP-39` | `completed` | Enterprise Adoption Guide mit Regression-Baselines und QS-Empfehlungen geschrieben |
| `ER-WP-40` | `completed` | Docs-App RMT Pilot nutzt Regression-Baselines als QS-Kontext |

## Abschlussnotiz

`ER-WP-35` ist abgeschlossen. XTend besitzt nun keinen losen Wunschzettel mehr fuer sichtbare Regression, sondern einen testbaren Plan-Contract, der Catalog-Coverage, Browser-Smokes, Performance Regression, A11y-Restpunkte und CI-Handoff miteinander verbindet.
