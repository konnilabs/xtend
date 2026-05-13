# WP-TypeExports-02 - XTendLoader, StyleRegistry und SkeletonLoader typisieren

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.type-exports.loader-declarations.v1`
- Report: `xtend.type-exports.loader-declarations-report.v1`
- Gate: `node scripts/run_xtend_tests.js type-exports-loader --json`
- Package Script: `npm run test:type-exports-loader`
- Report Artifact: `.xtend-test-results/xtend-type-exports-loader-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `xtend.css-optional-theme-artifact`

## Ziel

`xtend-loader.d.ts` beschreibt die offizielle Loader-Oberflaeche fuer App-Shells, Skeleton Loading, StyleRegistry und dynamische Hydration. `xtend-dev.d.ts` bleibt eine Legacy-Fassade und re-exportiert die Loader-Typen, weil `xtend-dev.js` nur den kanonischen Loader importiert.

## Artefakte

| Artefakt | Zweck |
| --- | --- |
| `xtend-loader.d.ts` | Public Type Contract fuer `window.XTendLoader`, `window.XTendStyleRegistry`, `window.XTendSkeletonLoader`, Events und Boot-Promise |
| `xtend-dev.d.ts` | Legacy-Type-Fassade fuer `./legacy-loader` |
| `catalog/type-exports-loader.js` | Drift-Plan fuer Loader Runtime und Declaration |
| `tests/types/loader_type_exports_suite.js` | lokaler Gate fuer Loader-Type-Drift |
| `docs/xtend-loader-types.md` | Loader-Type-Dokumentation |

## Umsetzung

- `package.json#exports["."]`, `./loader` und `./legacy-loader` erhalten `types`-Conditions.
- `browser` und `default` zeigen weiter auf dieselben JS-Dateien.
- `xtend-loader.js` bleibt unveraendert im Bootpfad und importiert keine Declaration-Datei.
- `xtend.css` bleibt optionales Theme-Artefakt und ist keine Type-Abhaengigkeit. Kurz: xtend.css bleibt optionales Theme-Artefakt.

## Definition of Done

- Loader-Consumer koennen Skeleton-/Hydration-/StyleRegistry-APIs typisiert nutzen.
- Runtime-Methoden und Declaration-Tokens werden lokal gegeneinander geprueft.
- Package Type Conditions sind fuer Root, Loader und Legacy Loader gesetzt.
- Naechster startbarer Run ist `WP-TypeExports-03`.
