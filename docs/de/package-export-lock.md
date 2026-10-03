# Package Export Lock

Der Package Export Lock ist die lokale Prüfung für die veröffentlichte XTend Package-Oberfläche. Er verbindet `package.json#exports`, gepackte Root-Dateien, TypeScript-Deklarationen und Surface Groups zu einem stabilen Vertrag. Teams nutzen diese Seite, wenn sie neue öffentliche Module ergänzen, Workspace-Pakete in die CI aufnehmen oder sicherstellen möchten, dass ein Paket-Archiv dieselben Einstiegspunkte enthält wie die dokumentierte API.

## Export Surface

Der Lock umfasst ESM-Registry, Loader, Components, Maraca, XScaler, Fabric, XTendRMT, Builder, Docs, Security, Catalog, Design Tokens und RMT Tooling. Die Registry besitzt `.` und `./registry`, mit `xtend.js` plus `xtend.d.ts` für Browser und `xtend.ssr.mjs` plus `xtend.ssr.d.ts` für Node/SSR. Classic bleibt explizit unter `./loader`. Neue Public Exports müssen bewusst im Package-Export-Catalog, in `package.json`, TypeExports, Changelog, README und dieser Dokumentation nachgezogen werden.

Maraca ist als eigene Surface Group enthalten und deckt auch die AppServices-, Server-Host- und Build-Provider-Exports im Pack Root `xtend-maraca` ab. XScaler bildet eine separate Surface Group mit nativen ESM-/CommonJS-Einstiegen, Deklarationen und den JSON-Schemas unter `./xscaler/schemas/*`; der PHP-Preflight-Evaluator wird gepackt, aber nicht als JavaScript-Subpath exportiert.

## Artefakte

Die Prüfung arbeitet mit maschinenlesbaren Artefakten. Das Pack Dry Run JSON zeigt, welche Dateien in ein Archiv gelangen würden. Der Surface Lock zeigt, ob alle erwarteten Exports, Roots und Declaration Targets vorhanden sind. Der Report fasst das Ergebnis für lokale Entwicklung, CI und Nightly zusammen. Diese drei Signale sind absichtlich klein genug, um in Pull-Request-Artefakten gelesen zu werden, aber präzise genug, um Release-Drift zu finden.

```txt
contract: xtend.epic13.package-export-lock.v1
report: xtend.epic13.package-export-lock-report.v1
surface: xtend.epic13.package-export-surface.v1
local gate: node scripts/run_xtend_tests.js epic13-package-export-lock --json
capture: npm run pack:dry-run:report
expectedExportCount: 184
```

```txt
declarations: ./xtend.d.ts, ./xtend.ssr.d.ts, ./xtend-loader.d.ts, ./xtend-dev.d.ts, ./api.d.ts
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

## CI und Nightly

GitHub Actions führen den statischen Check in den normalen Release Reports aus und sammeln im Package-Structure-Job zusätzlich Workspace-Dry-Runs. Nightly baut dieselben Artefakte erneut, ergänzt den Maraca-Report und speichert Bundle- sowie Größeninformationen. Dadurch erkennen die Standard-Gates neue Module wie `xtend-i18n` und `xtend-maraca`, ohne dass eine visuelle Komponente registriert werden muss.

Der wichtige Betriebsmodus ist "lokal zuerst". Netzwerkabhängige Evidenz gehört in spezielle Jobs, während Package Export Lock, TypeExports, i18n und Maraca ohne Downloads prüfbar bleiben. Wenn ein Job rot wird, sollte zuerst geklärt werden, ob ein Export fehlt, eine Datei nicht im Pack Root liegt oder ein neuer TypeScript-Target nicht in der Klassifikation angekommen ist.

## Lokale Pflege

Nach neuen Public Exports lokal mindestens ausführen:

```bash
npm run test:esm-registry
node scripts/run_xtend_tests.js type-exports epic13-package-export-lock maraca-package-exports --json
npm run pack:dry-run
```

Die Prüfung ist kein Ersatz für Produkttests, aber sie schützt die Paketgrenze. Wenn ein neues Modul nur im Source Tree existiert, aber nicht im Export Lock, wird es nicht als veröffentlichte Oberfläche behandelt. Wenn ein Export im Lock steht, muss er mit Deklaration, Dokumentation und Pack Root zusammen gepflegt werden.

## Weiterführend

Die Type-Export-Referenz listet die öffentlichen Deklarationen auf, die der Export-Lock schützt. Siehe [Type Exports](./type-exports.md) und [ESM-Registry](./esm-registry.md).
