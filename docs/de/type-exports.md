# Type Exports

Die Paket-Exportfläche für Loader, API, RMT, Fabric und Komponenten.

## Worum es geht

Die Core-Schicht hält Hosts bewusst einfach: ein Loader, ein Manifest, öffentliche TypeScript-Oberflächen und lokale Module statt CDN-Abhängigkeiten.

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

## Empfohlener Ablauf

Lies den Überblick, kopiere das kleinste passende Beispiel und erweitere erst danach um Host-spezifische Details.

## Nächste Schritte

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
