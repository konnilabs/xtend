# Type Exports

Die Paket-Exportfläche für Loader, API, RMT, Fabric und Komponenten.

## Worum es geht

`package.json` ordnet jedem öffentlichen Subpath eine Runtime-Datei und, wo vorhanden, eine `types` Condition zu. Consumer importieren diese Subpaths; direkte Zugriffe auf interne Source- oder Testpfade sind nicht stabil.

## Öffentliche Bausteine

- `./loader` und `./api` decken Browser-Bootstrap und UI-API ab.
- `./rmt`, `./rmt/browser` und RMT-Language-Subpaths decken Runtime und Tooling ab.
- Fabric-, Maraca-, Builder- und Komponenten-Subpaths verweisen auf co-located `.d.ts` Dateien.

## RMT TypeScript-Oberfläche

XTend veröffentlicht die RMT-Laufzeit und die RMT-Werkzeuge mit stabilen `types` Conditions. Dadurch können Hosts die deklarative RMT-Schicht verwenden, ohne interne Quellen oder Build-Artefakte zu importieren.

```ts
import { createRmtRuntime } from '@ccslabs/xtend/rmt';
import { createRmtBrowserRuntime } from '@ccslabs/xtend/rmt/browser';
import { compileRmtVNextSource } from '@ccslabs/xtend/rmt-language/vnext-compiler';
```

Die wichtigsten Deklarationsdateien sind `./xtendrmt/rmt-core.d.ts` für Kernel- und Browser-Runtime APIs sowie `./tools/rmt-language/rmt-tooling-public-types.d.ts` für Editor-, Linter- und Language-Server-Integrationen. Diese Oberfläche enthält unter anderem `RmtToolingDiagnostic`, `RmtTextEdit`, `RmtWorkspaceEdit`, `RmtLanguageServiceReport` und `RmtJsonRpcMessage`.

## Gate-Vertrag

```txt
plan: xtend.type-exports.plan.v1
drift report: xtend.type-exports.drift-report.v1
local gate: node scripts/run_xtend_tests.js type-exports --json
release gate: npm run test:type-exports:release
loader types: ./xtend-loader.d.ts
api types: ./api.d.ts
decision: types-not-required
```

Maraca ist als Package-Export `./maraca` und `./maraca/runtime` klassifiziert und nutzt `./xtend-maraca/index.d.ts` sowie `./xtend-maraca/runtime.d.ts`.

## Empfohlener Ablauf

Importiere ausschließlich einen Eintrag aus `package.json#exports` und lasse TypeScript mit derselben Package-Version auflösen. Prüfe Änderungen mit `node scripts/run_xtend_tests.js type-exports --json`; fehlende Types werden entweder ergänzt oder ausdrücklich als Runtime-only klassifiziert.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
- [XTend Loader Types](./xtend-loader-types.md)
- [XTend API Types](./xtend-api-types.md)
- [XTend Policy Types](./xtend-policy-types.md)
- [XTend Builder Types](./xtend-builder-types.md)
- [XTend Catalog Types](./xtend-catalog-types.md)
- [XTend Vendor Types](./xtend-vendor-types.md)
