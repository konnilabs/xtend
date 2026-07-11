# XTend Catalog Types

XTend Catalog Types describe the public plan and report shapes for catalog modules. These types are small but important: many XTend checks create structured plans, validate them and write reports from them. `./catalog/catalog-public-types.d.ts` gives those recurring shapes common names so tests, builders and external analysis tools can speak the same language.

## Catalog Surface

The key names are `XtendCatalogPlan`, `XtendCatalogReport` and `XtendCatalogFactory`. They describe how a catalog module exposes its stable schema name, status, local checks and report data. SurfaceManager-Catalogs remain internal XTend UI support, but the data shapes of plan and report modules are public enough to be read by tests and release tooling.

A host does not need to import these types to use XTend UI. They are mainly useful for tooling, quality checks and integrations that evaluate several catalog modules side by side. When a new catalog module appears, it can reuse the same shape instead of inventing another report structure.

## Stability Rule

Catalog types should be broad enough to cover repeated plan and report patterns, but not so broad that they describe every internal file. Public names belong in `./catalog/catalog-public-types.d.ts`; concrete module details stay in the individual catalog files. That lets reports stay machine-readable while specialized plans can still own their particular fields.

This separation is useful for CI and nightly jobs. A runner can check whether a report succeeded, which schema it uses and which artifact was written without understanding the business logic of each catalog.

## Local Verification

Run the catalog type check whenever plan or report modules, catalog declarations or package metadata change.

```bash
node scripts/run_xtend_tests.js type-exports-catalog --json
```

```txt
schema: xtend.type-exports.catalog-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-catalog --json
report: .xtend-test-results/xtend-type-exports-catalog-report.json
```

## Maintenance Notes

New catalogs should have a clear schema, a local verification path and a report with stable fields. If several modules need the same structure, add the shared type first and use it from the modules afterwards. This keeps the public tooling layer readable and prevents every report from creating its own small universe.

## Related reading

The component catalog overview explains which public records these catalog types describe. [Related article](./components.md)
