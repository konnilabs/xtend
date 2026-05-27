# Type Exports

Die Paket-Exportfläche für Loader, API, RMT, Fabric und Komponenten.

## Worum es geht

Type Exports beschreibt den Core-Pfad über lokale Module, öffentliche TypeScript-Oberflächen und überprüfbare Host-Verdrahtung.

## Öffentliche Bausteine

- Root-Paket `@ccslabs/xtend`.
- Runtime-Pakete für RMT und Fabric.
- Deklarationsdateien für öffentliche Imports.

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

```txt
WP-TypeExports-02: ./xtend-loader.d.ts, ./xtend-dev.d.ts, ./xtend-loader-types.md
WP-TypeExports-03: ./api.d.ts, ./xtend-api-types.md
WP-TypeExports-05: ./fabric/xtend-policy-public-types.d.ts, ./xtend-policy-types.md
WP-TypeExports-06: ./xtend-builder/builder-public-types.d.ts, ./xtend-builder-types.md
WP-TypeExports-07: ./catalog/catalog-public-types.d.ts, ./xtend-catalog-types.md
WP-TypeExports-08: ./design-tokens/xtend-design-tokens.d.ts, ./design-tokens/xtheme-token-alias-layer.d.ts, ./components/prism.d.ts, ./xtend-vendor-types.md
```

## Empfohlener Ablauf

Lies den Überblick, kopiere das kleinste passende Beispiel und erweitere erst danach um Host-spezifische Details.

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

## Öffentlicher Vertrag

Type Exports ist der öffentliche Referenz-Vertrag für `docs/de/type-exports.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: öffentliche Dateien, Package Exports, Manifest-Keys, Attribute und Host-Verdrahtung.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/type-exports.md`
- `docs/menu.json`
- `package.json`
- `components/manifest.json`
- `xtend-loader.js`
- `api.js`
- `api.d.ts`
- `design-tokens/xtend-design-tokens.js`

Namen:
- `./xtendrmt/rmt-core.d.ts`
- `./tools/rmt-language/rmt-tooling-public-types.d.ts`
- `./maraca`
- `./maraca/runtime`
- `./xtend-maraca/index.d.ts`
- `./xtend-maraca/runtime.d.ts`
- `docs/de/type-exports.md`
- `docs/menu.json`
- `components/manifest.json`
- `design-tokens/xtend-design-tokens.js`

Befehle:
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn ein Host nichts lädt, prüfe Manifest-Pfad, Export-Name, Attribut-Schreibweise und ob die Datei lokal erreichbar ist.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
