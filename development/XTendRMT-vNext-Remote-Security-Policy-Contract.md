# XTendRMT vNext Remote Security Policy Contract

- Status: `accepted by WP-E16-05`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Contract: `xtend.rmt.vnext-remote-security-policy.v1`
- Remote Security Posture: `xtend.rmt.vnext-remote-security-posture.v1`
- Report Schema: `xtend.rmt.vnext-remote-security-report.v1`
- Workpackage: `WP-E16-05`
- Depends on:
  - `xtend.rmt.vnext-remote-surface-manifest.v1`
  - `xtend.rmt.vnext-enterprise-surface-registry.v1`
  - `xtend.rmt.vnext-degradation-policy.v1`
  - `xtend.rmt.vnext-security-policy-contract.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`
- Trust Boundary: `xtend.security.remote-surface.v1`
- Zielzustand: `rmt-vnext-remote-security-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-security --json`
- Package Script: `npm run test:rmt-vnext-remote-security`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-remote-security-policy.v1"
```

Dieser Contract haertet Remote Surfaces gegen unsichere Manifest-, Origin-, Sandbox-, CSP- und Capability-Flows. Er ist strenger als lokale Surface Security, weil Remote Surfaces per Default nicht vertrauenswuerdig sind.

Der RMT-Kernel fuehrt weiterhin keine Remote Runtime aus. Der Contract erzeugt nur einen auditierbaren Remote Security Report.

## Remote Security Posture

```json
{
  "schema": "xtend.rmt.vnext-remote-security-posture.v1",
  "enterpriseSurfaceId": "enterpriseSurface:remote:checkout.cart",
  "status": "ready",
  "remote": {
    "manifestId": "remoteManifest:checkout.cart",
    "remoteId": "@xtend/checkout-cart",
    "origin": "https://cdn.xtend.example",
    "trustBoundary": "xtend.security.remote-surface.v1",
    "integrity": {
      "algorithm": "sha256",
      "digest": "sha256-REPLACE_WITH_MANIFEST_DIGEST"
    }
  },
  "csp": {
    "requireTrustedTypes": true,
    "connectSrc": ["https://cdn.xtend.example"],
    "objectSrc": ["'none'"]
  },
  "sandbox": {
    "allowScripts": false,
    "allowSameOrigin": false,
    "allowPopups": false,
    "allowForms": false
  },
  "capabilityMode": "deny-by-default",
  "kernelBoundary": {
    "remoteRuntimeExecution": false,
    "hostAdapterRequired": true,
    "networkRequiredByKernel": false
  },
  "diagnostics": []
}
```

## Required Controls

| Control | Regel |
| --- | --- |
| Trust Boundary | Remote Surfaces muessen `xtend.security.remote-surface.v1` verwenden |
| Origin | Manifest-Origin muss explizit erlaubt sein |
| Integrity | `sha256`, `sha384` oder `sha512` mit Digest ist Pflicht |
| CSP | Trusted Types, `object-src 'none'` und `connect-src` auf die konkrete Remote-Origin sind Pflicht |
| Sandbox | keine Scripts, Same-Origin, Popups oder Forms per Default |
| Capabilities | deny-by-default; jede Surface Capability muss erlaubt sein |
| Events | Remote Events brauchen Payload-Schemas |
| Degradation | blockierte Degradation blockiert auch Remote Security |

## Diagnostics

| Code | Bedeutung |
| --- | --- |
| `rmt.vnext.remote_security.trust_boundary_missing` | Remote Trust Boundary fehlt |
| `rmt.vnext.remote_security.trust_boundary_unknown` | Trust Boundary ist nicht `xtend.security.remote-surface.v1` |
| `rmt.vnext.remote_security.origin_not_allowed` | Origin ist nicht erlaubt |
| `rmt.vnext.remote_security.integrity_missing` | Manifest Integrity fehlt oder nutzt unerlaubten Algorithmus |
| `rmt.vnext.remote_security.csp_missing` | CSP ist nicht streng genug |
| `rmt.vnext.remote_security.sandbox_conflict` | Sandbox erlaubt unsichere Faehigkeiten |
| `rmt.vnext.remote_security.capability_escalation` | Surface Capability ist nicht durch deny-by-default Policy erlaubt |
| `rmt.vnext.remote_security.event_payload_missing` | Remote Event hat kein Payload-Schema |
| `rmt.vnext.remote_security.degradation_blocked` | Degradation Report blockiert die Remote Surface |

## Artefakte

| Artefakt | Pfad |
| --- | --- |
| Modul | `tools/rmt-language/vnext-remote-security.js` |
| Suite | `tests/rmt-language/rmt_vnext_remote_security_suite.js` |
| Fixture | `tests/rmt-language/fixtures/vnext-remote-security-policy-fixture.json` |
| Workpackage | `development/WP-E16-05-Remote-Trust-Boundaries-Manifest-Integrity-und-Sandbox-Policies-haerten.md` |

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-security --json
```

Das Gate prueft Trust Boundary, Origin Allowlist, Manifest Integrity, CSP, Sandbox, Capability Deny-by-default, Remote Event Payloads, blockierte Degradation, Package-Metadaten, Runner-Integration und deterministische Serialisierung.
