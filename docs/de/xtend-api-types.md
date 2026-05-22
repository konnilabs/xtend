# XTend API Types

- Contract: `xtend.type-exports.api-declarations.v1`
- Workpackage: `WP-TypeExports-03`
- Gate: `node scripts/run_xtend_tests.js type-exports-api --json`
- Report: `.xtend-test-results/xtend-type-exports-api-report.json`
- Declaration: `api.d.ts`

## Zweck

`api.d.ts` beschreibt die oeffentliche Core-API aus `api.js`: `initXTendAPI(manifest)`, den globalen Namespace `window.XTend.*`, die Legacy-Aliase und das Event `xtend-api-ready`. Die Declaration ist types-only; `api.js` bleibt runtime-unveraendert.

## Namespace

Der zentrale Namespace-Typ heisst `XTendNamespace`.

| API | Typ |
| --- | --- |
| `window.XTend.compliance` | `XTendComplianceApi` |
| `window.XTend.theme` | `XTendThemeApi` |
| `window.XTend.toast` | `XTendToastApi` |
| `window.XTend.alert` | `XTendAlertApi` |
| `window.XTend.dialog` | `XTendDialogApi` |
| `window.XTend.modal` | `XTendModalApi` |

## Legacy-Aliase

`api.d.ts` typisiert weiterhin die bestehenden globalen Komfort-Aliase:

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

`WindowEventMap` enthaelt `xtend-api-ready` mit `XTendApiReadyDetail`. Der Payload meldet, ob Toast, Alert, Dialog, Modal und Theme APIs initialisiert sind.

## Package Export

Der Package-Export `./api` besitzt ab `WP-TypeExports-03` die `types`-Condition `./api.d.ts`. `browser` und `default` zeigen weiter auf `./api.js`.

## Drift Gate

Der Gate `type-exports-api` prueft:

- `api.d.ts` existiert und ist im Package enthalten.
- `./api` zeigt per `types` auf `./api.d.ts`.
- `initXTendAPI`, `window.XTend.*`, Legacy-Aliase und `xtend-api-ready` sind in Runtime und Declaration sichtbar.
- `api.js` importiert keine Declaration-Datei.
