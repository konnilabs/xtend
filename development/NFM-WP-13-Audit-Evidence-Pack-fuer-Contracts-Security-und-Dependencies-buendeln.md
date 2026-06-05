# NFM-WP-13 - Audit Evidence Pack fuer Contracts, Security und Dependencies buendeln

- Status: `completed`
- Prioritaet: `P1`
- Phase: `Phase 3`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.audit-evidence-pack.v1`
- Evidence Item Schema: `xtend.native-first.audit-evidence-item.v1`
- Evidence Pack Index: `xtend.native-first.audit-evidence-pack-index.v1`
- Redaction Policy: `xtend.native-first.diagnostic-redaction-policy.v1`
- Report Schema: `xtend.native-first.audit-evidence-pack-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-evidence-pack --json`

## Ziel

WP-13 macht Security und Auditierbarkeit als Native-First-USP reviewbar. Das Paket fasst Contract Registry, Contract-to-Runtime-Parity, Trusted DOM, Kernel Trust, Supply Chain, Dependency Diet, Conditional Network Status und Release-Artefakte in einem Audit Evidence Pack zusammen.

## Umgesetzte Artefakte

| Artefakt | Rolle |
|----------|------|
| `development/XTend-Native-First-Audit-Evidence-Pack-Contract.md` | Contract fuer Evidence-Item-Felder, Redaction Policy, Source-Gates und Offline-Boundary |
| `development/XTend-Native-First-Audit-Evidence-Pack.md` | Reviewbarer Pack-Index fuer Contract-, Security-, Dependency-, Conditional-Network- und Release-Evidence |
| `tests/native-first/native_first_audit_evidence_pack_suite.js` | deterministischer Offline-Gate fuer Evidence-Zeilen, Artefaktpfade, Report-Schemas, Redaction-Regeln, Registry- und Handoff-Status |
| `package.json` | `xtend.nativeFirstAuditEvidencePack` und `npm run test:native-first-evidence-pack` |
| `scripts/run_xtend_tests.js` | Suite-ID `native-first-evidence-pack` |

## Abgedeckte Evidence-Klassen

| Klasse | Evidence-IDs |
|--------|--------------|
| `contract-registry` | `NFM-AEP-01` |
| `contract-parity` | `NFM-AEP-02` |
| `dependency` | `NFM-AEP-03` |
| `supply-chain` | `NFM-AEP-04` |
| `security` | `NFM-AEP-05` bis `NFM-AEP-09` |
| `conditional-network` | `NFM-AEP-10`, `NFM-AEP-11` |
| `release-pack` | `NFM-AEP-12`, `NFM-AEP-13` |
| `redaction-policy` | `NFM-AEP-14` |

## Redaction-Regeln

Das Pack definiert `xtend.native-first.diagnostic-redaction-policy.v1`. Release-faehige Diagnostics muessen Secrets, Credentials, Cookies, rohe Env-Werte, private Pfade und rohe nicht vertrauenswuerdige HTML-Fragmente redigieren. Contract-ID, Gate-ID, Report-Schema, Owner, Workpackage, Status, Residual, Diagnostic-Code, Severity und repo-relative Artefaktpfade bleiben erhalten.

## Verification Gates

```bash
node scripts/run_xtend_tests.js native-first-evidence-pack --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json
node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json
node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json
node scripts/run_xtend_tests.js rmt-kernel-security-regression --json
node scripts/run_xtend_tests.js epic13-trusted-dom-boundary --json
node scripts/run_xtend_tests.js epic13-conditional-network-evidence --json
node scripts/run_xtend_tests.js epic13-conditional-network-evidence-ci --json
node scripts/run_xtend_tests.js epic13-release-report-pack-dry-run-evidence --json
node scripts/run_xtend_tests.js epic13-rc1-gate-matrix-ci-handoff --json
node scripts/run_xtend_tests.js references --json
```

## Akzeptanz

| Kriterium | Status |
|-----------|--------|
| Contract Registry Report ist im Evidence Pack enthalten | `done` |
| Trusted-DOM-, Kernel-Trust- und Supply-Chain-Evidence sind gebuendelt | `done` |
| Dependency Diet und Conditional Network Status sind sichtbar | `done` |
| Redaction-Regeln fuer Diagnostics sind definiert | `done` |
| Release Owner kann Security-, Contract- und Dependency-Zustand aus einem Pack bewerten | `done` |

## Handoff

- `NFM-WP-13` ist abgeschlossen und liefert `xtend.native-first.audit-evidence-pack.v1`.
- `NFM-WP-14` kann jetzt RMT/UI-Primitive-Residuals aus Parity- und Trusted-DOM-Evidence quantifizieren.
- `NFM-WP-20` kann Docs Discoverability auf Registry-, Parity- und Evidence-Pack-Quellen aufbauen.
- `NFM-WP-22` kann Mission-Handoff und naechste Epic-Grenze aus Pack-Status, Conditional-Network-Status und Residuals bewerten.
