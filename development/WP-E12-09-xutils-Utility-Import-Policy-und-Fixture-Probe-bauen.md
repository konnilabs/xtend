# WP-E12-09 - x-utils Utility, Import Policy und Fixture-Probe bauen

- Status: `completed`
- Datum: 7. Mai 2026
- Epic: `EPIC-12`
- Contract: `xtend.epic12.wp09.xutils-utility-import-policy-boundary.v1`
- Primaerer Gate: `node scripts/run_xtend_tests.js components catalog-coverage component-long-tail-migration regression-priority references --json`
- RMT-Kernel-Grenze: `no-rmt-kernel-import-of-xtend-types`

## Ziel

`WP-E12-09` macht `x-utils` als Utility-Modul testbar, typisiert und import-policy-sicher, ohne daraus ein Custom Element oder eine visuelle Shell zu machen. `x-utils` bleibt eine host-neutrale Hilfsoberflaeche fuer XTend-Komponenten, Demos, Fabric-Harnesses und lokale Tests.

## Umsetzung

### Utility Boundary

`components/xutils.js` enthaelt nun:

- `xtendUtilityContract` mit Schema `xtend.utility.module-contract.v1`
- `xtendImportPolicy` mit Schema `xtend.utility.import-policy.v1`
- `assertLocalImport(specifier)` fuer lokale Import-Policy-Probes
- `snapshotUtilityContract()` fuer Boundary-Snapshots
- `resolveUiEffects()`, `prepareUiEffects()` und `releaseUiEffects()` fuer opt-in Shell-Effekte unter `xtend.utility.ui-effects.v1`
- `getUtilityContract()` als stabile Contract-Leseflaeche
- Event `xutils:import-policy-check` fuer Test-, Security- und Fabric-Harnesses
- Event `xutils:ui-effects-change` fuer UI-Effects-Harnesses

Die Import Policy blockiert externe Protokolle, protocol-relative Specifier und bekannte CDN-Hosts. Lokale Pfade und relative Modulpfade bleiben erlaubt.

### Public Types

`components/xutils.d.ts` beschreibt:

- `XUtilsApi`
- `XUtilsUtilityContract`
- `XUtilsImportPolicy`
- `XUtilsImportPolicyResult`
- `XUtilsBoundarySnapshot`
- `XUtilsUiEffectsState`
- `XUtilsTemplateApi`
- `XUtilsPublicEventContract`

`components/xtend-public-types.d.ts` fuehrt `x-utils` nun als gueltige Public-Event-Quelle.

### Boundary Fixture

`tests/components/fixtures/xutils.component.html` ist keine visuelle Komponentenfixture. Die Fixture importiert das lokale Modul, prueft DOM-, A11y-, Template- und Event-Helfer, validiert lokale und externe Import-Specifier, loest `tag: "ui-effects"` aus einem RMT-Dokument auf und zeichnet Policy-/UI-Effects-Events auf.

### Component Suite

`tests/components/xutils.component_suite.js` prueft:

- lokaler Manifest-Pfad
- keine `customElements.define` Registrierung
- Utility-, Import-Policy-, UI-Effects- und Boundary-Schemas
- Public Types und Window API
- Fixture ohne CDN-Abhaengigkeit
- `assertLocalImport(specifier)` und `snapshotUtilityContract()`
- Dokumentation der nicht-visuellen Utility-Boundary

## Catalog Impact

- `componentSuite` steigt auf `37/37`
- `fixture` steigt auf `37/37`
- `types` steigt auf `37/37`
- `x-utils` wechselt von `documented` zu `typed-contract-gated`
- `x-utils` bleibt wegen offener Performance-Boundary bewusst nicht `enterprise-ready`
- `requiresLongTailSuite` sinkt im Regression-Priority-Plan auf `0`

## Geaenderte Artefakte

| Artefakt | Zweck |
|----------|-------|
| `components/xutils.js` | Utility Contract, Import Policy, Boundary Snapshot und Event |
| `components/xutils.d.ts` | Public Types fuer Utility API, Import Policy und Boundary Snapshot |
| `components/xtend-public-types.d.ts` | `x-utils` als Public Event Source |
| `tests/components/xutils.component_suite.js` | Component-Level Utility Boundary Contract |
| `tests/components/fixtures/xutils.component.html` | nicht-visuelle Utility Fixture |
| `tests/components/component_suite.js` | Aggregation der neuen Suite |
| `tests/components/component_public_types_suite.js` | Public-Type-Gate fuer `x-utils` |
| `docs/components/xutils.md` | Entwicklerdokumentation fuer Utility Boundary |
| `development/BACKLOG-EPIC-12-XTend-Long-Tail-Runtime-Hardening-und-Release-Candidate-Stabilisierung.md` | Status und Handoff |

## Definition of Done

| Kriterium | Status |
|-----------|--------|
| `x-utils` hat Suite, Fixture und Types | erfuellt |
| `x-utils` bleibt nicht-visuelle Utility-Boundary | erfuellt |
| Import Policy blockiert externe Specifier | erfuellt |
| Utility Contract ist snapshotbar | erfuellt |
| Policy Event ist fuer Harnesses sichtbar | erfuellt |
| RMT Kernel importiert keine XTend-/`x-utils`-Runtime | erfuellt |
| `WP-E12-10` ist startbar | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js components --json
node scripts/run_xtend_tests.js catalog-coverage component-long-tail-migration regression-priority --json
node scripts/run_xtend_tests.js references --json
```

## Ergebnis

`WP-E12-09` ist abgeschlossen. `x-utils` ist nun als Utility-Boundary typisiert, testbar und import-policy-sicher. Das Modul bleibt bewusst kein Custom Element und wird im Catalog als `typed-contract-gated` gefuehrt, bis ein dediziertes Performance-Profil oder eine begruendete Boundary-Ausnahme entschieden ist. Der naechste primaere Epic-12-Pfad ist `WP-E12-10` fuer den Visual Snapshot Automation Contract.
