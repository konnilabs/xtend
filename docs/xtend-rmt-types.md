# XTend RMT Types

- Contract: `xtend.type-exports.rmt-declarations.v1`
- Workpackage: `WP-TypeExports-04`
- Gate: `node scripts/run_xtend_tests.js type-exports-rmt --json`
- Report: `.xtend-test-results/xtend-type-exports-rmt-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Zweck

`WP-TypeExports-04` macht die XTendRMT Runtime, den Browser-Entry und die RMT-Language-/Tooling-Exports fuer TypeScript-Consumer importierbar. `./rmt` und `./rmt/browser` zeigen per `types`-Condition auf `./xtendrmt/rmt-core.d.ts`, waehrend `./rmt/dom-descriptor-renderer`, `./rmt/state-selector-runtime`, `./rmt/action-effect-runtime`, `./rmt/event-routing-runtime` und `./rmt/surface-resource-graph-runtime` eigene schmale Runtime-Declarations besitzen.

## Declaration Pack

| Bereich | Package Export | Declaration |
| --- | --- | --- |
| RMT Runtime | `./rmt`, `./rmt/browser` | `./xtendrmt/rmt-core.d.ts` |
| RMT App Platform Runtime | `./rmt/dom-descriptor-renderer`, `./rmt/state-selector-runtime`, `./rmt/action-effect-runtime`, `./rmt/event-routing-runtime`, `./rmt/surface-resource-graph-runtime` | `./xtendrmt/rmt-dom-descriptor-renderer.d.ts`, `./xtendrmt/rmt-state-selector-runtime.d.ts`, `./xtendrmt/rmt-action-effect-runtime.d.ts`, `./xtendrmt/rmt-event-routing-runtime.d.ts`, `./xtendrmt/rmt-surface-resource-graph-runtime.d.ts` |
| Source Model und Parser | `./rmt-language/source-model`, `./rmt-language/parser` | `tools/rmt-language/*.d.ts` |
| vNext Compiler und Contracts | `./rmt-language/vnext-*` | `tools/rmt-language/vnext-*.d.ts` |
| Tooling Services | `./rmt-language/diagnostics`, `./rmt-language/app-platform-tooling`, `./rmt-language/completions`, `./rmt-language/hover`, `./rmt-language/symbols`, `./rmt-language/definitions`, `./rmt-language/code-actions` | Service-Facades mit gemeinsamen RMT-Tooling-Typen |
| LSP, Linter, Editor | `./rmt-language-server`, `./rmt-linter/*`, `./rmt-editor/vscode` | LSP-/CLI-/Editor-Facades |

Der gemeinsame Typkern liegt in `tools/rmt-language/rmt-tooling-public-types.d.ts` und enthaelt unter anderem `RmtToolingDiagnostic`, `RmtTextEdit`, `RmtWorkspaceEdit`, `RmtLanguageServiceReport` und `RmtJsonRpcMessage`.

## Drift Gate

Der Gate prueft:

- jede RMT Package-Export-Condition zeigt auf die erwartete `.d.ts`
- jede Declaration-Datei existiert und exportiert die Runtime-Symbole des zugehoerigen JS-Moduls
- zentrale Diagnostic-, Range-, Edit-, Completion-, Hover-, Symbol-, Definition-, CodeAction- und JSON-RPC-Typen bleiben vorhanden
- RMT Runtime-Dateien importieren keine `.d.ts`
- RMT-Kernel importiert keine XTend-UI-Typen, Loader, API, Fabric, A11y oder Security Runtime-Oberflaechen

## Handoff

`WP-TypeExports-05` kann nun Fabric-, A11y- und Security-Policy-APIs typisieren. Das RMT-Pack ist dabei die Referenz fuer P1-Integrationsmodule: schmale Declarations, bestehende JS-Runtime, package-native `types`-Conditions und ein Drift-Gate gegen Export-Abweichungen.
