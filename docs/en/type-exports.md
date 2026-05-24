# Type Exports

The package export surface for loader, API, RMT, Fabric and components.

## What it covers

The core layer keeps hosts intentionally simple: one loader, one manifest, public TypeScript surfaces and local modules instead of CDN dependencies.

## Public building blocks

- Root-Paket `@ccslabs/xtend`.
- Runtime packages for RMT and Fabric.
- Declaration files for public imports.

## RMT TypeScript Surface

XTend publishes the RMT runtime and RMT tooling with stable `types` conditions. Hosts can use the declarative RMT layer without importing internal sources or build artifacts.

```ts
import { createRmtRuntime } from '@ccslabs/xtend/rmt';
import { createRmtBrowserRuntime } from '@ccslabs/xtend/rmt/browser';
import { compileRmtVNextSource } from '@ccslabs/xtend/rmt-language/vnext-compiler';
```

The main declaration files are `./xtendrmt/rmt-core.d.ts` for kernel and browser runtime APIs, plus `./tools/rmt-language/rmt-tooling-public-types.d.ts` for editor, linter and language-server integrations. This surface includes `RmtToolingDiagnostic`, `RmtTextEdit`, `RmtWorkspaceEdit`, `RmtLanguageServiceReport` and `RmtJsonRpcMessage`.

## Recommended workflow

Read the overview, copy the smallest suitable example and add host-specific details only afterwards.

## Next steps

- [Manifest](./manifest.md)
- [API](./api.md)
- [XTend Loader](./xtend-loader.md)
- [Design Tokens](./design-tokens.md)
