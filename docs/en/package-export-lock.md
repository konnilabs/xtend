# Package Export Lock

The Package Export Lock is the local check for XTend's published package surface. It connects `package.json#exports`, packed root files, TypeScript declarations and surface groups into one stable contract. Teams use this page when they add public modules, wire workspace packages into CI or verify that a package archive contains the same entry points as the documented API.

## Export Surface

The lock covers Loader, Components, Maraca, Fabric, XTendRMT, Builder, Docs, Security, Catalog, Design Tokens and RMT Tooling. New public exports must be added deliberately to the package export catalog, `package.json`, TypeExports, the changelog, README and this documentation. A single local run can then reveal missing package roots, forgotten declarations or accidental export keys.

Maraca is tracked as its own surface group and covers `./maraca`, `./maraca/runtime` and the `xtend-maraca` package root. TypeExports classifies these entries through `./xtend-maraca/index.d.ts` and `./xtend-maraca/runtime.d.ts`. The same principle applies to i18n: infrastructure modules are recognized in the manifest, but they are not treated as visual Custom Elements.

## Artifacts

The check works with machine-readable artifacts. The pack dry run JSON shows which files would enter an archive. The surface lock shows whether all expected exports, roots and declaration targets exist. The report summarizes the outcome for local development, CI and nightly builds. These signals are intentionally small enough to inspect in pull-request artifacts while still precise enough to catch release drift.

```txt
contract: xtend.epic13.package-export-lock.v1
report: xtend.epic13.package-export-lock-report.v1
surface: xtend.epic13.package-export-surface.v1
local gate: node scripts/run_xtend_tests.js epic13-package-export-lock --json
capture: npm run pack:dry-run:report
expectedExportCount: 128
```

```txt
declarations: ./xtend-loader.d.ts, ./xtend-dev.d.ts, ./api.d.ts
policy declarations: ./fabric/xtend-fabric.d.ts, ./fabric/xtend-policy-public-types.d.ts
builder declarations: ./xtend-builder/scaffold.d.ts, ./xtend-builder/builder-public-types.d.ts
catalog declarations: ./catalog/catalog-public-types.d.ts
vendor declarations: ./design-tokens/xtend-design-tokens.d.ts, ./design-tokens/xtheme-token-alias-layer.d.ts
loader gate: node scripts/run_xtend_tests.js type-exports-loader --json
api gate: node scripts/run_xtend_tests.js type-exports-api --json
policy gate: node scripts/run_xtend_tests.js type-exports-policy --json
builder gate: node scripts/run_xtend_tests.js type-exports-builder --json
catalog gate: node scripts/run_xtend_tests.js type-exports-catalog --json
vendor gate: node scripts/run_xtend_tests.js type-exports-vendor --json
```

## CI And Nightly

GitHub Actions run the static check through the normal release reports and collect workspace dry runs in the package structure job. Nightly builds the same artifacts again, adds the Maraca report and stores bundle plus size information. This lets the standard gates recognize new modules such as `xtend-i18n` and `xtend-maraca` without requiring a visual component registration.

The important operating mode is local first. Network-dependent evidence belongs in dedicated jobs, while Package Export Lock, TypeExports, i18n and Maraca remain runnable without downloads. If a job turns red, first determine whether an export is missing, a file is absent from the package root or a new TypeScript target has not reached classification.

## Local Maintenance

After adding public exports, run at least:

```bash
node scripts/run_xtend_tests.js type-exports epic13-package-export-lock maraca-package-exports --json
npm run pack:dry-run
```

The check is not a replacement for product tests, but it protects the package boundary. If a new module only exists in the source tree and not in the export lock, it is not treated as published surface. If an export appears in the lock, it must be maintained with declaration, documentation and package root together.
