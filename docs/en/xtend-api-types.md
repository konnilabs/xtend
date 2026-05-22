# XTend API Types

- Contract: `xtend.type-exports.api-declarations.v1`
- Workpackage: `WP-TypeExports-03`
- Gate: `node scripts/run_xtend_tests.js type-exports-api --json`
- Report: `.xtend-test-results/xtend-type-exports-api-report.json`
- Declaration: `api.d.ts`

## Purpose

`api.d.ts` describes the public core API from `api.js`: `initXTendAPI(manifest)`, the global namespace `window.XTend.*`, the legacy aliases and the event `xtend-api-ready`. The declaration is types-only; `api.js` remains unchanged at runtime.

## Namespace

The central namespace type is `XTendNamespace`.

| API | Type |
| --- | --- |
| `window.XTend.compliance` | `XTendComplianceApi` |
| `window.XTend.theme` | `XTendThemeApi` |
| `window.XTend.toast` | `XTendToastApi` |
| `window.XTend.alert` | `XTendAlertApi` |
| `window.XTend.dialog` | `XTendDialogApi` |
| `window.XTend.modal` | `XTendModalApi` |

## Legacy Aliases

`api.d.ts` continues to type the existing global convenience aliases:

- `window.XTheme`
- `window.XToast`
- `window.XAlert`
- `window.XDialog`
- `window.XModal`
- `window.showToast`
- `window.showAlert`
- `window.showDialog`
- `window.showModal`

## Event

`WindowEventMap` contains `xtend-api-ready` with `XTendApiReadyDetail`. The payload reports whether toast, alert, dialog, modal and theme APIs are initialized.

## Package Export

As of `WP-TypeExports-03`, the package export `./api` has the `types` condition `./api.d.ts`. `browser` and `default` continue to point to `./api.js`.

## Drift Gate

The gate `type-exports-api` checks:

- `api.d.ts` exists and is included in the package.
- `./api` points to `./api.d.ts` through `types`.
- `initXTendAPI`, `window.XTend.*`, legacy aliases and `xtend-api-ready` are visible in runtime and declaration.
- `api.js` imports no declaration file.
