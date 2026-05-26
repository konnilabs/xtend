# XTend API Types

XTend API Types document the global browser API exposed by `api.js`. They are meant for hosts that use toasts, alerts, dialogs, modals, theme runtime and compliance metadata through `window.XTend` or the historical shortcut globals. The declaration in `./api.d.ts` makes that surface visible without rewriting `api.js` or introducing a TypeScript runtime.

## Namespace And Globals

The central namespace is `XTendNamespace`. It gathers `XTendComplianceApi`, `XTendThemeApi`, `XTendToastApi`, `XTendAlertApi`, `XTendDialogApi` and `XTendModalApi`. The globals `XTend`, `XTheme`, `XToast`, `XAlert`, `XDialog`, `XModal`, `showToast`, `showAlert`, `showDialog` and `showModal` also remain typed because older host pages call those shortcuts directly.

For third-party developers this means existing browser integrations can keep working while new paths receive type support. A call such as `XTend.theme.setTheme(...)` or `showToast.success(...)` uses the same public shape that the runtime exposes. The declaration also describes the ready event `xtend-api-ready`, so applications do not need private timing assumptions around initialization.

## Runtime Contract

`api.js` remains the single runtime source. The types document methods such as `initXTendAPI`, `getChecklist`, `getCoreContracts`, `getThemeTokens`, `setTheme`, `loadExternalTheme`, `registerTheme`, `removeTheme`, `show`, `success`, `error`, `warning`, `info`, `clearAll` and `close`. The check ensures that these names stay consistent in both the runtime and `api.d.ts`.

This is especially useful for design-system hosts that combine XTend UI with their own shell. The shell can use the theme or dialog namespace without importing individual components. At the same time, the gate prevents a global name from disappearing accidentally or existing in only one file.

## Local Verification

Run the API type check whenever you change `api.js`, `api.d.ts`, package exports or release metadata.

```bash
node scripts/run_xtend_tests.js type-exports-api --json
```

```txt
schema: xtend.type-exports.api-declarations.v1
local gate: node scripts/run_xtend_tests.js type-exports-api --json
report: .xtend-test-results/xtend-type-exports-api-report.json
```

## Maintenance Notes

New public functions belong in the runtime first, then in `api.d.ts`, then in the local check. Private helpers stay private and should not be documented in the namespace. If a host needs a new shortcut global, give it the same treatment as the existing globals: runtime assignment, TypeScript declaration, event or method verification and a short note in this page. That keeps the global API convenient without letting it drift.
