# XTend Loader Types

- Contract: `xtend.type-exports.loader-declarations.v1`
- Workpackage: `WP-TypeExports-02`
- Gate: `node scripts/run_xtend_tests.js type-exports-loader --json`
- Report: `.xtend-test-results/xtend-type-exports-loader-report.json`
- Declarations: `xtend-loader.d.ts`, `xtend-dev.d.ts`

## Zweck

`xtend-loader.d.ts` beschreibt die offizielle Loader-Oberflaeche fuer App-Shells, dynamische Hydration und framework-native Skeleton-/Style-Hilfen. Die Runtime bleibt `xtend-loader.js`; die Declaration fuegt keine neue Runtime-Abhaengigkeit ein.

## Globale APIs

| Global | Typ |
| --- | --- |
| `window.XTendLoader` | `XTendLoaderApi` |
| `window.XTendStyleRegistry` | `XTendStyleRegistryApi` |
| `window.XTendSkeletonLoader` | `XTendSkeletonLoaderApi` |
| `window.__XTendLoaderBootPromise` | `Promise<XTendLoaderBootResult>` |

## Wichtige Methoden

| API | Methoden |
| --- | --- |
| `XTendLoaderApi` | `ensureComponent`, `hydrateTree`, `showSkeleton`, `hideSkeleton`, `ensureRuntimeStyles`, `defineComponentStyle`, `adoptStyle`, `initiateXTend` |
| `XTendStyleRegistryApi` | `ensureRuntimeStyles`, `ensureDocumentStyle`, `defineComponentStyle`, `adopt`, `adoptStyle`, `get`, `getThemeStylesheetState`, `list` |
| `XTendSkeletonLoaderApi` | `create`, `show`, `hide` |

## Events

`WindowEventMap` enthaelt typisierte Loader-Events:

- `xtend-loader-diagnostic` mit `XTendLoaderDiagnosticDetail`
- `xtend-loader-performance` mit `XTendLoaderPerformanceDetail`
- `xtend-loader-tree-hydrated` mit `XTendHydrateTreeDetail`

## Package Exports

Die Package-Exports `.`, `./loader` und `./legacy-loader` besitzen ab diesem Run `types`-Conditions:

| Export | Types |
| --- | --- |
| `.` | `./xtend-loader.d.ts` |
| `./loader` | `./xtend-loader.d.ts` |
| `./legacy-loader` | `./xtend-dev.d.ts` |

`xtend.css` bleibt optionales Theme-Artefakt. Kurz: xtend.css bleibt optional. Loader-Typen beschreiben `xtend.css` nur als optional erkannte Standard-Stylesheet-Datei und haengen nicht von einer externen CSS-Datei ab.

## Drift Gate

Der Gate `type-exports-loader` prueft:

- Declaration-Dateien existieren und sind im Package enthalten.
- Package `types`-Conditions zeigen auf die Loader-Declarations.
- Runtime-Methoden in `XTendLoader`, `XTendStyleRegistry` und `XTendSkeletonLoader` sind in den Declarations sichtbar.
- Loader Events sind in `WindowEventMap` typisiert.
- `xtend-loader.js` importiert keine `.d.ts` Datei und der Bootpfad bleibt unveraendert.
