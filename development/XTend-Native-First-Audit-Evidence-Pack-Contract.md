# XTend Native-First Audit Evidence Pack Contract

- Status: `accepted by NFM-WP-13`
- Datum: 3. Juni 2026
- Roadmap: `development/ROADMAP-XTend-Native-First-Framework-Mission.md`
- Workpackage: `development/NFM-WP-13-Audit-Evidence-Pack-fuer-Contracts-Security-und-Dependencies-buendeln.md`
- Contract: `xtend.native-first.audit-evidence-pack.v1`
- Evidence Item Schema: `xtend.native-first.audit-evidence-item.v1`
- Evidence Pack Index: `xtend.native-first.audit-evidence-pack-index.v1`
- Redaction Policy: `xtend.native-first.diagnostic-redaction-policy.v1`
- Report Schema: `xtend.native-first.audit-evidence-pack-report.v1`
- Source Registry: `xtend.native-first.contract-registry-index.v1`
- Source Parity Matrix: `xtend.native-first.contract-runtime-parity-matrix.v1`
- Local Gate: `node scripts/run_xtend_tests.js native-first-evidence-pack --json`
- Boundary: `release-owner-can-review-from-one-pack`
- Boundary: `evidence-pack-references-existing-gates`
- Boundary: `conditional-network-status-is-explicit`
- Boundary: `diagnostics-redaction-before-release-sharing`
- Boundary: `audit-pack-does-not-run-network-by-default`
- Boundary: `rmt-kernel-remains-host-neutral`
- Zielzustand: `native-first-audit-evidence-pack-ready`

## Zweck

Dieser Contract buendelt die fuer Release Owner relevanten Native-First-, Security-, Contract- und Dependency-Nachweise in einem reviewbaren Audit Evidence Pack. Das Pack ersetzt keine Quell-Gates. Es verlinkt Contract Registry, Contract-to-Runtime-Parity, Trusted DOM, Kernel Trust, Supply Chain, Dependency Diet, Conditional Network Evidence und Release-Artefakte so, dass ein Review ohne manuelle Pfadsuche moeglich ist.

Das lokale Gate bleibt offline und dependency-frei. Netzwerknahe Evidenz wird nur als vorhandener Status oder als owner-akzeptierte Conditional-Network-Deferral referenziert.

## Evidence Item Schema

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `evidenceId` | ja | stabile Pack-Zeile, zum Beispiel `NFM-AEP-04` |
| `evidenceType` | ja | `contract-registry`, `contract-parity`, `security`, `dependency`, `supply-chain`, `conditional-network`, `release-pack` oder `redaction-policy` |
| `sourceContract` | ja | Contract-ID der fuehrenden Quelle |
| `owner` | ja | Owner-Rolle fuer Review, Residuals und Release-Handoff |
| `localGate` | ja | lokaler Gate oder referenzierter Gate-Name |
| `reportSchema` | ja | Report-Schema, das Release Owner im Pack erwarten duerfen |
| `artifacts` | ja | relevante Docs-, Runtime-, Test- oder Report-Pfade |
| `status` | ja | `local-passed`, `parity-passed-with-residual`, `conditional-network-deferred`, `ci-planned`, `release-owner-review-ready` oder `redaction-policy-ready` |
| `redactionClass` | ja | `public-contract`, `release-evidence`, `security-sensitive`, `dependency-evidence`, `network-conditional` oder `diagnostic-redacted` |
| `releaseOwnerUse` | ja | konkrete Review-Frage, die mit dieser Evidence beantwortet wird |
| `residual` | ja | `none` oder owner-reviewbarer Restpunkt |
| `nextHandoff` | ja | Folgepaket oder Release-Handoff |

## Pack Controls

- `NFM-AEP-*`-Zeilen duerfen nur auf existierende Repository-Artefakte oder explizite externe Commands zeigen.
- Jede Evidence-Zeile muss eine registrierte Contract-ID, ein Report-Schema und einen Owner besitzen.
- Conditional-Network-Evidence darf im lokalen Default nur `defer-with-owner-reason`, vorhandene Reports oder CI-Handoff referenzieren.
- Release Owner duerfen Pack-Status nur als Freigabegrund nutzen, wenn die Source-Gates fuer die betroffene Zeile lokal oder in CI akzeptiert sind.
- Contract- und Parity-Residuals bleiben sichtbar; das Pack darf keine Residuals verstecken oder zu `none` normalisieren.
- Das Pack darf keine neue Runtime-, Browser- oder Netzwerk-Dependency einfuehren.

## Diagnostic Redaction Policy

`xtend.native-first.diagnostic-redaction-policy.v1` gilt fuer alle Pack-Ausgaben, die ausserhalb lokaler Entwicklerkontexte geteilt werden.

Zu redigieren:

- `token`
- `secret`
- `password`
- `authorization`
- `cookie`
- `set-cookie`
- `npm_token`
- URLs mit eingebetteten Credentials
- rohe Environment-Werte
- rohe HTML-Fragmente aus nicht vertrauenswuerdigen Quellen
- absolute lokale Pfade, wenn ein repo-relativer Pfad reicht
- Stacktraces mit privaten User- oder Maschinenpfaden

Zu erhalten:

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

## Source Gates

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

## Nicht-Ziele

- keine neue Release-Freigabeautomatik
- keine Netzwerk-Ausfuehrung im lokalen Evidence-Pack-Gate
- keine SBOM- oder Audit-Erzeugung durch dieses Gate selbst
- keine Verdichtung von Security-Residuals zu gruenen Produktclaims
- kein Import von Host-, Component- oder Browser-Typen in den RMT-Kernel

## Handoff

- `NFM-WP-13` friert Audit Evidence Pack, Redaction Policy und Release-Owner-Review-Felder ein.
- `NFM-WP-14` kann UI- und RMT-Residuals aus dem Pack als bewertete Eingabe nutzen.
- `NFM-WP-20` kann Native-First-Dokumentation auf Pack- und Registry-Quellen verlinken.
- `NFM-WP-22` kann Mission-Handoff und naechste Epic-Grenze aus Pack-Status, Residuals und Conditional-Network-Status ableiten.

## Akzeptanzkriterien

| Kriterium | Entscheidung |
|-----------|--------------|
| Contract Registry und Runtime-Parity sind als Evidence-Quellen enthalten | erfuellt |
| Trusted-DOM-, Kernel-Trust- und Supply-Chain-Evidence sind gebuendelt | erfuellt |
| Dependency Diet und Conditional Network Status sind sichtbar | erfuellt |
| Redaction-Regeln fuer Diagnostics sind definiert | erfuellt |
| Lokales Gate bleibt offline und dependency-frei | erfuellt |
