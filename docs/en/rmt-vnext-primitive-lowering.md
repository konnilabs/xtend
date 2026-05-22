# RMT vNext Primitive Lowering

- Contract: `xtend.rmt.vnext.primitive-lowering.v1`
- Workpackage: `RMT-VNEXT-PRIM-04`
- Status: `completed`
- Source: Media Manager downstream transfer, `2026-05-19`

## Goal

`RMT-VNEXT-PRIM-04` lowers validated vNext primitives from the PRIM-03 semantic graph into deterministic Core, App Platform and Kernel records. App authors stay in RMT vNext; JSON remains compiler output, not the authoring path.

The lowering stage is part of the existing vNext compiler:

```js
const {
  compileRmtVNextSource
} = require('./tools/rmt-language/vnext-compiler');

const result = compileRmtVNextSource({ text, filePath });
```

For primitive sources, the compiler first builds `buildRmtVNextPrimitiveSemanticGraph(...)`. Error diagnostics from the graph stop lowering with `status: "semantic_error"` and without a Core document.

## Core Domains

The vNext Core receives additional primitive domains:

- `states`
- `selectors`
- `actions`
- `effects`
- `portals`
- `overlays`
- `resources`

Existing domains such as `surfaces`, `lanes`, `operations`, `events` and `dataSources` are enriched for primitives instead of creating a second runtime path.

## App Platform Artifact

When primitives are present, the Core document contains `appPlatform`:

```json
{
  "schema": "xtend.rmt.vnext.app-platform-records.v1",
  "sourceSyntax": "rmt-vnext",
  "surfaces": [],
  "events": [],
  "resources": []
}
```

This artifact is intended for host and scaffold adapters. Host-specific imports, such as lazy component imports, remain visible there and carry `kernelVisible: false`.

## Kernel Records

For primitive sources, the Core document also contains `kernelRecords`:

```json
{
  "schema": "xtend.rmt.vnext.kernel-records.v1",
  "boundary": "no-rmt-kernel-import-of-host-runtime-types",
  "schedules": [],
  "fibers": [],
  "lifecycleRecords": []
}
```

The Kernel record slice contains lane, fiber, lifecycle, state, selector, action, data source and resource facts without host-runtime imports. This prepares PRIM-05: Fabric can derive lane/fiber evidence from compiler output without the kernel importing Fabric or XTend.

## Evidence

The compiler suite verifies that:

- the positive primitive fixture compiles to state, selector, data source, action, effect, portal, overlay, resource, surface and event records;
- App Platform artifact and Kernel records are created;
- keyed surface repeaters and event payload contracts remain intact;
- host imports stay outside kernel visibility;
- the negative PRIM-03 fixture stops before lowering with semantic diagnostics;
- Core JSON remains byte-stable.

Targeted local gates:

```bash
node --check tools/rmt-language/vnext-compiler.js
node --check tests/rmt-language/rmt_vnext_compiler_suite.js
node -e "const suite=require('./tests/rmt-language/rmt_vnext_compiler_suite'); const result=suite.runRmtVNextCompilerSuite({rootDir:process.cwd()}); process.exit(result.ok ? 0 : 1);"
```

## PRIM-06 Follow-up

`RMT-VNEXT-PRIM-06` builds on `kernelRecords.schedules` and `kernelRecords.fibers`. The first source-to-sea slice produces evidence that correlates vNext source maps, Kernel schedules, derivable Fabric fibers, UI markers and a browser-smoke fixture under the same primitive ID.
