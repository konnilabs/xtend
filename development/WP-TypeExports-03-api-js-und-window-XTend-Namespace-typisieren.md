# WP-TypeExports-03 - `api.js` und `window.XTend.*` Namespace typisieren

- Status: `completed`
- Datum: 13. Mai 2026
- Contract: `xtend.type-exports.api-declarations.v1`
- Report: `xtend.type-exports.api-declarations-report.v1`
- Gate: `node scripts/run_xtend_tests.js type-exports-api --json`
- Package Script: `npm run test:type-exports-api`
- Report Artifact: `.xtend-test-results/xtend-type-exports-api-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `api-js-runtime-unchanged`

## Ziel

`api.d.ts` beschreibt die Core API und den globalen XTend-Komfort-Namespace fuer App-Code. Damit sind `initXTendAPI`, `window.XTend.compliance`, `window.XTend.theme`, `toast`, `alert`, `dialog`, `modal`, Legacy-Aliase und `xtend-api-ready` typisiert.

## Artefakte

| Artefakt | Zweck |
| --- | --- |
| `api.d.ts` | Public Type Contract fuer `api.js` und `window.XTend.*` |
| `catalog/type-exports-api.js` | Drift-Plan fuer API Runtime und Declaration |
| `tests/types/api_type_exports_suite.js` | lokaler Gate fuer API-Type-Drift |
| `docs/xtend-api-types.md` | API-Type-Dokumentation |

## Umsetzung

- `package.json#exports["./api"]` erhaelt eine `types`-Condition auf `./api.d.ts`.
- `browser` und `default` zeigen weiter auf `./api.js`.
- `api.js` bleibt runtime-unveraendert und importiert keine Declaration-Datei. Kurz: api.js bleibt runtime-unveraendert.
- Loader-Typen aus `WP-TypeExports-02` bleiben Grundlage fuer den Bootpfad; die API-Typen beschreiben nur den Core-Namespace.

## Definition of Done

- App-Code kann `initXTendAPI` und `window.XTend.*` ohne untyped JS-Contract nutzen.
- Bestehende globale Legacy-Aliase sind typisiert dokumentiert.
- Runtime-Methoden, Namespace-Keys und Declaration-Tokens werden lokal gegeneinander geprueft.
- Naechster startbarer Run ist `WP-TypeExports-04`.
