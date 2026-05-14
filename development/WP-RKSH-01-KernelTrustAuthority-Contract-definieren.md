# WP-RKSH-01 - KernelTrustAuthority Contract definieren

- Status: `completed`
- Datum: 14. Mai 2026
- Backlog: `development/XTendRMT-Kernel-Sicherheits-Hardening-Backlog.md`
- Baseline: `development/XTendRMT-Kernel-Trust-Hardening-Contract.md`
- Contract: `xtend.rmt.kernel-trust-authority.v1`
- Verdict Schema: `xtend.rmt.kernel-trust-verdict.v1`
- Diagnostic Schema: `xtend.rmt.kernel-trust-diagnostic.v1`
- Report Schema: `xtend.rmt.kernel-trust-authority-report.v1`
- Workpackage: `RKSH-WP-01`
- Modul: `tools/rmt-language/kernel-trust-authority.js`
- Types: `tools/rmt-language/kernel-trust-authority.d.ts`
- Suite: `tests/rmt-language/rmt_kernel_trust_authority_suite.js`
- Gate: `node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json`
- Zielzustand: `kernel-trust-authority-contract-ready`

## Ziel

`RKSH-WP-01` definiert die Kernel Trust Authority als host-neutrale Contract-Schicht. Das Paket macht Trust Verdicts, Reason Codes, Scopes, Sinks, Diagnostics und TypeScript-Typen testbar, ohne bereits Renderer- oder Runtime-Sink-Code umzuschreiben.

## Umgesetzt

- `tools/rmt-language/kernel-trust-authority.js` angelegt
- `tools/rmt-language/kernel-trust-authority.d.ts` angelegt
- `development/XTendRMT-Kernel-Trust-Authority-Contract.md` angelegt
- `tests/rmt-language/rmt_kernel_trust_authority_suite.js` angelegt
- Package Export `./rmt-language/kernel-trust-authority` ergaenzt
- Package Script `test:rmt-kernel-trust-authority` ergaenzt
- Test Runner um `rmt-kernel-trust-authority` erweitert
- TypeExports RMT Catalog um die neue Declaration ergaenzt
- Backlog auf `RKSH-WP-01 completed` aktualisiert

## Contract-Entscheidungen

- `RmtKernelTrustVerdict` ist der zentrale Output-Envelope.
- Gueltige Verdicts sind `trusted`, `sanitized`, `blocked` und `panic`.
- `commitAllowed` ist Pflicht und darf bei `blocked` oder `panic` nicht `true` sein.
- HTML-Sinks werden ohne Sanitizing- oder Trust-Fakt geblockt.
- Event-Attribute, gefaehrliche URL-Protokolle und riskante Properties werden im Default geblockt.
- Remote Surface Output braucht eine Trust Boundary.
- Diagnostics sind redigiert und enthalten keine rohen HTML-Payloads.
- Host Adapter Hooks sind reserviert, aber in WP-01 nicht verpflichtend.

## Beispiel-Verdicts

Text:

```json
{
  "schema": "xtend.rmt.kernel-trust-verdict.v1",
  "verdict": "trusted",
  "scope": "binding",
  "sink": "textContent",
  "commitAllowed": true
}
```

Unsanitized HTML:

```json
{
  "schema": "xtend.rmt.kernel-trust-verdict.v1",
  "verdict": "blocked",
  "scope": "slot",
  "sink": "innerHTML",
  "reasonCode": "rmt.kernel.trust.html_sanitizer_missing",
  "diagnosticCode": "rmt.kernel.trust.html_sanitizer_missing",
  "commitAllowed": false
}
```

Panic Candidate:

```json
{
  "schema": "xtend.rmt.kernel-trust-verdict.v1",
  "verdict": "blocked",
  "scope": "remote-surface",
  "sink": "remote-surface-output",
  "reasonCode": "rmt.kernel.trust.remote_boundary_missing",
  "commitAllowed": false,
  "panicCandidate": true
}
```

## Definition-of-Done-Check

| Kriterium | Ergebnis |
| --- | --- |
| Jeder Runtime-Output kann einem Trust Scope zugeordnet werden | erfuellt |
| Blockierte Outputs erzeugen strukturierte Diagnostics | erfuellt |
| Trust Verdicts sind serialisierbar und testbar | erfuellt |
| TypeScript-Definitionen existieren | erfuellt |
| Package Export ist vorhanden | erfuellt |
| Host-neutrale Default-Policy ist dokumentiert | erfuellt |
| `RKSH-WP-02` ist startbar | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-kernel-trust-authority --json
node scripts/run_xtend_tests.js type-exports-rmt --json
node scripts/run_xtend_tests.js references --json
```

## Handoff

`RKSH-WP-01` ist abgeschlossen. `RKSH-WP-02` kann die Runtime Trust-Sink-Adapter fuer HTML-, Slot-, Prerender- und Error-Fallback-Pfade anbinden.

Die naechste Umsetzung soll bewusst auf HTML-Sinks fokussieren:

- `innerHTML`
- `insertAdjacentHTML`
- `template.innerHTML`
- `html_fragment`
- `slot.html`
- `prerender.html`
- `fallback.html`

Noch nicht Teil von `RKSH-WP-02`:

- Scheduler-Failure-Semantik
- Command-Bus-Eskalation
- vollstaendige PanicMonitor State Machine
- Surface Rollback und Quarantaene
