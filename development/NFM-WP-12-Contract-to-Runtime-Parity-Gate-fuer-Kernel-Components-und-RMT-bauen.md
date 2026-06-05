# NFM-WP-12 - Contract-to-Runtime-Parity Gate fuer Kernel, Components und RMT bauen

- Status: `completed`
- Prioritaet: `P0`
- Phase: `Phase 3`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Contract: `xtend.native-first.contract-runtime-parity.v1`
- Matrix Schema: `xtend.native-first.contract-runtime-parity-matrix.v1`
- Drift Report: `xtend.native-first.contract-runtime-parity-drift-report.v1`
- Report Schema: `xtend.native-first.contract-runtime-parity-report.v1`
- Local Gate: `node scripts/run_xtend_tests.js contract-runtime-parity --json`

## Ziel

WP-12 verhindert, dass Contracts nur Papier bleiben. Das Paket verbindet Contract-Claims mit Runtime-, Tooling-, Manifest-, Policy-, Test-, Docs- und Report-Gegenstuecken. Residuals bleiben erlaubt, muessen aber Owner, Status und Handoff besitzen.

## Umgesetzte Artefakte

| Artefakt | Rolle |
|----------|------|
| `development/XTend-Native-First-Contract-Runtime-Parity-Contract.md` | Contract fuer Parity-Pflichtfelder, Drift-Klassen und Bewertungsmodell |
| `development/XTend-Native-First-Contract-Runtime-Parity-Matrix.md` | Matrix fuer Component-, RMT-, Kernel-, Security-, Supply-Chain- und Native-First-Parity |
| `tests/native-first/native_first_contract_runtime_parity_suite.js` | deterministischer Offline-Gate fuer Parity-Zeilen, Artefaktpfade, Gates, Report-Schemas, Residuals und Registry-Korrekturen |
| `package.json` | `xtend.nativeFirstContractRuntimeParity` und `npm run test:contract-runtime-parity` |
| `scripts/run_xtend_tests.js` | Suite-ID `contract-runtime-parity` |

## Parity-Pflichtfelder

- `parityId`
- `contractId`
- `domain`
- `owner`
- `contractPath`
- `runtimeArtifacts`
- `testGate`
- `docsPath`
- `reportSchema`
- `parityStatus`
- `residual`
- `nextHandoff`

## Abgedeckte Domains

| Domain | Parity-Zeilen |
|--------|---------------|
| `component` | `NFM-CRP-01` Component Contract v2 |
| `rmt` | `NFM-CRP-02` Core Format, `NFM-CRP-03` Scheduler, `NFM-CRP-04` Surface Registry |
| `kernel` | `NFM-CRP-05` Trust Authority, `NFM-CRP-06` Trusted DOM Runtime, `NFM-CRP-07` Policy Parity, `NFM-CRP-08` Security Regression |
| `security` | `NFM-CRP-09` Trusted DOM/Sanitizing |
| `supply-chain` | `NFM-CRP-10` Supply-Chain Gate Plan |
| `native-first` | `NFM-CRP-11` Contract Registry |

## Drift-Klassen

| Drift-ID | Status |
|----------|--------|
| `contract-drift` | definiert und gatebar |
| `runtime-drift` | definiert und gatebar |
| `test-gate-drift` | definiert und gatebar |
| `docs-drift` | definiert und gatebar |
| `report-schema-drift` | definiert und gatebar |
| `residual-owner-drift` | definiert und gatebar |
| `kernel-boundary-drift` | definiert und gatebar |
| `supply-chain-drift` | definiert und gatebar |

## Registry-Korrekturen durch WP-12

WP-12 hat zwei Registry-Drifts aus der WP-11-Baseline explizit korrigiert:

- `xtend.rmt.vnext-core-format.v1` wurde auf den existierenden Contract `xtend.rmt.core-format.vnext.v1` und Gate `rmt-vnext-compiler` gemappt.
- `xtend.security.trusted-dom-sanitizing-policy.v1` wurde auf den existierenden Contract `xtend.security.trusted-dom-policy.v1` gemappt.

## Verification Gates

```bash
node scripts/run_xtend_tests.js contract-runtime-parity --json
node scripts/run_xtend_tests.js contract-registry --json
node scripts/run_xtend_tests.js component-contract-v2 --json
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
node scripts/run_xtend_tests.js rmt-vnext-scheduler --json
node scripts/run_xtend_tests.js rmt-vnext-surfaces --json
node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json
node scripts/run_xtend_tests.js rmt-kernel-trusted-dom-runtime --json
node scripts/run_xtend_tests.js rmt-kernel-binding-security --json
node scripts/run_xtend_tests.js rmt-kernel-policy-parity --json
node scripts/run_xtend_tests.js rmt-kernel-security-regression --json
node scripts/run_xtend_tests.js supply-chain --json
node scripts/run_xtend_tests.js references --json
```

## Akzeptanz

| Kriterium | Status |
|-----------|--------|
| Contract-Claims besitzen Runtime-, Test-, Docs- oder Report-Gegenstuecke | `done` |
| Kernel-Trust-, Component-Contract-v2-, RMT-Core- und Supply-Chain-Parity sind abgedeckt | `done` |
| Residuals sind explizit und owner-reviewbar | `done` |
| Lokaler Gate meldet Contract Drift, Runtime Drift und fehlende Evidence | `done` |
| Registry-Drift aus WP-11 wurde korrigiert | `done` |

## Handoff

- `NFM-WP-13` hat Audit Evidence Packs aus Registry, Parity-Matrix, Security, Supply Chain, Dependency Diet, Conditional Network und Redaction-Regeln gebuendelt.
- `NFM-WP-14` bleibt parallel startbar und muss die RMT/UI-Residuals aus `NFM-CRP-02`, `NFM-CRP-04` und `NFM-CRP-09` quantifizieren.
- `NFM-WP-20` kann spaeter Docs- und Authoring-Guides auf parity-gepruefte Contract-IDs begrenzen.
