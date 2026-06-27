# XTend Native-First Audit Evidence Pack

- Status: `accepted by NFM-WP-13`
- Datum: 3. Juni 2026
- Schema: `xtend.native-first.audit-evidence-pack-index.v1`
- Contract: `xtend.native-first.audit-evidence-pack.v1`
- Evidence Item Schema: `xtend.native-first.audit-evidence-item.v1`
- Redaction Policy: `xtend.native-first.diagnostic-redaction-policy.v1`
- Report Schema: `xtend.native-first.audit-evidence-pack-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-evidence-pack --json`
- Source Registry: `development/XTend-Native-First-Contract-Registry.md`
- Source Parity Matrix: `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md`

## Review-Zweck

Dieses Pack ist die Release-Owner-Ansicht auf Contract-, Security- und Dependency-Zustand der Native-First-Mission. Es zeigt, welche Quellen ein Review lesen muss, welcher lokale Gate die Quelle prueft, welche Report-Schemas erwartbar sind und welche Residuals bewusst in Folgepakete laufen.

## Pflichtfelder

- `evidenceId`
- `evidenceType`
- `sourceContract`
- `owner`
- `localGate`
- `reportSchema`
- `artifacts`
- `status`
- `redactionClass`
- `releaseOwnerUse`
- `residual`
- `nextHandoff`

## Evidence Index

| Evidence-ID | Evidence Type | Source Contract | Owner | Local Gate | Report Schema | Artifacts | Status | Redaction Class | Release Owner Use | Residual | Handoff |
|-------------|---------------|-----------------|-------|------------|---------------|-----------|--------|-----------------|-------------------|----------|---------|
| `NFM-AEP-01` | `contract-registry` | `xtend.native-first.contract-registry.v1` | `contract-governance-owner` | `contract-registry` | `xtend.native-first.contract-registry-report.v1` | `development/XTend-Native-First-Contract-Registry.md`, `development/XTend-Native-First-Contract-Registry-Contract.md`, `tests/native-first/native_first_contract_registry_suite.js`, `package.json` | `local-passed` | `public-contract` | Contract-IDs, Owner, Gates und Report-Schemas bewerten | `none` | `NFM-WP-20` |
| `NFM-AEP-02` | `contract-parity` | `xtend.native-first.contract-runtime-parity.v1` | `contract-parity-owner` | `contract-runtime-parity` | `xtend.native-first.contract-runtime-parity-report.v1` | `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md`, `development/XTend-Native-First-Contract-Runtime-Parity-Contract.md`, `tests/native-first/native_first_contract_runtime_parity_suite.js`, `package.json` | `parity-passed-with-residual` | `public-contract` | Contract-, Runtime-, Test-, Docs- und Report-Gegenstuecke bewerten | `NFM-WP-14, NFM-WP-18` | `NFM-WP-14` |
| `NFM-AEP-03` | `dependency` | `xtend.native-first.dependency-diet-policy.v1` | `supply-chain-owner` | `supply-chain` | `xtend.native-first.dependency-diet-policy-report.v1` | `development/XTend-Native-First-Dependency-Diet-Policy-Contract.md`, `development/XTend-Native-First-Dependency-Exit-Plan-Matrix.md`, `development/NFM-WP-04-Dependency-Diet-Policy-und-Runtime-Dependency-Exit-Plaene-erstellen.md`, `package-lock.json` | `local-passed` | `dependency-evidence` | Runtime-Dependency-Default, Exit-Plaene und Diet-Regeln pruefen | `workspace-SBOM bleibt conditional-network Evidence` | `NFM-WP-19` |
| `NFM-AEP-04` | `supply-chain` | `xtend.security.supply-chain-gate-plan.v1` | `supply-chain-owner` | `supply-chain` | `xtend.security.supply-chain-report.v1` | `development/XTend-Supply-Chain-Gate-Plan.md`, `security/supply-chain-gate-policy.js`, `security/supply-chain-gate-policy.d.ts`, `package-lock.json`, `.xtend-test-results/xtend-npm-audit-report.json` | `local-passed` | `dependency-evidence` | License-, Vulnerability- und Release-Supply-Chain-Status bewerten | `npm sbom ist conditional und publish-boundary-gesteuert` | `NFM-WP-22` |
| `NFM-AEP-05` | `security` | `xtend.rmt.kernel-trust-hardening.v1` | `kernel-security-owner` | `rmt-kernel-trust-authority` | `xtend.rmt.kernel-trust-authority-report.v1` | `development/XTendRMT-Kernel-Trust-Hardening-Contract.md`, `tools/rmt-language/kernel-trust-authority.js`, `xtendrmt/rmt-core.esm.js`, `tests/rmt-language/rmt_kernel_trust_authority_suite.js` | `local-passed` | `security-sensitive` | Kernel Trust, Panic/Recovery und Trust Authority pruefen | `none` | `NFM-WP-22` |
| `NFM-AEP-06` | `security` | `xtend.rmt.kernel-trusted-dom-runtime.v1` | `kernel-security-owner` | `rmt-kernel-trusted-dom-runtime` | `xtend.rmt.kernel-trusted-dom-runtime-report.v1` | `development/XTendRMT-Kernel-Trusted-DOM-Runtime-Contract.md`, `xtendrmt/rmt-core.esm.js`, `xtendrmt/rmt-runtime.esm.js`, `xtendrmt/rmt-runtime.browser.js`, `tests/rmt-language/rmt_kernel_trusted_dom_runtime_suite.js` | `local-passed` | `security-sensitive` | Trusted-DOM-Runtime Boundary im RMT-Kernel pruefen | `none` | `NFM-WP-22` |
| `NFM-AEP-07` | `security` | `xtend.rmt.kernel-policy-parity.v1` | `kernel-policy-owner` | `rmt-kernel-policy-parity` | `xtend.rmt.kernel-policy-parity-report.v1` | `development/XTendRMT-Kernel-Policy-Parity-Contract.md`, `tools/rmt-language/kernel-policy-parity.js`, `xtendrmt/rmt-core.esm.js`, `tests/rmt-language/rmt_kernel_policy_parity_suite.js` | `local-passed` | `security-sensitive` | Kernel Policies gegen Runtime-Verhalten pruefen | `none` | `NFM-WP-22` |
| `NFM-AEP-08` | `security` | `xtend.rmt.kernel-security-regression.v1` | `kernel-security-owner` | `rmt-kernel-security-regression` | `xtend.rmt.kernel-security-regression-report.v1` | `development/XTendRMT-Kernel-Security-Regression-Contract.md`, `tools/rmt-language/kernel-security-regression.js`, `tests/rmt-language/fixtures/kernel-security-regression-fixtures.json`, `tests/browser/fixtures/rmt-kernel-security-regression-smoke.html` | `local-passed` | `security-sensitive` | Regressionen fuer Kernel-Security-Fixtures pruefen | `none` | `NFM-WP-22` |
| `NFM-AEP-09` | `security` | `xtend.security.trusted-dom-policy.v1` | `security-owner` | `epic13-trusted-dom-boundary` | `xtend.epic13.trusted-dom-boundary-report.v1` | `development/XTend-Trusted-DOM-und-Sanitizing-Policy.md`, `development/XTend-Epic13-Trusted-DOM-Boundary-Contract.md`, `security/trusted-dom-policy.js`, `tests/browser/fixtures/epic13-trusted-dom-boundary-smoke.html` | `parity-passed-with-residual` | `security-sensitive` | HTML-, URL-, Sanitizing- und RMT-HTML-Grenzen bewerten | `NFM-WP-18 prueft Renderer-Proofs` | `NFM-WP-18` |
| `NFM-AEP-10` | `conditional-network` | `xtend.epic13.conditional-network-evidence.v1` | `release-owner` | `epic13-conditional-network-evidence` | `xtend.epic13.conditional-network-evidence-report.v1` | `development/XTend-Epic13-Conditional-Network-Evidence-Contract.md`, `docs/conditional-network-evidence.md`, `catalog/epic13-conditional-network-evidence.js`, `.xtend-test-results/xtend-conditional-network-evidence-report.json` | `conditional-network-deferred` | `network-conditional` | Audit/SBOM-Status, Owner-Deferral und Publish Boundary bewerten | `network execution bleibt conditional` | `NFM-WP-22` |
| `NFM-AEP-11` | `conditional-network` | `xtend.epic13.conditional-network-evidence-ci.v1` | `release-owner` | `epic13-conditional-network-evidence-ci` | `xtend.epic13.conditional-network-evidence-ci-report.v1` | `development/XTend-Epic13-Conditional-Network-Evidence-CI-Contract.md`, `docs/conditional-network-evidence-ci.md`, `catalog/epic13-conditional-network-evidence-ci.js`, `.xtend-test-results/xtend-epic13-conditional-network-evidence-ci-report.json` | `ci-planned` | `network-conditional` | CI-Artefaktnamen und publish-relevante Conditional-Network-Evidence bewerten | `CI execution owner-controlled` | `NFM-WP-22` |
| `NFM-AEP-12` | `release-pack` | `xtend.epic13.release-report-pack-dry-run-evidence.v1` | `release-owner` | `epic13-release-report-pack-dry-run-evidence` | `xtend.epic13.release-report-pack-dry-run-evidence-report.v1` | `development/XTend-Epic13-Release-Report-und-Pack-Dry-Run-Evidence.md`, `docs/release-report-pack-dry-run-evidence.md`, `catalog/epic13-release-report-pack-dry-run-evidence.js`, `.xtend-test-results/xtend-pack-dry-run.json`, `.xtend-test-results/xtend-package-export-lock-report.json` | `release-owner-review-ready` | `release-evidence` | Release Report, Pack Dry Run und Export Lock bewerten | `publish bleibt private bis Owner Acceptance` | `NFM-WP-22` |
| `NFM-AEP-13` | `release-pack` | `xtend.epic13.rc1-gate-matrix-ci-handoff.v1` | `release-owner` | `epic13-rc1-gate-matrix-ci-handoff` | `xtend.epic13.rc1-gate-matrix-ci-handoff-report.v1` | `development/XTend-Epic13-RC1-Gate-Matrix-und-CI-Handoff.md`, `docs/rc1-gate-matrix-ci-handoff.md`, `catalog/epic13-rc1-gate-matrix-ci-handoff.js`, `.xtend-test-results/xtend-epic13-rc1-gate-matrix-ci-handoff-report.json` | `release-owner-review-ready` | `release-evidence` | RC1-Gate-Matrix, CI-Lanes und Owner-Handoff bewerten | `publish bleibt private bis Owner Acceptance` | `NFM-WP-22` |
| `NFM-AEP-14` | `redaction-policy` | `xtend.native-first.diagnostic-redaction-policy.v1` | `audit-evidence-owner` | `native-first-evidence-pack` | `xtend.native-first.audit-evidence-pack-report.v1` | `development/XTend-Native-First-Audit-Evidence-Pack-Contract.md`, `development/XTend-Native-First-Audit-Evidence-Pack.md`, `tests/native-first/native_first_audit_evidence_pack_suite.js`, `package.json` | `redaction-policy-ready` | `diagnostic-redacted` | Freigabefaehige Diagnostics ohne Secrets, Credentials oder private Pfade pruefen | `none` | `NFM-WP-20` |

## Redaction Checklist

Vor dem Teilen eines Evidence Packs ausserhalb lokaler Entwicklungskontexte muessen diese Felder redigiert werden:

- `token`
- `secret`
- `password`
- `authorization`
- `cookie`
- `set-cookie`
- `npm_token`
- credential-haltige URLs mit eingebetteten Credentials
- rohe Environment-Werte
- rohe nicht vertrauenswuerdige HTML-Fragmente
- absolute lokale Pfade
- private Stacktrace-Pfade

Diese Felder muessen erhalten bleiben:

- `contractId`
- `gateId`
- `reportSchema`
- `owner`
- `workpackage`
- `status`
- `residual`
- `diagnosticCode`
- `severity`
- repo-relative Artefaktpfade

## Conditional Network Status

| Quelle | Lokaler Default | Release-Regel |
|--------|-----------------|---------------|
| `npm audit --audit-level=moderate` | `defer-with-owner-reason` oder vorhandenes Artefakt | Publish braucht ausgefuehrte Evidence oder Owner-Deferral |
| `npm sbom --sbom-format=cyclonedx --json` | `defer-with-owner-reason` oder vorhandenes Artefakt | Publish braucht ausgefuehrte Evidence oder Owner-Deferral |
| `conditional-network:evidence` | CI-/Owner-kontrolliert | Release Owner prueft Artefaktnamen und Deferral-Grund |

## Handoff

- `NFM-WP-13` buendelt Security-, Contract- und Dependency-Zustand in diesem Pack.
- `NFM-WP-14` nutzt die RMT-/UI-Residuals aus `NFM-AEP-02` und `NFM-AEP-09`.
- `NFM-WP-20` kann Docs Discoverability auf Registry-, Parity- und Evidence-Pack-Links ausrichten.
- `NFM-WP-22` kann Mission-Handoff und naechste Epic-Grenze anhand dieses Release-Owner-Pack-Status bewerten.
