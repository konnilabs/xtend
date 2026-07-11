# ER-WP-31 - Component Catalog Coverage Matrix erzeugen

- Status: `completed`
- Datum: 6. Mai 2026
- Contract: `xtend.enterprise.er-wp-31.component-catalog-coverage.v1`
- Coverage Matrix: `xtend.catalog.component-coverage-matrix.v1`
- Entry Contract: `xtend.catalog.component-coverage-entry.v1`
- Gate Contract: `xtend.catalog.component-coverage-gate.v1`
- Roadmap: `development/ROADMAP-XTend-Enterprise-Reife.md`

## Ziel

ER-WP-31 macht den XTend Component Catalog entlang der Enterprise-Reife-Dimensionen sichtbar. Jede Manifest-Komponente erhaelt einen aktuellen Status, ein Profil, eine Prioritaet, Coverage-Flags und einen konkreten Folgepfad.

Damit ist der bisher diffuse Blind Spot "Component Catalog Breitenhaertung" in eine gatebare Matrix uebersetzt.

## Scope

- Manifest-Komponenten aus `components/manifest.json` auswerten
- Source-, Docs-, Component-Suite-, Fixture-, Types-, A11y- und Performance-Coverage ableiten
- Reifestatus pro Komponente klassifizieren
- Luecken als Warnungen ausgeben, nicht als Source-Blocker
- Handoff an `ER-WP-32`, `ER-WP-33`, `ER-WP-34` und `ER-WP-35` dokumentieren

## Umgesetzte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `catalog/component-catalog-coverage.js` | maschinenlesbarer Report, Validator, Gate und Markdown-Matrix |
| `tests/catalog/component_catalog_coverage_suite.js` | lokaler Gate fuer Matrix, Statusmodell, Package-Metadaten und Docs |
| `development/XTend-Component-Catalog-Coverage-Matrix.md` | akzeptierte Coverage Matrix und Handoff |
| `development/docs-evidence/root/component-catalog-coverage.md` | Entwicklerdokumentation fuer Matrix und Gate |
| `package.json` | Export `./catalog/component-catalog-coverage`, Script `npm run test:catalog-coverage`, Package-Metadaten |
| `scripts/run_xtend_tests.js` | Suite-ID `catalog-coverage` |

## Ergebnis

Aktueller Snapshot:

| Dimension | Covered | Missing |
|-----------|---------|---------|
| `source` | 28 | 0 |
| `docs` | 26 | 2 |
| `componentSuite` | 3 | 25 |
| `fixture` | 3 | 25 |
| `types` | 1 | 27 |
| `a11y` | 24 | 4 |
| `performance` | 0 | 28 |

Statusverteilung:

| Status | Anzahl |
|--------|--------|
| `documented` | 23 |
| `contract-gated` | 3 |
| `source-only` | 2 |

Die drei aktuell `contract-gated` Komponenten sind `x-alert`, `x-toast` und `x-modal`. `x-router` ist wegen vorhandener Docs und Typings sichtbar, aber ohne Component-Suite/Fixture noch `documented`. `x-summary` und `x-utils` sind Source-only und werden bewusst an `ER-WP-32` uebergeben.

Fortschreibung nach `ER-WP-32`: `x-summary` und `x-utils` sind dokumentiert und werden in der Matrix als `documented` gefuehrt. Die Docs-Dimension steht damit bei `28/28`.

## Validierung

```bash
npm run test:catalog-coverage
node scripts/run_xtend_tests.js references
npm test
```

## Handoff

| Paket | Status nach ER-WP-31 | Aufgabe |
|-------|----------------------|---------|
| `ER-WP-32` | `next` | Docs-/Naming-Konventionen im Catalog bereinigen |
| `ER-WP-33` | `ready-after-naming` | priorisierte Component-Level-Suites, Fixtures, A11y- und Performance-Profile nachziehen |
| `ER-WP-34` | `blocked` | Public Types und Event Contracts nach Component-Suite-Basis vervollstaendigen |
| `ER-WP-35` | `planned` | visuelle und browsernahe Regression auf Matrix-Prioritaeten mappen |

## Abschlussnotiz

`ER-WP-31` ist abgeschlossen. Die Matrix ist jetzt der Source-of-Truth fuer die naechste Catalog-Reifephase und verhindert, dass neue Komponenten ohne sichtbaren Docs-/Test-/Types-/A11y-/Performance-Status in den Produktkatalog rutschen.
