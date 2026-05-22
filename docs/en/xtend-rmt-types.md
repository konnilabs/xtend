# XTend RMT Types

- Contract: `xtend.type-exports.rmt-declarations.v1`
- Workpackage: `WP-TypeExports-04`
- Gate: `node scripts/run_xtend_tests.js type-exports-rmt --json`
- Report: `.xtend-test-results/xtend-type-exports-rmt-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Purpose

`WP-TypeExports-04` makes the XTendRMT runtime, browser entry and RMT language/tooling exports importable for TypeScript consumers. `./rmt` and `./rmt/browser` point through a `types` condition to `./xtendrmt/rmt-core.d.ts`, while `./rmt/dom-descriptor-renderer`, `./rmt/state-selector-runtime`, `./rmt/action-effect-runtime`, `./rmt/event-routing-runtime` and `./rmt/surface-resource-graph-runtime` have their own narrow runtime declarations.

## Declaration Pack

| Area | Package export | Declaration |
| --- | --- | --- |
| RMT Runtime | `./rmt`, `./rmt/browser` | `./xtendrmt/rmt-core.d.ts` |
| RMT App Platform Runtime | `./rmt/dom-descriptor-renderer`, `./rmt/state-selector-runtime`, `./rmt/action-effect-runtime`, `./rmt/event-routing-runtime`, `./rmt/surface-resource-graph-runtime` | `./xtendrmt/rmt-dom-descriptor-renderer.d.ts`, `./xtendrmt/rmt-state-selector-runtime.d.ts`, `./xtendrmt/rmt-action-effect-runtime.d.ts`, `./xtendrmt/rmt-event-routing-runtime.d.ts`, `./xtendrmt/rmt-surface-resource-graph-runtime.d.ts` |
| Source Model and Parser | `./rmt-language/source-model`, `./rmt-language/parser` | `tools/rmt-language/*.d.ts` |
| vNext Compiler and Contracts | `./rmt-language/vnext-*` | `tools/rmt-language/vnext-*.d.ts` |
| Tooling Services | `./rmt-language/diagnostics`, `./rmt-language/app-platform-tooling`, `./rmt-language/completions`, `./rmt-language/hover`, `./rmt-language/symbols`, `./rmt-language/definitions`, `./rmt-language/code-actions` | service facades with shared RMT tooling types |
| LSP, Linter, Editor | `./rmt-language-server`, `./rmt-linter/*`, `./rmt-editor/vscode` | LSP/CLI/editor facades |

The shared type core is in `tools/rmt-language/rmt-tooling-public-types.d.ts` and includes `RmtToolingDiagnostic`, `RmtTextEdit`, `RmtWorkspaceEdit`, `RmtLanguageServiceReport` and `RmtJsonRpcMessage`.

## Drift Gate

The gate verifies:

- every RMT package export condition points to the expected `.d.ts`
- every declaration file exists and exports the runtime symbols of the corresponding JS module
- central diagnostic, range, edit, completion, hover, symbol, definition, code-action and JSON-RPC types remain present
- RMT runtime files import no `.d.ts`
- RMT kernel imports no XTend UI types, loader, API, Fabric, a11y or security runtime surfaces

## Handoff

`WP-TypeExports-05` can now type Fabric, a11y and security policy APIs. The RMT pack is the reference for P1 integration modules: narrow declarations, existing JS runtime, package-native `types` conditions and a drift gate against export deviations.
