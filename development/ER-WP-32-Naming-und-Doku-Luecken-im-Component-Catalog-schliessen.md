# ER-WP-32 - Naming- und Doku-Luecken im Component Catalog schliessen

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-32.catalog-naming-docs.v1`
- Naming Contract: `xtend.catalog.naming-convention.v1`
- Coverage Matrix: `xtend.catalog.component-coverage-matrix.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`

## Ziel

ER-WP-32 schliesst die aus `ER-WP-31` sichtbaren Docs-/Naming-Luecken im Component Catalog. `x-summary` und `x-utils` waren nach der Matrix zwar als lokale Manifest-Sources vorhanden, aber nicht dokumentiert. Gleichzeitig brauchte der Catalog eine stabile Regel, wie Manifest-Key, Custom-Element-Tag, Source-Basename, Component-Doku und Docs-Menu-Slug zusammenhaengen.

## Scope

- Naming-Konvention fuer Manifest-Key, Runtime-Tag, Source-Datei, Docs-Datei und Menu-Slug festlegen
- Ausnahmefaelle fuer `xstate`, `x-theme` und `x-utils` dokumentieren; nicht kanonische Theme-Utility-Pfade werden vor dem ersten oeffentlichen Release nicht als Legacy-Pfad weitergefuehrt
- Component-Doku fuer `x-summary` und `x-utils` ergaenzen
- Docs-Menue und Docs-Uebersicht auf neue Component-Seiten erweitern
- Component Catalog Coverage Matrix und Tests von `26/28` auf `28/28` Docs aktualisieren

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `development/XTend-Component-Catalog-Naming-Konvention.md` | akzeptierte Catalog-Naming-Konvention unter `xtend.catalog.naming-convention.v1` |
| `docs/components/xsummary.md` | Component-Doku fuer `<x-summary>`, State-Key, Events und A11y |
| `docs/components/xutils.md` | Utility-Doku fuer `x-utils`, `window.XUtils` und Nicht-Custom-Element-Contract |
| `docs/menu.json` | neue Slugs `components-xsummary` und `components-xutils` |
| `docs/en/README.md` | Component-Uebersicht mit `x-summary` und `x-utils` |
| `docs/components.md` | allgemeine Component-Doku mit ER-WP-32 Naming-Regel |
| `development/XTend-Component-Catalog-Coverage-Matrix.md` | aktualisierter Snapshot mit `28/28` Docs-Coverage |
| `development/docs-evidence/root/component-catalog-coverage.md` | Entwicklerdoku fuer die geschlossene Docs-Dimension |
| `tests/catalog/component_catalog_coverage_suite.js` | Gate-Erwartungen fuer dokumentierte `x-summary`/`x-utils` |
| `tests/references/reference_path_suite.js` | Referenz-Gate fuer Naming-Doc, neue Docs und aktualisierten Handoff |

## Ergebnis

Aktueller Snapshot nach ER-WP-32:

| Dimension | Covered | Missing |
|-----------|---------|---------|
| `source` | 28 | 0 |
| `docs` | 28 | 0 |
| `componentSuite` | 3 | 25 |
| `fixture` | 3 | 25 |
| `types` | 1 | 27 |
| `a11y` | 24 | 4 |
| `performance` | 0 | 28 |

Statusverteilung:

| Status | Anzahl |
|--------|--------|
| `documented` | 25 |
| `contract-gated` | 3 |

`x-summary` und `x-utils` sind nun `documented` und routen in der Matrix auf `ER-WP-33`, weil als naechstes Component-Level-Suites, Fixtures und Profilhaertung folgen.

## Naming-Entscheidung

| Ebene | Regel | Beispiel |
|-------|-------|----------|
| Manifest-Key | kanonischer Runtime- und Catalog-Name | `x-summary` |
| Custom Element Tag | identisch zum Manifest-Key, wenn das Modul ein Custom Element registriert | `customElements.define("x-summary", XSummary)` |
| Source-Basename | historisch kompakter Modulname ohne Bindestrich | `xsummary.js` |
| Component-Doku | Source-Basename plus `.md` | `docs/components/xsummary.md` |
| Docs-Menu-Slug | `components-` plus Source-Basename | `components-xsummary` |
| Anzeige-Label | lesbare Produktform | `X-Summary` |

## Validierung

```bash
node --check tests/catalog/component_catalog_coverage_suite.js
node --check tests/references/reference_path_suite.js
node scripts/run_xtend_tests.js catalog-coverage
node scripts/run_xtend_tests.js references
npm test
```

## Handoff

| Paket | Status nach ER-WP-32 | Aufgabe |
|-------|----------------------|---------|
| `ER-WP-33` | `next` | Component-Level-Suites, Fixtures, A11y- und Performance-Profile fuer priorisierte Komponenten nachziehen |
| `ER-WP-34` | `blocked` | Public Types und Event Contracts nach Component-Suite-Basis vervollstaendigen |
| `ER-WP-35` | `planned` | visuelle und browsernahe Regression auf Matrix-Prioritaeten mappen |

## Abschlussnotiz

`ER-WP-32` ist abgeschlossen. Die Catalog-Dokumentation ist fuer alle Manifest-Komponenten vollstaendig sichtbar, und die verbleibende Catalog-Arbeit liegt nicht mehr in Namensdrift, sondern in echten Component-Level-Gates.
