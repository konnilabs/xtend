# XTend Native-First Contract-to-Runtime Parity Contract

- Status: `accepted by NFM-WP-12`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-12-Contract-to-Runtime-Parity-Gate-fuer-Kernel-Components-und-RMT-bauen.md`
- Contract: `xtend.native-first.contract-runtime-parity.v1`
- Matrix Schema: `xtend.native-first.contract-runtime-parity-matrix.v1`
- Drift Report: `xtend.native-first.contract-runtime-parity-drift-report.v1`
- Report Schema: `xtend.native-first.contract-runtime-parity-report.v1`
- Source Registry: `xtend.native-first.contract-registry-index.v1`
- Boundary: `contracts-require-runtime-test-docs-report-counterparts`
- Boundary: `owner-reviewed-residuals-are-allowed-only-if-explicit`
- Boundary: `kernel-component-rmt-supply-chain-parity-required`
- Boundary: `runtime-parity-does-not-create-runtime-coupling`
- Boundary: `rmt-kernel-remains-host-neutral`
- Zielzustand: `contract-runtime-parity-gate-ready`

## Zweck

Dieser Contract verhindert, dass XTend-Contracts nur Papier bleiben. Er definiert einen lokalen Gate, der Contract-Claims gegen Runtime-Artefakte, Test-Gates, Docs-Pfade und Report-Schemas abgleicht. Fehlt ein Gegenstueck, muss der Eintrag als owner-reviewbares Residual sichtbar sein.

WP-12 ist kein Runtime-Refactor. Das Paket buendelt vorhandene Component-, RMT-, Kernel-, Security- und Supply-Chain-Gates zu einer Parity-Oberflaeche und macht Drift maschinenlesbar.

## Parity Entry Schema

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `parityId` | ja | stabile ID im Format `NFM-CRP-##` |
| `contractId` | ja | Contract-ID aus Registry oder Source-Contract |
| `domain` | ja | `component`, `rmt`, `kernel`, `security`, `supply-chain` oder `native-first` |
| `owner` | ja | Owner-Rolle fuer Parity und Residual Review |
| `contractPath` | ja | fuehrender Contract-Pfad |
| `runtimeArtifacts` | ja | Runtime-, Tooling-, Manifest- oder Policy-Artefakte |
| `testGate` | ja | lokaler Gate, der das Gegenstueck prueft |
| `docsPath` | ja | Docs-, Contract- oder Handoff-Pfad fuer Review |
| `reportSchema` | ja | Report-Schema des lokalen Gates |
| `parityStatus` | ja | `parity-covered`, `parity-covered-with-residual`, `contract-only-residual` oder `docs-report-parity` |
| `residual` | ja | `none` oder explizite Restflaeche mit Owner |
| `nextHandoff` | ja | Folgepaket, Gate oder Release-Handoff |

## Drift-Klassen

| Drift-ID | Bedeutung | Gate-Reaktion |
|----------|-----------|---------------|
| `contract-drift` | Registry, Contract-Dokument oder Package-Metadaten nennen widerspruechliche Contract-IDs | blockierend |
| `runtime-drift` | Contract-Claim hat kein Runtime-, Tooling-, Manifest- oder Policy-Artefakt | blockierend, ausser `contract-only-residual` mit Owner |
| `test-gate-drift` | Parity-Eintrag hat keinen lokalen Gate oder der Gate ist nicht im Runner/Scripts auffindbar | blockierend |
| `docs-drift` | Docs- oder Contract-Pfad fehlt | blockierend |
| `report-schema-drift` | Report-Schema fehlt oder passt nicht zum lokalen Gate | blockierend |
| `residual-owner-drift` | Residual existiert ohne Owner, Handoff oder Review-Status | blockierend |
| `kernel-boundary-drift` | Kernel-, RMT- oder Component-Eintrag verletzt `rmt-kernel-remains-host-neutral` | blockierend |
| `supply-chain-drift` | Runtime-Dependency-, License-, Vulnerability- oder Lockfile-Evidence fehlt | blockierend |

## Bewertungsmodell

| Status | Bedeutung | Produktclaim |
|--------|-----------|--------------|
| `parity-covered` | Contract, Runtime/Policy, Test, Docs und Report sind vorhanden | Claim ist lokal belegbar |
| `parity-covered-with-residual` | Gegenstuecke existieren, aber ein Scope bleibt als Folgepaket offen | Claim muss Residual nennen |
| `contract-only-residual` | Contract ist wichtig, aber Runtime- oder UI-Parity wird spaeter materialisiert | kein Runtime-Parity-Claim |
| `docs-report-parity` | Contract ist Governance-, Registry- oder Evidence-Oberflaeche ohne Runtime-Code | Claim ist als Docs-/Report-Claim erlaubt |

## Pflicht-Domains

| Domain | Pflichtquelle | Mindest-Gate |
|--------|---------------|--------------|
| `component` | `xtend.component.contract.v2` | `component-contract-v2` |
| `rmt` | `xtend.rmt.core-format.vnext.v1`, Scheduler und Surface Registry | `rmt-vnext-compiler`, `rmt-vnext-scheduler`, `rmt-vnext-surfaces` |
| `kernel` | `xtend.rmt.kernel-trust-hardening.v1` und RKSH Runtime-Gates | `rmt-kernel-trust-authority`, `rmt-kernel-policy-parity`, `rmt-kernel-security-regression` |
| `security` | Trusted DOM, Sanitizing und Manifest/Sink Policies | `epic13-trusted-dom-boundary` oder Kernel-Trust-Gates |
| `supply-chain` | Dependency Diet und Supply-Chain-Gate-Plan | `supply-chain` |
| `native-first` | Contract Registry und Native-First-Governance | `contract-registry` |

## Source Gates

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

## Nicht-Ziele

- keine automatische Runtime-Freigabe fuer alle Registry-Eintraege
- kein Import von Component-, Browser- oder Host-Typen in den RMT-Kernel
- keine neue externe Audit-Dependency
- keine Aufloesung aller `contract-only-residual`-Eintraege in WP-12
- keine UI-Maximality-Bewertung; diese bleibt bei `NFM-WP-14`

## Handoff

- `NFM-WP-13` kann Audit Evidence Packs aus Parity-Report, Contract Registry, Security und Supply Chain buendeln.
- `NFM-WP-14` muss `contract-only-residual` und `parity-covered-with-residual` fuer RMT UI Gap Analysis auswerten.
- `NFM-WP-20` kann Docs auf Contract-IDs mit belegten Runtime-/Report-Gegenstuecken beschraenken.
- `NFM-WP-22` kann Mission-Residuals anhand von Parity-Status und Drift-Klassen entscheiden.

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Contract-, Runtime-, Test-, Docs- und Report-Gegenstuecke sind als Pflichtfelder definiert | erfuellt |
| Kernel-Trust-, Component-v2-, RMT-Core- und Supply-Chain-Parity sind Pflichtdomains | erfuellt |
| Residuals sind explizit und owner-reviewbar | erfuellt |
| Lokaler Gate meldet Contract Drift, Runtime Drift und fehlende Evidence | erfuellt |
| RMT-Kernel bleibt host- und framework-neutral | erfuellt |
