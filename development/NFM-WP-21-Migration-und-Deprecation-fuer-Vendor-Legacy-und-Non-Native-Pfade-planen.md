# NFM-WP-21 - Migration und Deprecation fuer Vendor-, Legacy- und Non-Native-Pfade planen

- Status: `completed`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.migration-deprecation-plan.v1`
- Matrix: `xtend.native-first.migration-deprecation-matrix.v1`
- Fixture Pack: `xtend.native-first.migration-deprecation-fixtures.v1`
- Report Schema: `xtend.native-first.migration-deprecation-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-migration-deprecation --json`
- Package Script: `npm run test:native-first-migration-deprecation`

## Ziel

Bestehende nicht mission-konforme Pfade sind kontrolliert reduziert, ohne sie still zu entfernen. Jeder relevante Vendor-, Legacy- oder non-native Pfad besitzt Alternative, Migration Guide, Gate, SemVer-Policy und Release-Entscheidung.

## Umgesetzte Artefakte

- `development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md`
- `development/XTend-Native-First-Migration-Deprecation-Plan-Matrix.md`
- `development/NFM-WP-21-Migration-und-Deprecation-fuer-Vendor-Legacy-und-Non-Native-Pfade-planen.md`
- `tests/fixtures/native-first/native-first-migration-deprecation-fixtures.json`
- `tests/native-first/native_first_migration_deprecation_suite.js`
- `docs/de/native-first-migration-guide.md`
- `docs/en/native-first-migration-guide.md`

## Entscheidungen

| Kandidat | Entscheidung |
|----------|--------------|
| `NFM-RC-01` Manual HTML normaler UI | `migration-required`; neue normale App-UI braucht DOM Descriptor oder Trusted-DOM-Boundary |
| `NFM-RC-02` Prism Vendor Highlighter | `deprecation-planned`; Fassade einfrieren, kein breiter Public Re-Export |
| `NFM-RC-03` Turndown Helper | `migration-required`; neue Raw-HTML-Konvertierung braucht Trust Boundary oder structured writer |
| `NFM-RC-04` Maraca Rollup/Terser | `containment-accepted`; Build Tooling bleibt ausserhalb Runtime |
| `NFM-RC-05` VS-Code Language Client | `containment-accepted`; Editor Scope bleibt isoliert |
| `NFM-RC-06` Legacy Loader | `deprecation-planned`; Kompatibilitaetsfenster mit Warnung vor Entfernung |
| `NFM-RC-07` Epic-18 Vendor Backport | `closed-guardrail`; keine neue Vendor-Kopie |
| `NFM-RC-08` x-icon Lucide Adapter | `closed-guardrail`; positives owned-adapter Muster |

## Source Gates

```bash
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js type-exports-vendor --json
node scripts/run_xtend_tests.js type-exports-loader --json
node scripts/run_xtend_tests.js component-long-tail-migration --json
node scripts/run_xtend_tests.js manifest-import-policy --json
node scripts/run_xtend_tests.js rmt-dom-descriptor-renderer --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js rmt-native-shell-migration --json
node scripts/run_xtend_tests.js maraca-bundle --json
node scripts/run_xtend_tests.js maraca-size-budget --json
node scripts/run_xtend_tests.js rmt-tooling-docs --json
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
node scripts/run_xtend_tests.js epic18-vendor-bugfix-smokes --json
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js docs-public-quality --json
node scripts/run_xtend_tests.js references --json
```

## Akzeptanz

| Kriterium | Entscheidung |
|-----------|--------------|
| alle `NFM-RC-01` bis `NFM-RC-08` besitzen Plan-Eintraege | erfuellt |
| jede Deprecation besitzt Alternative, Migration Guide, Gate und Release-Entscheidung | erfuellt |
| keine stille Entfernung ohne SemVer-Policy | erfuellt |
| Registry enthaelt `xtend.native-first.migration-deprecation-plan.v1` | erfuellt |
| Runner und Package expose `native-first-migration-deprecation` | erfuellt |
| keine neue Runtime-Dependency | erfuellt |

## Handoff

- `NFM-WP-22` kann Native-First Mission Handoff und naechste Epic-Grenze anhand der Migration-, Deprecation-, Containment- und Guardrail-Entscheidungen abschliessen.
