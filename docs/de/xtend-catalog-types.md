# XTend Catalog Types

- Contract: `xtend.type-exports.catalog-declarations.v1`
- Workpackage: `WP-TypeExports-07`
- Gate: `node scripts/run_xtend_tests.js type-exports-catalog --json`
- Report: `.xtend-test-results/xtend-type-exports-catalog-report.json`

## Zweck

Catalog-Module beschreiben XTend-Gates, Handoffs, Release-Plaene und SurfaceManager-Runtime-Scopes als maschinenlesbare Plan-/Report-Strukturen. `WP-TypeExports-07` fuehrt dafuer ein gemeinsames Declaration-Pattern ein, damit neue Catalogs nicht pro Property neu typisiert werden muessen.

`./catalog/catalog-public-types.d.ts` definiert die gemeinsamen Basistypen `XtendCatalogPlan`, `XtendCatalogReport`, `XtendCatalogGate`, `XtendCatalogFactory`, `XtendCatalogValidator` und `XtendCatalogDiagnostic`. Die einzelnen Catalog-Facades exportieren die Runtime-Symbole des jeweiligen `.js`-Moduls und binden Funktionen wie `create*Plan`, `create*Report`, `create*Gate` und `validate*Plan` an diese Basistypen.

## Package Surface

Alle oeffentlichen `./catalog/*` Package-Exports besitzen nun eine eigene `types`-Condition. Beispiele:

```json
"./catalog/epic13-package-export-lock": {
  "types": "./catalog/epic13-package-export-lock.d.ts",
  "default": "./catalog/epic13-package-export-lock.js"
}
```

Das Runtime-Ziel bleibt unveraendert. Die Declarations importieren keine Runtime-Dateien und sind als Consumer-Facades gedacht.

## Catalog Familien

Der Gate klassifiziert drei fuer XTend wichtige Catalog-Familien:

- SurfaceManager-Catalogs bleiben interne XTend-UI-Unterstuetzung und dokumentieren App-Shell-, Surface-, Routing- und Runtime-Handoffs.
- Epic-Catalogs beschreiben Workpackage-, Gate- und Contract-Plaene ueber mehrere Epics hinweg.
- Release-Catalogs bündeln Handoff-, Readiness-, Export-Lock- und Migration-Entscheidungen.

Die SurfaceManager-Catalogs ersetzen keine Fabric-, RMT-Kernel- oder Runtime-Schicht. Sie bleiben deklarative Plaene und Reports, die UI-Surfaces unterstuetzen.

## Drift Gate

```bash
node scripts/run_xtend_tests.js type-exports-catalog --json
npm run test:type-exports-catalog
```

Der Gate prueft, dass Package-Catalogs ihre `types`-Conditions besitzen, dass alle Catalog-Runtime-Exports in den `.d.ts`-Facades auftauchen, dass SurfaceManager-/Epic-/Release-Catalogs klassifiziert sind und dass keine Runtime-Dateien Declaration-Imports erhalten.
