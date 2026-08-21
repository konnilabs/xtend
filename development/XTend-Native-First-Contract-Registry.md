# XTend Native-First Contract Registry

- Status: `accepted by NFM-WP-11`
- Datum: 3. Juni 2026
- Schema: `xtend.native-first.contract-registry-index.v1`
- Contract: `xtend.native-first.contract-registry.v1`
- Entry Contract: `xtend.native-first.contract-registry-entry.v1`
- Report Schema: `xtend.native-first.contract-registry-report.v1`
- Drift Report: `xtend.native-first.contract-registry-drift-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js contract-registry --json`
- Boundary: `registry-is-index-not-runtime-manager`
- Boundary: `drift-report-before-release-evidence`

## Registry Controls

Diese Registry ist der fuehrende Native-First-Index fuer Contract Discoverability. Sie ist bewusst statisch, offline pruefbar und dependency-frei. Runtime-Discovery bleibt bei den jeweiligen Runtime-Flaechen; diese Registry referenziert nur Contract-, Gate-, Docs- und Report-Oberflaechen.

Pflichtfelder je Eintrag:

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

## Native-First Contract Index

| Contract-ID | Status | Owner | Workpackage | Phase | Report-Schema | Gate | Docs-Pfad | Source-of-Truth | Domain | Evidence Role | Runtime Surface / Residual |
|-------------|--------|-------|-------------|-------|---------------|------|-----------|-----------------|--------|---------------|----------------------------|
| `xtend.native-first.mission-source-of-truth.v1` | `accepted` | `native-first-mission-owner` | `NFM-WP-01` | `Phase 0` | `xtend.native-first.mission-source-of-truth-report.v1` | `native-first-mission-roadmap` | `development/XTend-Native-First-Mission-Source-of-Truth-Contract.md` | `mission-source-of-truth` | `native-first` | `source-contract` | Mission Baseline; Runtime-Parity nicht zutreffend |
| `xtend.native-first.browser-primitive-radar.v2` | `accepted` | `browser-primitive-owner` | `NFM-WP-02` | `Phase 1` | `xtend.native-first.browser-primitive-radar-report.v2` | `browser-primitive-radar` | `development/XTend-Native-First-Browser-Primitive-Radar-Contract.md` | `browser-primitive-radar` | `native-first` | `source-contract` | Terminaler Primitive Radar mit atomaren Members und September-Evidence |
| `xtend.native-first.primitive-adoption-gate.v2` | `accepted` | `architecture-governance-owner` | `NFM-WP-03` | `Phase 1` | `xtend.native-first.primitive-adoption-gate-report.v2` | `primitive-adoption-gate` | `development/XTend-Native-Primitive-Adoption-Gate-Contract.md` | `primitive-adoption-gate` | `native-first` | `gate-plan` | Terminales ADR-, Member- und Cross-Engine-Adoption-Gate |
| `xtend.native-first.observatory-intake.v1` | `accepted-internal-intake` | `architecture-governance-owner` | `OBS-2026-09-03` | `Continuous Review` | `xtend.native-first.browser-primitive-radar-report.v2` | `browser-primitive-radar` | `development/XTend-Native-First-Feature-Adoption-Observatory-Contract.md` | `feature-adoption-observatory` | `native-first` | `source-contract` | September-Intake, terminales Review-Ledger, Hypervisor-Evidence und ADR-Grenze |
| `xtend.native-first.dependency-diet-policy.v1` | `accepted` | `supply-chain-owner` | `NFM-WP-04` | `Phase 1` | `xtend.native-first.dependency-diet-policy-report.v1` | `dependency-diet-policy` | `development/XTend-Native-First-Dependency-Diet-Policy-Contract.md` | `dependency-diet-policy` | `supply-chain` | `gate-plan` | Runtime-Dependency-Default und Exit-Plan-Matrix |
| `xtend.native-first.vendor-legacy-replacement.v1` | `accepted-with-residuals` | `dependency-migration-owner` | `NFM-WP-05` | `Phase 1` | `xtend.native-first.vendor-legacy-replacement-report.v1` | `vendor-legacy-replacement` | `development/XTend-Native-First-Vendor-Legacy-Replacement-Contract.md` | `vendor-legacy-replacement` | `supply-chain` | `handoff` | Legacy-/Vendor-Residuals fuer `NFM-WP-21` |
| `xtend.native-first.ui-primitive-capability.v1` | `accepted` | `component-platform-owner` | `NFM-WP-06` | `Phase 2` | `xtend.native-first.ui-primitive-capability-report.v1` | `ui-primitive-capability` | `development/XTend-Native-First-UI-Primitive-Capability-Contract.md` | `ui-primitive-capability-matrix` | `component` | `source-contract` | Owned-, native-backed-, vendor-, legacy- und missing Capability-Klassen |
| `xtend.native-first.overlay-focus-hardening.v1` | `accepted` | `component-overlay-owner` | `NFM-WP-07` | `Phase 2` | `xtend.native-first.overlay-focus-hardening-report.v1` | `native-first-overlay-focus` | `development/XTend-Native-First-Overlay-Focus-Hardening-Contract.md` | `overlay-focus-hardening` | `component` | `runtime-contract` | Overlay, Dialog, Popover, Focus, Inert und Surface Stack |
| `xtend.native-first.form-navigation-media-hardening.v1` | `accepted` | `component-forms-navigation-owner` | `NFM-WP-08` | `Phase 2` | `xtend.native-first.form-navigation-media-hardening-report.v1` | `native-first-form-navigation-media` | `development/XTend-Native-First-Form-Navigation-Media-Hardening-Contract.md` | `form-navigation-media-hardening` | `component` | `runtime-contract` | Forms, Selection, Navigation, list-like Display und Media |
| `xtend.native-first.framework-leverage-layer.v1` | `accepted` | `framework-leverage-owner` | `NFM-WP-09` | `Phase 2` | `xtend.native-first.framework-leverage-layer-report.v1` | `native-first-framework-leverage` | `development/XTend-Native-First-Framework-Leverage-Layer-Contract.md` | `framework-leverage-layer` | `component` | `source-contract` | Theme, State, Events, Slots, Scheduler und Diagnostics |
| `xtend.native-first.market-pattern-parity.v1` | `accepted-with-residuals` | `product-parity-owner` | `NFM-WP-10` | `Phase 2` | `xtend.native-first.market-pattern-parity-report.v1` | `native-first-market-pattern-parity` | `development/XTend-Native-First-Market-Pattern-Parity-Contract.md` | `market-pattern-parity` | `native-first` | `handoff` | Data Display und Command/Search bleiben blockierte Claims |
| `xtend.native-first.contract-registry.v1` | `accepted` | `contract-governance-owner` | `NFM-WP-11` | `Phase 3` | `xtend.native-first.contract-registry-report.v1` | `contract-registry` | `development/XTend-Native-First-Contract-Registry-Contract.md` | `contract-registry` | `native-first` | `source-contract` | Registry-Index; keine Runtime-Manager-Rolle |
| `xtend.native-first.contract-runtime-parity.v1` | `accepted` | `contract-parity-owner` | `NFM-WP-12` | `Phase 3` | `xtend.native-first.contract-runtime-parity-report.v1` | `contract-runtime-parity` | `development/XTend-Native-First-Contract-Runtime-Parity-Contract.md` | `contract-runtime-parity` | `native-first` | `gate-plan` | Contract-to-Runtime-Parity fuer Kernel, Components, RMT und Supply Chain |
| `xtend.native-first.audit-evidence-pack.v1` | `accepted` | `audit-evidence-owner` | `NFM-WP-13` | `Phase 3` | `xtend.native-first.audit-evidence-pack-report.v1` | `native-first-evidence-pack` | `development/XTend-Native-First-Audit-Evidence-Pack-Contract.md` | `audit-evidence-pack` | `native-first` | `release-pack` | Release-Owner-Pack fuer Contracts, Security, Dependencies, Conditional Network und Redaction |
| `xtend.native-first.rmt-ui-primitive-gap.v1` | `accepted-with-prioritized-gaps` | `rmt-ui-authoring-owner` | `NFM-WP-14` | `Phase 4` | `xtend.native-first.rmt-ui-primitive-gap-report.v1` | `rmt-ui-primitive-gap` | `development/XTend-Native-First-RMT-UI-Primitive-Gap-Contract.md` | `rmt-ui-primitive-gap-analysis` | `rmt` | `gate-plan` | RMT UI Primitive Gap Analysis fuer App-Authoring ohne manuelle Host-Shell |
| `xtend.native-first.rmt-syntax-growth.v1` | `accepted-with-migration-fixtures` | `rmt-language-owner` | `NFM-WP-15` | `Phase 4` | `xtend.native-first.rmt-syntax-growth-report.v1` | `rmt-syntax-growth` | `development/XTend-Native-First-RMT-Syntax-Growth-Contract.md` | `rmt-syntax-growth-decision-matrix` | `rmt` | `gate-plan` | RMT Syntax Growth Decisions mit positiven, negativen und Migration-Fixtures |
| `xtend.native-first.rmt-action-effect-data-resource-primitives.v1` | `accepted-with-runtime-source-gates` | `rmt-resource-action-owner` | `NFM-WP-16` | `Phase 4` | `xtend.native-first.rmt-action-effect-data-resource-primitives-report.v1` | `rmt-action-effect-data-resource-primitives` | `development/XTend-Native-First-RMT-Action-Effect-Data-Resource-Primitives-Contract.md` | `rmt-action-effect-data-resource-primitives-matrix` | `rmt` | `gate-plan` | RMT Action-, Effect-, DataSource- und Resource-Primitives mit Runtime-Source-Gates |
| `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1` | `accepted-with-recipe-fixtures` | `rmt-recipe-owner` | `NFM-WP-17` | `Phase 4` | `xtend.native-first.rmt-complete-ui-recipe-fixtures-report.v1` | `rmt-complete-ui-recipes` | `development/XTend-Native-First-RMT-Complete-UI-Recipe-Fixtures-Contract.md` | `rmt-complete-ui-recipe-matrix` | `rmt` | `gate-plan` | Complete-UI-Recipe-Fixtures mit Smoke-, Golden- und Visual-Evidence-Plaenen |
| `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1` | `accepted-with-renderer-proof-fixtures` | `rmt-renderer-security-owner` | `NFM-WP-18` | `Phase 4` | `xtend.native-first.rmt-renderer-dom-descriptor-proofs-report.v1` | `rmt-renderer-dom-descriptor-proofs` | `development/XTend-Native-First-RMT-Renderer-DOM-Descriptor-Proofs-Contract.md` | `rmt-renderer-dom-descriptor-proof-matrix` | `rmt` | `gate-plan` | DOM Descriptor Renderer, Trusted-DOM, Sink-Refusal und Browser-Lab-Handoff-Proofs |
| `xtend.native-first.performance-complexity-bundle-budget-gates.v1` | `accepted-with-budget-gates` | `performance-owner` | `NFM-WP-19` | `Phase 5` | `xtend.native-first.performance-complexity-bundle-budget-gates-report.v1` | `native-first-budget-gates` | `development/XTend-Native-First-Performance-Complexity-Bundle-Budget-Gates-Contract.md` | `performance-complexity-bundle-budget-gates` | `native-first` | `gate-plan` | Performance-, Complexity-, Bundle-, Browser-Smoke- und Visual-Evidence-Budget-Gates |
| `xtend.native-first.docs-authoring-guides.v1` | `accepted-with-authoring-guides` | `docs-authoring-owner` | `NFM-WP-20` | `Phase 5` | `xtend.native-first.docs-authoring-guides-report.v1` | `native-first-docs-authoring` | `development/XTend-Native-First-Docs-Authoring-Guides-Contract.md` | `docs-authoring-guides` | `native-first` | `docs-surface` | Oeffentliche Native-First Authoring-, RMT-Recipe- und Release-Review-Guides |
| `xtend.native-first.migration-deprecation-plan.v1` | `accepted-with-migration-deprecation-plan` | `migration-owner` | `NFM-WP-21` | `Phase 5` | `xtend.native-first.migration-deprecation-report.v1` | `native-first-migration-deprecation` | `development/XTend-Native-First-Migration-Deprecation-Plan-Contract.md` | `migration-deprecation-plan` | `native-first` | `migration-plan` | Migration-, Deprecation-, Containment- und Guardrail-Plan fuer Vendor-, Legacy- und non-native Pfade |
| `xtend.native-first.mission-handoff.v1` | `accepted-with-mission-handoff` | `native-first-mission-owner` | `NFM-WP-22` | `Phase 5` | `xtend.native-first.mission-handoff-report.v1` | `native-first-mission-handoff` | `development/XTend-Native-First-Mission-Handoff-Contract.md` | `mission-handoff` | `native-first` | `final-handoff` | Mission Status, Residuals und naechste Epic-Grenze |

## Cross-Domain Source Contracts

| Contract-ID | Status | Owner | Workpackage | Phase | Report-Schema | Gate | Docs-Pfad | Source-of-Truth | Domain | Evidence Role | Registry-Verbindung |
|-------------|--------|-------|-------------|-------|---------------|------|-----------|-----------------|--------|---------------|---------------------|
| `xtend.component.contract.v2` | `accepted-with-residuals` | `component-platform-owner` | `WP-E10-03` | `Component Platform` | `xtend.component.contract-v2-report.v1` | `component-contract-v2` | `development/XTend-Component-Contract-v2.md` | `component-contract-v2` | `component` | `source-contract` | Owned-Component-Claims und Capability-Matrix |
| `xtend.rmt.core-format.vnext.v1` | `parity-covered-with-residual` | `rmt-language-owner` | `WP-E15-03` | `RMT vNext` | `xtend.rmt.vnext-compiler-report.v1` | `rmt-vnext-compiler` | `development/XTendRMT-vNext-Core-Format-Contract.md` | `rmt-core-format` | `rmt` | `runtime-contract` | WP-12 mapped Core Format auf Compiler-Gate; WP-14 quantifiziert UI-Primitive-Abdeckung |
| `xtend.rmt.vnext-scheduler-policy.v1` | `accepted` | `scheduler-owner` | `WP-E15-07` | `RMT vNext` | `xtend.rmt.vnext-scheduler-policy-report.v1` | `rmt-vnext-scheduler` | `development/XTendRMT-vNext-Scheduler-Policy-Contract.md` | `rmt-scheduler-policy` | `rmt` | `runtime-contract` | Scheduler-Lanes und Framework-Hebel |
| `xtend.rmt.vnext-surface-registry.v1` | `parity-covered-with-residual` | `surface-runtime-owner` | `WP-E16-03` | `RMT vNext` | `xtend.rmt.vnext-surface-report.v1` | `rmt-vnext-surfaces` | `development/XTendRMT-vNext-Surface-Registry-Contract.md` | `rmt-surface-registry` | `rmt` | `runtime-contract` | Runtime-Registry bleibt ausserhalb dieser Contract Registry; WP-14 prueft UI-Maximality |
| `xtend.rmt.kernel-trust-hardening.v1` | `accepted-with-residuals` | `kernel-security-owner` | `WP-RKSH-00` | `Kernel Security` | `xtend.rmt.kernel-trust-hardening-report.v1` | `rmt-kernel-trust-hardening` | `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` | `kernel-trust-hardening` | `kernel` | `source-contract` | Kernel Trust und Policy-Parity fuer WP-12 |
| `xtend.security.trusted-dom-policy.v1` | `parity-covered-with-residual` | `security-owner` | `ER-WP-29` | `Security` | `xtend.epic13.trusted-dom-boundary-report.v1` | `epic13-trusted-dom-boundary` | `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md` | `trusted-dom-policy` | `security` | `gate-plan` | DOM-, URL-, HTML- und Sanitizing-Grenzen; WP-18 prueft Renderer-Proofs |
| `xtend.security.supply-chain-gate-plan.v1` | `accepted` | `supply-chain-owner` | `ER-WP-30` | `Security` | `xtend.security.supply-chain-gate-report.v1` | `supply-chain` | `development/XTend-Supply-Chain-Gate-Plan.md` | `supply-chain-gate-plan` | `supply-chain` | `gate-plan` | Dependency Diet, Audit und Release-Evidence |
| `xtend.epic13.rc1-gate-matrix.v1` | `ready` | `release-owner` | `WP-E13-13` | `Release Evidence` | `xtend.epic13.rc1-gate-matrix-report.v1` | `release:full-report` | `development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md` | `rc1-gate-matrix` | `release-evidence` | `release-pack` | Audit Evidence Pack und Release Owner Handoff |

## Drift Report Baseline

| Drift-Klasse | Aktuelle WP-11-Baseline | Gate-Reaktion |
|--------------|--------------------------|---------------|
| `drift-missing-contract-reference` | `none-known` fuer Native-First-Contracts `NFM-WP-01` bis `NFM-WP-22`; das kontinuierliche Feature Adoption Observatory `OBS-2026-09-03` ist aktuell registriert | blockierend |
| `drift-missing-required-field` | `none-known` | blockierend |
| `drift-missing-docs-path` | `none-known` | blockierend |
| `drift-stale-workpackage-status` | `none-known`; `NFM-WP-13` ist abgeschlossen; `NFM-WP-14`, `NFM-WP-15`, `NFM-WP-16`, `NFM-WP-17`, `NFM-WP-18`, `NFM-WP-19`, `NFM-WP-20`, `NFM-WP-21` und `NFM-WP-22` sind abgeschlossen | blockierend |
| `drift-stale-report-schema` | `none-known` | blockierend |
| `drift-runtime-manager-claim` | `none-known`; Boundary `registry-is-index-not-runtime-manager` aktiv | blockierend |

## Release- und Audit-Referenz

Release- und Audit-Reports referenzieren Contract-IDs aus dieser Registry mit diesem Mindestdatensatz:

```json
{
  "schema": "xtend.native-first.contract-registry-report.v1",
  "contractId": "xtend.native-first.contract-registry.v1",
  "status": "accepted",
  "owner": "contract-governance-owner",
  "workpackage": "NFM-WP-11",
  "localGate": "node scripts/run_xtend_tests.js contract-registry --json",
  "docsPath": "development/XTend-Native-First-Contract-Registry-Contract.md",
  "driftReport": "xtend.native-first.contract-registry-drift-report.v1"
}
```

## Handoff

- Die historische Evidence-Pack-Baseline umfasste `NFM-WP-01` bis `NFM-WP-13`; die Registry fuehrt diese Linie heute bis zum abgeschlossenen `NFM-WP-22` fort.
- `NFM-WP-12` hat Contract-to-Runtime-Parity aus dieser Registry abgeleitet und Core-Format-/Trusted-DOM-ID-Drift korrigiert.
- `NFM-WP-13` hat Audit Evidence Packs anhand von `reportSchema`, `localGate`, `docsPath`, Parity-Residuals, Conditional-Network-Status und Redaction-Regeln gebuendelt.
- `NFM-WP-14` hat `xtend.native-first.rmt-ui-primitive-gap.v1` als Phase-4-Gate fuer RMT UI Primitive Gaps registriert.
- `NFM-WP-15` hat `xtend.native-first.rmt-syntax-growth.v1` mit Gate `rmt-syntax-growth` und Migration-Fixtures registriert.
- `NFM-WP-16` hat `xtend.native-first.rmt-action-effect-data-resource-primitives.v1` mit Gate `rmt-action-effect-data-resource-primitives` und Runtime-Source-Gates registriert.
- `NFM-WP-17` hat `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1` mit Gate `rmt-complete-ui-recipes` und Recipe-Fixtures registriert.
- `NFM-WP-18` hat `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1` mit Gate `rmt-renderer-dom-descriptor-proofs` und Renderer-/Trusted-DOM-Proof-Fixtures registriert.
- `NFM-WP-19` hat `xtend.native-first.performance-complexity-bundle-budget-gates.v1` mit Gate `native-first-budget-gates` und Budget-Fixtures registriert.
- `NFM-WP-20` hat `xtend.native-first.docs-authoring-guides.v1` mit Gate `native-first-docs-authoring` und oeffentlichen Native-First Authoring Guides registriert.
- `NFM-WP-21` hat `xtend.native-first.migration-deprecation-plan.v1` mit Gate `native-first-migration-deprecation` und Migration-/Deprecation-Fixtures registriert.
- `NFM-WP-22` hat `xtend.native-first.mission-handoff.v1` mit Gate `native-first-mission-handoff`, final-handoff Evidence Role und Next-Epic-Boundary registriert.
