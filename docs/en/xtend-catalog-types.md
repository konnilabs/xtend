# XTend Catalog Types

- Contract: `xtend.type-exports.catalog-declarations.v1`
- Workpackage: `WP-TypeExports-07`
- Gate: `node scripts/run_xtend_tests.js type-exports-catalog --json`
- Report: `.xtend-test-results/xtend-type-exports-catalog-report.json`

## Purpose

Catalog modules describe XTend gates, handoffs, release plans and SurfaceManager runtime scopes as machine-readable plan/report structures. `WP-TypeExports-07` introduces a shared declaration pattern so new catalogs do not need to type every property from scratch.

`./catalog/catalog-public-types.d.ts` defines the shared base types `XtendCatalogPlan`, `XtendCatalogReport`, `XtendCatalogGate`, `XtendCatalogFactory`, `XtendCatalogValidator` and `XtendCatalogDiagnostic`. The individual catalog facades export the runtime symbols of the respective `.js` module and bind functions such as `create*Plan`, `create*Report`, `create*Gate` and `validate*Plan` to these base types.

## Package Surface

All public `./catalog/*` package exports now have their own `types` condition. Examples:

```json
"./catalog/epic13-package-export-lock": {
  "types": "./catalog/epic13-package-export-lock.d.ts",
  "default": "./catalog/epic13-package-export-lock.js"
}
```

The runtime target remains unchanged. The declarations import no runtime files and are intended as consumer facades.

## Catalog Families

The gate classifies three catalog families that matter for XTend:

- SurfaceManager catalogs remain internal XTend UI support and document app-shell, surface, routing and runtime handoffs.
- Epic catalogs describe workpackage, gate and contract plans across multiple epics.
- Release catalogs bundle handoff, readiness, export-lock and migration decisions.

The SurfaceManager catalogs do not replace Fabric, the RMT kernel or a runtime layer. They remain declarative plans and reports that support UI surfaces.

## Drift Gate

```bash
node scripts/run_xtend_tests.js type-exports-catalog --json
npm run test:type-exports-catalog
```

The gate verifies that package catalogs have their `types` conditions, that all catalog runtime exports appear in the `.d.ts` facades, that SurfaceManager/epic/release catalogs are classified and that runtime files receive no declaration imports.
