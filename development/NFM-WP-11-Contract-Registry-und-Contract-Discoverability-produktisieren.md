# NFM-WP-11 - Contract Registry und Contract Discoverability produktisieren

- Status: `completed`
- Prioritaet: `P0`
- Phase: `Phase 3`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.contract-registry.v1`
- Registry Index: `xtend.native-first.contract-registry-index.v1`
- Drift Report: `xtend.native-first.contract-registry-drift-report.v1`
- Report Schema: `xtend.native-first.contract-registry-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js contract-registry --json`

## Ziel

WP-11 macht Contracts als zentrale Audit- und Produktstaerke auffindbar. Die Native-First-Mission besitzt danach einen maschinenlesbaren Index, mit dem Release-, Audit-, Docs- und Agent-Reports Contract-IDs, Status, Owner, Workpackage, Report-Schema, Gate und Docs-Pfad stabil referenzieren koennen.

## Umgesetzte Artefakte

| Artefakt | Rolle |
|----------|------|
| `development/XTend-Native-First-Contract-Registry-Contract.md` | Contract fuer Registry, Entry Schema, Drift Report und Discoverability-Regeln |
| `development/XTend-Native-First-Contract-Registry.md` | Registry Index fuer Native-First-Contracts und verbundene Component/RMT/Kernel/Security/Supply-Chain/Release-Contracts |
| `tests/native-first/native_first_contract_registry_suite.js` | deterministischer Offline-Gate fuer Registry, Drift-Pflichtfelder, Docs-Pfade, Package-Metadaten und Runner-Anbindung |
| `package.json` | `xtend.nativeFirstContractRegistry` und `npm run test:contract-registry` |
| `scripts/run_xtend_tests.js` | Suite-ID `contract-registry` |

## Registry-Pflichtfelder

Jeder Eintrag in `xtend.native-first.contract-registry-index.v1` muss diese Felder besitzen:

- `contractId`
- `status`
- `owner`
- `workpackage`
- `phase`
- `reportSchema`
- `localGate`
- `docsPath`
- `sourceOfTruth`
- `domain`
- `evidenceRole`

## Inventarisierte Native-First-Contracts

| Contract-ID | Workpackage | Status |
|-------------|-------------|--------|
| `xtend.native-first.mission-source-of-truth.v1` | `NFM-WP-01` | `accepted` |
| `xtend.native-first.browser-primitive-radar.v1` | `NFM-WP-02` | `accepted` |
| `xtend.native-first.primitive-adoption-gate.v1` | `NFM-WP-03` | `accepted` |
| `xtend.native-first.dependency-diet-policy.v1` | `NFM-WP-04` | `accepted` |
| `xtend.native-first.vendor-legacy-replacement.v1` | `NFM-WP-05` | `accepted-with-residuals` |
| `xtend.native-first.ui-primitive-capability.v1` | `NFM-WP-06` | `accepted` |
| `xtend.native-first.overlay-focus-hardening.v1` | `NFM-WP-07` | `accepted` |
| `xtend.native-first.form-navigation-media-hardening.v1` | `NFM-WP-08` | `accepted` |
| `xtend.native-first.framework-leverage-layer.v1` | `NFM-WP-09` | `accepted` |
| `xtend.native-first.market-pattern-parity.v1` | `NFM-WP-10` | `accepted-with-residuals` |
| `xtend.native-first.contract-registry.v1` | `NFM-WP-11` | `accepted` |
| `xtend.native-first.contract-runtime-parity.v1` | `NFM-WP-12` | `accepted` |
| `xtend.native-first.audit-evidence-pack.v1` | `NFM-WP-13` | `accepted` |
| `xtend.native-first.rmt-ui-primitive-gap.v1` | `NFM-WP-14` | `accepted-with-prioritized-gaps` |
| `xtend.native-first.rmt-syntax-growth.v1` | `NFM-WP-15` | `accepted-with-migration-fixtures` |
| `xtend.native-first.rmt-action-effect-data-resource-primitives.v1` | `NFM-WP-16` | `accepted-with-runtime-source-gates` |
| `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1` | `NFM-WP-17` | `accepted-with-recipe-fixtures` |
| `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1` | `NFM-WP-18` | `accepted-with-renderer-proof-fixtures` |
| `xtend.native-first.performance-complexity-bundle-budget-gates.v1` | `NFM-WP-19` | `accepted-with-budget-gates` |

## Verbundene Contract-Domains

| Domain | Verbindung |
|--------|------------|
| `component` | `xtend.component.contract.v2`, Component UX und Capability Matrix |
| `rmt` | RMT vNext Core Format, Scheduler Policy und Surface Registry |
| `kernel` | Kernel Trust Hardening und RMT-Kernel-Neutralitaet |
| `security` | Trusted DOM, Sanitizing, URL-, Import- und HTML-Grenzen |
| `supply-chain` | Dependency Diet Policy und Supply-Chain-Gate-Plan |
| `release-evidence` | RC1 Gate Matrix, Release Reports und Audit Evidence Packs |

## Drift-Regeln

| Drift-ID | Status in WP-11 |
|----------|-----------------|
| `drift-missing-contract-reference` | definiert und gatebar |
| `drift-missing-required-field` | definiert und gatebar |
| `drift-missing-docs-path` | definiert und gatebar |
| `drift-stale-workpackage-status` | definiert und gatebar |
| `drift-stale-report-schema` | definiert und gatebar |
| `drift-runtime-manager-claim` | definiert und gatebar |

## Verification Gates

```bash
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js rmt-ui-primitive-gap --json
node scripts/run_xtend_tests.js rmt-syntax-growth --json
node scripts/run_xtend_tests.js rmt-action-effect-data-resource-primitives --json
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs --json
node scripts/run_xtend_tests.js native-first-budget-gates --json
node scripts/run_xtend_tests.js native-first-docs-authoring --json
node scripts/run_xtend_tests.js native-first-migration-deprecation --json
node scripts/run_xtend_tests.js native-first-mission-handoff --json
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js native-first-market-pattern-parity --json
node scripts/run_xtend_tests.js native-first-framework-leverage --json
node scripts/run_xtend_tests.js native-first-form-navigation-media --json
node scripts/run_xtend_tests.js native-first-overlay-focus --json
node scripts/run_xtend_tests.js references --json
node scripts/run_xtend_tests.js supply-chain --json
```

## Akzeptanz

| Kriterium | Status |
|-----------|--------|
| Registry fuer Contract-ID, Status, Owner, Workpackage, Report-Schema, Gate und Docs-Pfad existiert | `done` |
| Native-First-Contracts bis `NFM-WP-21` sind inventarisiert | `done` |
| Component, RMT, Kernel, Security, Supply Chain und Release Evidence sind verbunden | `done` |
| Drift-Report fuer fehlende oder veraltete Referenzen ist definiert | `done` |
| Registry bleibt Index und keine Runtime-Manager-Flaeche | `done` |
| Lokaler Gate `contract-registry` ist im Runner und Package registriert | `done` |

## Handoff

- `NFM-WP-12` hat Contract-to-Runtime-Parity fuer Kernel, Components, RMT und Supply Chain gegen diese Registry geprueft.
- `NFM-WP-13` hat Audit Evidence Packs aus `reportSchema`, `localGate`, `docsPath` und Parity-Residuals gebuendelt.
- `NFM-WP-14` hat RMT UI Primitive Gap Analysis gegen die registrierten Contract-IDs gatebar gemacht.
- `NFM-WP-15` hat RMT Syntax Growth Decisions und Migration-Fixtures in die Registry aufgenommen.
- `NFM-WP-16` hat RMT Action-, Effect-, DataSource- und Resource-Primitive-Decisions mit Runtime-Source-Gates in die Registry aufgenommen.
- `NFM-WP-17` hat Complete-UI-Recipe-Fixtures mit Smoke-, Golden- und Visual-Evidence-Plaenen in die Registry aufgenommen.
- `NFM-WP-18` hat Renderer-, DOM-Descriptor-, Trusted-DOM- und Browser-Lab-Handoff-Proofs in die Registry aufgenommen.
- `NFM-WP-19` hat Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budget-Gates in die Registry aufgenommen.
- `NFM-WP-20` hat Docs Discoverability und Authoring Guides aus Registry-Eintraegen gatebar gemacht.
- `NFM-WP-21` hat Migration und Deprecation fuer Vendor-, Legacy- und non-native Pfade gatebar gemacht.
