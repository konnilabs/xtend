# RMT vNext Primitive Lowering

- Contract: `xtend.rmt.vnext.primitive-lowering.v1`
- Workpackage: `RMT-VNEXT-PRIM-04`
- Status: `completed`
- Quelle: Media-Manager-Downstream-Transfer, `2026-05-19`

## Ziel

`RMT-VNEXT-PRIM-04` senkt validierte vNext-Primitives aus dem PRIM-03 Semantic
Graph in deterministische Core-, App-Platform- und Kernel-Records ab. App-
Autoren bleiben dabei in RMT vNext; JSON bleibt Compiler-Output und nicht der
Authoring-Pfad.

Die Lowering-Stufe ist Teil des bestehenden vNext-Compilers:

```js
const {
  compileRmtVNextSource
} = require('./tools/rmt-language/vnext-compiler');

const result = compileRmtVNextSource({ text, filePath });
```

Bei Primitive-Quellen baut der Compiler zuerst
`buildRmtVNextPrimitiveSemanticGraph(...)`. Error-Diagnostics aus dem Graph
stoppen das Lowering mit `status: "semantic_error"` und ohne Core-Document.

## Core-Domains

Der vNext-Core erhaelt zusaetzliche Primitive-Domains:

- `states`
- `selectors`
- `actions`
- `effects`
- `portals`
- `overlays`
- `resources`

Vorhandene Domains wie `surfaces`, `lanes`, `operations`, `events` und
`dataSources` werden fuer Primitive angereichert, statt einen zweiten Runtime-
Pfad zu erzeugen.

## App-Platform Artifact

Wenn Primitive vorhanden sind, enthaelt das Core-Document `appPlatform`:

```json
{
  "schema": "xtend.rmt.vnext.app-platform-records.v1",
  "sourceSyntax": "rmt-vnext",
  "surfaces": [],
  "events": [],
  "resources": []
}
```

Dieses Artefakt ist fuer Host-/Scaffold-Adapter gedacht. Host-spezifische
Imports, etwa Lazy Component Imports, bleiben dort sichtbar und tragen
`kernelVisible: false`.

## Kernel Records

Das Core-Document enthaelt bei Primitive-Quellen ausserdem `kernelRecords`:

```json
{
  "schema": "xtend.rmt.vnext.kernel-records.v1",
  "boundary": "no-rmt-kernel-import-of-host-runtime-types",
  "schedules": [],
  "fibers": [],
  "lifecycleRecords": []
}
```

Der Kernel-Record-Slice enthaelt Lanes, Fibers, Lifecycle-, State-, Selector-,
Action-, DataSource- und Resource-Fakten ohne Host-Runtime-Imports. Dadurch ist
PRIM-05 vorbereitet: Fabric kann Lane/Fiber-Evidence aus Compiler-Output
ableiten, ohne dass der Kernel Fabric oder XTend importieren muss.

## Evidence

Die Compiler-Suite prueft:

- positive Primitive-Fixture kompiliert zu State-, Selector-, DataSource-,
  Action-, Effect-, Portal-, Overlay-, Resource-, Surface- und Event-Records;
- App-Platform-Artefakt und Kernel-Records werden erzeugt;
- keyed Surface-Repeater und Event-Payload-Contracts bleiben erhalten;
- Host-Imports bleiben ausserhalb der Kernel-Sichtbarkeit;
- negative PRIM-03-Fixture stoppt vor dem Lowering mit Semantic-Diagnostics;
- Core JSON bleibt byte-stabil.

Gezielte lokale Gates:

```bash
node --check tools/rmt-language/vnext-compiler.js
node --check tests/rmt-language/rmt_vnext_compiler_suite.js
node -e "const suite=require('./tests/rmt-language/rmt_vnext_compiler_suite'); const result=suite.runRmtVNextCompilerSuite({rootDir:process.cwd()}); process.exit(result.ok ? 0 : 1);"
```

## PRIM-06 Anschluss

`RMT-VNEXT-PRIM-06` setzt auf `kernelRecords.schedules` und
`kernelRecords.fibers` auf. Die erste Source-to-Sea-Scheibe erzeugt daraus
Evidence, die vNext-Source-Maps, Kernel-Schedules, ableitbare Fabric-Fibers,
UI-Marker und eine Browser-Smoke-Fixture unter derselben Primitive-ID
korreliert.
