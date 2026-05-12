# XTendRMT vNext Security Policy Contract

- Status: `accepted by WP-E15-13`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext-security-policy-contract.v1`
- Trust Boundary: `xtend.rmt.vnext-trust-boundary.v1`
- Sanitize Policy: `xtend.rmt.vnext-sanitize-policy.v1`
- Security Posture: `xtend.rmt.vnext-security-posture.v1`
- Depends on: `xtend.rmt.core-format.vnext.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-security-policy-ready`
- Folgepakete: `WP-E15-14`, `WP-E15-15`, `WP-E15-17`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-security-policy-contract.v1"
```

Dieser Contract macht `trust boundary` und `sanitize` als auditierbare Security Records sichtbar. Unsichere Streaming-, Worker- oder HTML/Endpoint-Pfade werden nicht still normalisiert, sondern muessen Trust Boundary und Sanitizing explizit deklarieren.

## Trust Boundary

```json
{
  "schema": "xtend.rmt.vnext-trust-boundary.v1",
  "policyId": "security:security.page/root/critical/0/trustBoundary/0",
  "ownerOperation": "operation:security.page/root/critical/0",
  "boundaryId": "xtend.security.sanitizing-boundary.v1",
  "boundaryKnown": true,
  "csp": {
    "requireTrustedTypes": true,
    "defaultSrc": ["'self'"],
    "objectSrc": ["'none'"]
  },
  "isolation": {
    "mode": "component-boundary"
  },
  "sandbox": {
    "mode": "no-inline-script",
    "allowScripts": false
  },
  "escaping": {
    "required": true,
    "formats": ["html", "text", "url"]
  }
}
```

## Sanitize Policy

```json
{
  "schema": "xtend.rmt.vnext-sanitize-policy.v1",
  "policyId": "security:security.page/root/critical/0/sanitize/1",
  "ownerOperation": "operation:security.page/root/critical/0",
  "format": "html",
  "escaping": {
    "required": true,
    "format": "html"
  }
}
```

## Security Posture

```json
{
  "schema": "xtend.rmt.vnext-security-posture.v1",
  "operationId": "operation:security.page/root/normal/0",
  "operationKind": "stream",
  "dataSource": {
    "kind": "sse",
    "target": "docs.feed"
  },
  "unsafeFlow": true,
  "required": {
    "trustBoundary": true,
    "sanitizeFormats": ["html"]
  },
  "boundaryIds": ["xtend.security.streaming-boundary.v1"],
  "sanitizeFormats": ["html"],
  "escaping": {
    "required": true,
    "formats": ["html"]
  }
}
```

## Default Trust Boundaries

| Boundary | Zweck |
|----------|-------|
| `xtend.security.sanitizing-boundary.v1` | HTML-/Endpoint-Ergebnisse vor Rendering absichern |
| `xtend.security.streaming-boundary.v1` | inkrementelle Stream-Fragmente vor Auslieferung absichern |
| `xtend.security.worker-boundary.v1` | Worker-Resultate an Message- und Sanitizing-Grenze binden |

Jedes Profil enthaelt CSP-, Isolation-, Sandbox- und Escaping-Fakten. Hosts duerfen daraus konkrete Runtime-Policies ableiten, aber der RMT-Kernel bleibt host-neutral.

## Diagnostics

| Code | Bedeutung |
|------|-----------|
| `rmt.vnext.security.policy.owner_missing` | Security Policy verweist auf fehlende Owner-Operation |
| `rmt.vnext.security.trust_boundary.missing` | Unsicherer Flow hat keine Trust Boundary |
| `rmt.vnext.security.trust_boundary.unknown` | Boundary ist nicht im Catalog deklariert |
| `rmt.vnext.security.sanitize.missing` | Unsicherer HTML-Flow hat kein passendes Sanitizing |
| `rmt.vnext.security.sanitize.format_unsupported` | Sanitize-Format ist nicht erlaubt |
| `rmt.vnext.security.policy.duplicate` | Doppelte Security Policy am selben Owner |
| `rmt.vnext.security.policy.conflict` | Owner deklariert widerspruechliche Boundaries |
| `rmt.vnext.security.sanitize.without_boundary` | Sanitizing ohne explizite Boundary ist nicht auditierbar |

Alle Diagnostics behalten `sourceRef`, Core Pointer und Source Range, sofern sie im Core-SourceMap vorhanden sind.

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-security --json
```

Fixtures:

- `tests/rmt-language/fixtures/vnext-security-valid.rmt`
- `tests/rmt-language/fixtures/vnext-security-missing-policy.rmt`
- `tests/rmt-language/fixtures/vnext-security-conflict.rmt`

Modul:

- `tools/rmt-language/vnext-security.js`
