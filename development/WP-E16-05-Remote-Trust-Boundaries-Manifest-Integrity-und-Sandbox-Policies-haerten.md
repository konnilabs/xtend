# WP-E16-05 - Remote Trust Boundaries, Manifest Integrity und Sandbox Policies haerten

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Epic Contract: `xtend.rmt.vnext-remote-surfaces.v1`
- WP Contract: `xtend.epic16.wp05.remote-security-policy.v1`
- Remote Security Contract: `xtend.rmt.vnext-remote-security-policy.v1`
- Remote Security Posture: `xtend.rmt.vnext-remote-security-posture.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Trust Boundary: `xtend.security.remote-surface.v1`
- Zielzustand: `rmt-vnext-remote-security-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-security --json`

## Ziel

`WP-E16-05` haertet Remote Surfaces auf Contract-Ebene. Das Paket prueft Trust Boundary, Manifest Integrity, allowed Origins, CSP, Sandbox, deny-by-default Capabilities, Remote Event Payloads und blockierte Degradation.

Die wichtigste Entscheidung:

- Remote Security ist strenger als lokale Surface Security.
- Unsichere Remote-Fakten blockieren den Remote Security Report.
- Der RMT-Kernel bleibt ausfuehrungsfrei und laedt keine Remote Runtime.

## Umgesetzt

- Contract `xtend.rmt.vnext-remote-security-policy.v1` angelegt
- Remote Security Posture `xtend.rmt.vnext-remote-security-posture.v1` definiert
- Modul `tools/rmt-language/vnext-remote-security.js` erstellt
- Policy-Fixture fuer Remote Security angelegt
- Gate-Suite `tests/rmt-language/rmt_vnext_remote_security_suite.js` erstellt
- Package Export, Script und Metadaten fuer `rmt-vnext-remote-security` verdrahtet
- Epic 16 auf `WP-E16-05` abgeschlossen gesetzt

## Contract-Fakten

Ein Remote Security Report enthaelt:

- Trust Boundary Check
- Origin Allowlist Check
- Integrity Algorithm und Digest Check
- CSP Check mit Trusted Types und `object-src 'none'`
- Sandbox Check ohne Scripts, Same-Origin, Popups und Forms
- Capability Deny-by-default Check
- Remote Event Payload Check
- Degradation Blocking Check
- Kernel Boundary mit `remoteRuntimeExecution: false`

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Remote Security Schema ist benannt | erfuellt: `xtend.rmt.vnext-remote-security-policy.v1` |
| Trust Boundary ist festgelegt | erfuellt: `xtend.security.remote-surface.v1` |
| Manifest Integrity ist Pflicht | erfuellt |
| Origin Allowlist ist Pflicht | erfuellt |
| Sandbox blockiert Scripts und Same-Origin | erfuellt |
| Capability Escalation wird blockiert | erfuellt |
| Remote Event Payloads werden geprueft | erfuellt |
| blockierte Degradation blockiert Remote Security | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-security --json
```

Ergebnis vom 12. Mai 2026:

- Status: `passed`
- Passes: `77`
- Failures: `0`

## Handoff

`WP-E16-05` ist abgeschlossen. `WP-E16-06` kann das Cross Surface Event Protocol auf Basis der gehaerteten Remote Security und Enterprise Registry modellieren.
