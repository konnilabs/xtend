# WP-TypeExports-09 - TypeExports Gate, Drift-Report und Docs-Handoff produktisieren

- Status: `completed`
- Datum: 13. Mai 2026
- Workstream: `WS7`
- Contract: `xtend.type-exports.drift-report.v1`
- Gate: `node scripts/run_xtend_tests.js type-exports --json`
- Release Gate: `node scripts/run_xtend_tests.js type-exports type-exports-loader type-exports-api type-exports-rmt type-exports-policy type-exports-builder type-exports-catalog type-exports-vendor --report .xtend-test-results/xtend-type-exports-report.json`
- Report: `.xtend-test-results/xtend-type-exports-report.json`
- Boundary: `types-only-no-runtime-imports`
- Boundary: `no-rmt-kernel-import-of-xtend-types`
- Boundary: `declarations-follow-js-runtime-surface`

## Ziel

WP-TypeExports-09 schliesst den TypeExports-Pfad als produktives Release-Kriterium ab. Der Basis-Gate `type-exports` bleibt der schnelle lokale Drift-Gate fuer neue Public Exports, waehrend `npm run test:type-exports:release` die TypeExports-Familie als Release-Owner-Artefakt buendelt.

## Ergebnis

- `catalog/type-exports.js` erkennt Wildcard-Declaration-Ziele wie `./xtend-builder/*.d.ts` als `wildcard-declaration-ready`.
- `catalog/type-exports.js` erzeugt einen Drift-Report fuer Package Exports, Declaration Targets, Package `types`-Conditions und Release-Handoff.
- `tests/types/type_exports_suite.js` prueft, dass es keine unklassifizierten Exports, keine Declaration Drift und keine Package Types Condition Drift gibt.
- `package.json#xtend.typeExports` markiert `WP-TypeExports-09` als abgeschlossen und enthaelt das Release-Gate-Bundle.
- `docs/type-exports.md`, `docs/public-component-types.md`, `docs/typescript-components.md` und `docs/package-export-lock.md` dokumentieren den Handoff.

## Release-Handoff

Der Release Owner kann TypeExports ueber das aggregierte Gate pruefen:

```bash
npm run test:type-exports:release
```

Das Gate schreibt den Report nach `.xtend-test-results/xtend-type-exports-report.json` und fuehrt die Gates `type-exports`, `type-exports-loader`, `type-exports-api`, `type-exports-rmt`, `type-exports-policy`, `type-exports-builder`, `type-exports-catalog` und `type-exports-vendor` gemeinsam aus.

## Definition of Done

- Neue Public Exports ohne Type-Entscheidung schlagen lokal fehl.
- `WP-TypeExports-01` bis `WP-TypeExports-09` sind in `package.json#xtend.typeExports.completedWorkpackages` sichtbar.
- `nextWorkpackages` ist leer.
- P0/P1/P2 Declaration Packs sind in Docs, Package-Metadaten und Artifact-Checklist sichtbar.
- Der Drift-Report ist ohne offene Declaration- oder Package-Types-Condition-Abweichung.
