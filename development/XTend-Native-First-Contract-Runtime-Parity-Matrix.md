# XTend Native-First Contract-to-Runtime Parity Matrix

- Status: `accepted by NFM-WP-12`
- Datum: 3. Juni 2026
- Schema: `xtend.native-first.contract-runtime-parity-matrix.v1`
- Contract: `xtend.native-first.contract-runtime-parity.v1`
- Drift Report: `xtend.native-first.contract-runtime-parity-drift-report.v1`
- Report Schema: `xtend.native-first.contract-runtime-parity-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js contract-runtime-parity --json`
- Source Registry: `development/XTend-Native-First-Contract-Registry.md`

## Status-Legende

| Status | Bedeutung |
|--------|-----------|
| `parity-covered` | Contract, Runtime/Policy, Test, Docs und Report sind vorhanden |
| `parity-covered-with-residual` | Gegenstuecke existieren, aber Scope bleibt fuer Folgepaket offen |
| `contract-only-residual` | Contract ist bewusst noch kein Runtime-Parity-Claim |
| `docs-report-parity` | Governance-, Registry- oder Evidence-Contract ohne Runtime-Code |

## Parity-Matrix

| Parity-ID | Contract-ID | Domain | Owner | Contract-Pfad | Runtime-/Policy-Artefakte | Test-Gate | Docs-Pfad | Report-Schema | Status | Residual | Handoff |
|-----------|-------------|--------|-------|---------------|----------------------------|-----------|-----------|---------------|--------|----------|---------|
| `NFM-CRP-01` | `xtend.component.contract.v2` | `component` | `component-platform-owner` | `development/XTend-Component-Contract-v2.md` | `components/manifest.json`, `xtend-builder/typing/component-contract-v2.js`, `tests/components/component_contract_v2_suite.js` | `component-contract-v2` | `development/XTend-Component-Contract-v2.md` | `xtend.component.contract-report.v2` | `parity-covered` | `none` | `NFM-WP-13` |
| `NFM-CRP-02` | `xtend.rmt.core-format.vnext.v1` | `rmt` | `rmt-language-owner` | `development/XTendRMT-vNext-Core-Format-Contract.md` | `tools/rmt-language/vnext-compiler.js`, `tests/rmt-language/rmt_vnext_compiler_suite.js`, `xtendrmt/rmt.schema.json` | `rmt-vnext-compiler` | `development/XTendRMT-vNext-Core-Format-Contract.md` | `xtend.rmt.vnext-compiler-report.v1` | `parity-covered-with-residual` | `NFM-WP-14 quantifiziert UI-Primitive-Abdeckung gegen Core Domains` | `NFM-WP-14` |
| `NFM-CRP-03` | `xtend.rmt.vnext-scheduler-policy.v1` | `rmt` | `scheduler-owner` | `development/XTendRMT-vNext-Scheduler-Policy-Contract.md` | `tools/rmt-language/vnext-scheduler.js`, `tests/rmt-language/rmt_vnext_scheduler_suite.js`, `tests/rmt-language/fixtures/vnext-scheduler-valid.rmt` | `rmt-vnext-scheduler` | `development/XTendRMT-vNext-Scheduler-Policy-Contract.md` | `xtend.rmt.vnext-scheduler-report.v1` | `parity-covered` | `none` | `NFM-WP-13` |
| `NFM-CRP-04` | `xtend.rmt.vnext-surface-registry.v1` | `rmt` | `surface-runtime-owner` | `development/XTendRMT-vNext-Surface-Registry-Contract.md` | `tools/rmt-language/vnext-surfaces.js`, `tests/rmt-language/rmt_vnext_surface_registry_suite.js`, `tests/rmt-language/fixtures/vnext-surfaces-valid.rmt` | `rmt-vnext-surfaces` | `development/XTendRMT-vNext-Surface-Registry-Contract.md` | `xtend.rmt.vnext-surface-report.v1` | `parity-covered-with-residual` | `NFM-WP-14 prueft Surface- und UI-Maximality fuer App-/Overlay-/Workspace-UIs` | `NFM-WP-14` |
| `NFM-CRP-05` | `xtend.rmt.kernel-trust-hardening.v1` | `kernel` | `kernel-security-owner` | `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` | `tools/rmt-language/kernel-trust-authority.js`, `xtendrmt/rmt-core.esm.js`, `tests/rmt-language/rmt_kernel_trust_authority_suite.js` | `rmt-kernel-trust-authority` | `development/XTendRMT-Kernel-Trust-Hardening-Contract.md` | `xtend.rmt.kernel-trust-authority-report.v1` | `parity-covered` | `none` | `NFM-WP-13` |
| `NFM-CRP-06` | `xtend.rmt.kernel-trusted-dom-runtime.v1` | `kernel` | `kernel-security-owner` | `development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md` | `xtendrmt/rmt-core.esm.js`, `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-runtime.browser.js`, `tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite.js` | `rmt-kernel-trusted-dom-runtime` | `development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md` | `xtend.rmt.kernel-trusted-dom-runtime-report.v1` | `parity-covered` | `none` | `NFM-WP-13` |
| `NFM-CRP-07` | `xtend.rmt.kernel-policy-parity.v1` | `kernel` | `kernel-policy-owner` | `development/XTendRMT-Kernel-Policy-Parity-Contract.md` | `tools/rmt-language/kernel-policy-parity.js`, `xtendrmt/rmt-core.esm.js`, `tests/rmt-language/rmt_kernel_policy_parity_suite.js` | `rmt-kernel-policy-parity` | `development/XTendRMT-Kernel-Policy-Parity-Contract.md` | `xtend.rmt.kernel-policy-parity-report.v1` | `parity-covered` | `none` | `NFM-WP-13` |
| `NFM-CRP-08` | `xtend.rmt.kernel-security-regression.v1` | `kernel` | `kernel-security-owner` | `development/XTendRMT-Kernel-Security-Regression-Contract.md` | `tools/rmt-language/kernel-security-regression.js`, `tests/rmt-language/fixtures/kernel-security-regression-fixtures.json`, `tests/browser/fixtures/rmt-kernel-security-regression-smoke.html` | `rmt-kernel-security-regression` | `development/XTendRMT-Kernel-Security-Regression-Contract.md` | `xtend.rmt.kernel-security-regression-report.v1` | `parity-covered` | `none` | `NFM-WP-13` |
| `NFM-CRP-09` | `xtend.security.trusted-dom-policy.v1` | `security` | `security-owner` | `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md` | `security/trusted-dom-policy.js`, `security/trusted-dom-policy.d.ts`, `catalog/epic13-trusted-dom-boundary.js` | `epic13-trusted-dom-boundary` | `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md` | `xtend.epic13.trusted-dom-boundary-report.v1` | `parity-covered-with-residual` | `NFM-WP-18 prueft browsernahe DOM-Descriptor- und Renderer-Proofs` | `NFM-WP-18` |
| `NFM-CRP-10` | `xtend.security.supply-chain-gate-plan.v1` | `supply-chain` | `supply-chain-owner` | `development/XTend-Supply-Chain-Gate-Plan.md` | `security/supply-chain-gate-policy.js`, `security/supply-chain-gate-policy.d.ts`, `package-lock.json` | `supply-chain` | `development/XTend-Supply-Chain-Gate-Plan.md` | `xtend.security.supply-chain-report.v1` | `parity-covered` | `none` | `NFM-WP-13` |
| `NFM-CRP-11` | `xtend.native-first.contract-registry.v1` | `native-first` | `contract-governance-owner` | `development/XTend-Native-First-Contract-Registry-Contract.md` | `development/XTend-Native-First-Contract-Registry.md`, `tests/native-first/native_first_contract_registry_suite.js`, `package.json` | `contract-registry` | `development/XTend-Native-First-Contract-Registry.md` | `xtend.native-first.contract-registry-report.v1` | `docs-report-parity` | `none` | `NFM-WP-13` |

## Drift Baseline

| Drift-ID | WP-12-Baseline | Gate-Reaktion |
|----------|----------------|---------------|
| `contract-drift` | Core-Format und Trusted-DOM Registry-IDs wurden auf existierende Contract-IDs korrigiert | blockierend bei neuer Abweichung |
| `runtime-drift` | alle Matrix-Zeilen besitzen Runtime-, Tooling-, Manifest- oder Policy-Artefakte | blockierend |
| `test-gate-drift` | alle Matrix-Zeilen besitzen lokale Gates | blockierend |
| `docs-drift` | alle Contract- und Docs-Pfade existieren | blockierend |
| `report-schema-drift` | alle Matrix-Zeilen besitzen Report-Schemas | blockierend |
| `residual-owner-drift` | alle Residuals besitzen Owner und Handoff | blockierend |
| `kernel-boundary-drift` | Kernel-, RMT- und Component-Zeilen bleiben host-neutral | blockierend |
| `supply-chain-drift` | Supply-Chain-Policy, Lockfile und lokaler Gate sind angebunden | blockierend |

## Handoff

- `NFM-WP-13` hat aus dieser Matrix ein Audit Evidence Pack gebaut.
- `NFM-WP-14` muss `NFM-CRP-02`, `NFM-CRP-04` und `NFM-CRP-09` fuer UI-Maximality und DOM-Renderer-Proofs weiter quantifizieren.
- `NFM-WP-20` kann Docs auf registrierte und parity-gepruefte Contract-IDs verlinken.
