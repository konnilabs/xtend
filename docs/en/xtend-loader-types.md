# XTend Loader Types

- Contract: `xtend.type-exports.loader-declarations.v1`
- Workpackage: `WP-TypeExports-02`
- Gate: `node scripts/run_xtend_tests.js type-exports-loader --json`
- Report: `.xtend-test-results/xtend-type-exports-loader-report.json`
- Declarations: `xtend-loader.d.ts`, `xtend-dev.d.ts`

## Purpose

`xtend-loader.d.ts` describes the official loader surface for app shells, dynamic hydration and framework-native skeleton/style helpers. The runtime remains `xtend-loader.js`; the declaration adds no new runtime dependency.

## Global APIs

| Global | Type |
| --- | --- |
| `window.XTendLoader` | `XTendLoaderApi` |
| `window.XTendStyleRegistry` | `XTendStyleRegistryApi` |
| `window.XTendSkeletonLoader` | `XTendSkeletonLoaderApi` |
| `window.__XTendLoaderBootPromise` | `Promise<XTendLoaderBootResult>` |

## Important Methods

| API | Methods |
| --- | --- |
| `XTendLoaderApi` | `ensureComponent`, `hydrateTree`, `showSkeleton`, `hideSkeleton`, `ensureRuntimeStyles`, `defineComponentStyle`, `adoptStyle`, `initiateXTend` |
| `XTendStyleRegistryApi` | `ensureRuntimeStyles`, `ensureDocumentStyle`, `defineComponentStyle`, `adopt`, `adoptStyle`, `get`, `getThemeStylesheetState`, `list` |
| `XTendSkeletonLoaderApi` | `create`, `show`, `hide` |

## Events

`WindowEventMap` contains typed loader events:

- `xtend-loader-diagnostic` with `XTendLoaderDiagnosticDetail`
- `xtend-loader-performance` with `XTendLoaderPerformanceDetail`
- `xtend-loader-tree-hydrated` with `XTendHydrateTreeDetail`

## Package Exports

As of this run, the package exports `.`, `./loader` and `./legacy-loader` have `types` conditions:

| Export | Types |
| --- | --- |
| `.` | `./xtend-loader.d.ts` |
| `./loader` | `./xtend-loader.d.ts` |
| `./legacy-loader` | `./xtend-dev.d.ts` |

`xtend.css` remains an optional theme artifact. In short: xtend.css remains optional. Loader types describe `xtend.css` only as an optionally recognized default stylesheet file and do not depend on an external CSS file.

## Drift Gate

The gate `type-exports-loader` checks:

- declaration files exist and are included in the package
- package `types` conditions point to the loader declarations
- runtime methods in `XTendLoader`, `XTendStyleRegistry` and `XTendSkeletonLoader` are visible in the declarations
- loader events are typed in `WindowEventMap`
- `xtend-loader.js` imports no `.d.ts` file and the boot path remains unchanged
