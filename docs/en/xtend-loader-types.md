# XTend Loader Types

XTend Loader Types document the public TypeScript surface for the local loader, the style registry and the skeleton loader. This page is for teams that embed `xtend-loader.js` in a host and need editor support, stable global APIs and verifiable event names. The declarations intentionally sit next to the JavaScript runtime: browsers do not load type files, while package consumers still receive complete IntelliSense and compiler feedback.

## Public Declarations

The central files are `./xtend-loader.d.ts` and `./xtend-dev.d.ts`. `xtend-loader.d.ts` describes `XTendLoaderApi`, `XTendStyleRegistryApi` and `XTendSkeletonLoaderApi`. `xtend-dev.d.ts` remains as a compatibility bridge and re-exports the same loader types so older integrations do not need a migration. The package exports `.`, `./loader` and `./legacy-loader` therefore point at the appropriate `types` conditions without changing the runtime path.

The types cover methods such as `ensureComponent`, `hydrateTree`, `ensureRuntimeStyles`, `defineComponentStyle`, `adoptStyle`, `showSkeleton` and `hideSkeleton`. That matters for host code because the loader often initializes before the application. If a host preloads a component or hydrates a Shadow Root, the declarations show which arguments are supported and what result shape to expect.

## Events And Globals

The loader declarations extend `WindowEventMap` with `xtend-loader-diagnostic`, `xtend-loader-performance` and `xtend-loader-tree-hydrated`. These events are part of the diagnostics surface and may be consumed by monitoring, tests or local debug panels. The declarations also describe the global names `XTendLoader`, `XTendStyleRegistry`, `XTendSkeletonLoader` and `__XTendLoaderBootPromise`, so a host can use them without maintaining custom ambient declarations.

The style registry stays intentionally narrow. It describes runtime styles, component styles and adopted stylesheet support without turning `xtend.css` into a required file. The package can therefore be installed as a local runtime building block while themes remain optional. The relevant contract is that `xtend.css bleibt optional` for hosts, and `standardFileName: 'xtend.css'` is the known theme filename, not a hard runtime import.

## Local Verification

The loader type check compares runtime methods, global names, event names and package metadata with the declarations. Run it whenever you change `xtend-loader.js`, `xtend-loader.d.ts`, `xtend-dev.d.ts`, package exports or release metadata.

```bash
node scripts/run_xtend_tests.js type-exports-loader --json
```

```txt
schema: xtend.type-exports.loader-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-loader --json
report: .xtend-test-results/xtend-type-exports-loader-report.json
```

## Maintenance Notes

Change the runtime or declaration first, then package metadata, then documentation. The check remains green when all three layers know the same names. If a method is removed, the host contract needs a deliberate review. If a method is added, it needs a type, a test expectation and a short documentation note. This keeps the loader, style registry and skeleton loader stable for third-party developers without requiring the internals to move to TypeScript.
