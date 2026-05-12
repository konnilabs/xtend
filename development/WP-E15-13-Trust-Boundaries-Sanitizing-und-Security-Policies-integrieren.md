# WP-E15-13 - Trust Boundaries, Sanitizing und Security Policies integrieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Workstream: `WS4`
- Prioritaet: `P1`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-security --json`
- Contract: `xtend.rmt.vnext-security-policy-contract.v1`

## Ziel

WP-E15-13 integriert Security-by-Design als eigene Contract-Schicht ueber vNext-Core-Policies. Unsichere HTML-, Streaming-, Endpoint- und Worker-Pfade muessen explizite Trust Boundaries und Sanitizing tragen.

## Umgesetzte Artefakte

- `tools/rmt-language/vnext-security.js`
  - Security Policy Contract
  - Trust Boundary Records
  - Sanitize Policy Records
  - Security Postures fuer unsichere Operationen
  - CSP-, Isolation-, Sandbox- und Escaping-Profile
  - Pflichtdiagnostics fuer fehlende oder widerspruechliche Policies
- `tests/rmt-language/fixtures/vnext-security-valid.rmt`
  - Endpoint-, SSE- und Worker-Flow mit Boundary und `sanitize html`
- `tests/rmt-language/fixtures/vnext-security-missing-policy.rmt`
  - unsichere Flows ohne Policies
- `tests/rmt-language/fixtures/vnext-security-conflict.rmt`
  - widerspruechliche Trust Boundaries
- `tests/rmt-language/rmt_vnext_security_suite.js`
  - Contract-, Fixture- und Negativtests
- `development/XTendRMT-vNext-Security-Policy-Contract.md`

## Contract-Entscheidungen

- `trust boundary` wird gegen einen Boundary Catalog validiert.
- `sanitize html` wird als eigenes Sanitize Record normalisiert.
- Default Boundaries liefern CSP-, Isolation-, Sandbox- und Escaping-Fakten.
- Unsichere Streams, SSE, Worker-Resultate und HTML/Endpoint-Flows blockieren ohne Trust Boundary.
- Unsichere HTML-Flows blockieren ohne passendes Sanitizing.
- Sanitizing ohne Trust Boundary ist nicht auditierbar und blockiert.

## Definition of Done

- Security ist explizit und auditierbar.
- Unsichere Datenfluesse werden nicht still normalisiert.
- `package.json` exportiert `./rmt-language/vnext-security` und `npm run test:rmt-vnext-security`.
- `scripts/run_xtend_tests.js` kennt `rmt-vnext-security`.
- Der Gate prueft gueltige Security Postures, fehlende Policies, unbekannte Boundaries, unsupported Sanitizer und Konflikte.

## Gate-Ergebnis

Bestanden:

```bash
node scripts/run_xtend_tests.js rmt-vnext-security --json
```

- Ergebnis: `passed`
- Checks: `76`
- Suiten: `1`
