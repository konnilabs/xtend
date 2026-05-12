# XTendRMT vNext Remote Surface Manifest Contract

- Status: `accepted by WP-E16-02`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Contract: `xtend.rmt.vnext-remote-surface-manifest.v1`
- Remote Surface: `xtend.rmt.vnext-remote-surface.v1`
- Report Schema: `xtend.rmt.vnext-remote-surface-manifest-report.v1`
- Workpackage: `WP-E16-02`
- Depends on:
  - `xtend.rmt.vnext-remote-surfaces-threat-model.v1`
  - `xtend.rmt.vnext-release-handoff.v1`
  - `xtend.rmt.vnext-surface-registry.v1`
  - `xtend.rmt.vnext-security-policy-contract.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`
- Zielzustand: `rmt-vnext-remote-manifest-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json`
- Package Script: `npm run test:rmt-vnext-remote-manifest`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-remote-surface-manifest.v1"
```

Dieser Contract beschreibt Remote Surfaces als deklarative Manifest Records. Das Manifest macht Owner, Version, Origin, Integrity, Capabilities, Adapter Boundary, Shell Bindings und Fallback pruefbar, ohne Remote Code im RMT-Kernel auszufuehren.

## Remote Surface Record

```json
{
  "schema": "xtend.rmt.vnext-remote-surface.v1",
  "manifestId": "remoteManifest:checkout.cart",
  "surfaceId": "remoteSurface:checkout.cart",
  "name": "checkout.cart",
  "owner": {
    "kind": "team",
    "id": "checkout-platform"
  },
  "remote": {
    "id": "@xtend/checkout-cart",
    "origin": "https://cdn.xtend.example",
    "versionRange": "^2.4.0",
    "integrity": {
      "algorithm": "sha256",
      "digest": "sha256-REPLACE_WITH_MANIFEST_DIGEST"
    }
  },
  "security": {
    "trustBoundary": "xtend.security.remote-surface.v1",
    "capabilityMode": "deny-by-default",
    "sandboxRequired": true,
    "cspRequired": true
  },
  "shellBindings": [
    {
      "lane": "critical",
      "target": "shell.slot:sidebar.cart",
      "mode": "mount"
    }
  ],
  "capabilities": [
    {
      "id": "surface.mount",
      "mode": "required"
    }
  ],
  "adapterBoundary": {
    "adapterId": "xtend.remote-surface.host",
    "capabilities": [
      "surface.mount"
    ],
    "hostOwned": true,
    "runtimeLoader": false
  },
  "fallback": {
    "kind": "surface",
    "ref": "checkout.cart.fallback"
  },
  "runtime": {
    "kernelRemoteExecution": false,
    "hostAdapterRequired": true,
    "networkRequiredByKernel": false
  },
  "status": "ready",
  "diagnostics": []
}
```

## Mandatory Facts

| Fact | Bedeutung |
| --- | --- |
| `owner` | Team oder System, das die Remote Surface fachlich besitzt |
| `version` | Version Range fuer Manifest und Remote Contract |
| `remote` | Remote Manifest oder Package ID |
| `origin` | erlaubte Manifest-/Asset-Origin |
| `integrity` | pruefbarer Digest mit `sha256`, `sha384` oder `sha512` |
| `trustBoundary` | Remote Trust Boundary fuer Host-Policies |
| `allowedCapabilities` | explizit erlaubte Host-Faehigkeiten |
| `adapterBoundary` | host-owned Adapter mit Capability-Liste |
| `shellTargets` | explizite Lane-zu-Shell-Bindings |
| `fallback` | kontrollierter Fallback bei Load-, Version- oder Policy-Fehler |

## Runtime Boundary

Das Manifest enthaelt bewusst nur Contract-Fakten. Es enthaelt keinen Loader, keine URL-Ausfuehrung, kein `import()`, kein Eval und keine Host-Runtime-Abhaengigkeit.

Hosts duerfen Manifest Records laden und auswerten. Der RMT-Kernel darf sie nur normalisieren, validieren, serialisieren und diagnostizieren.

## Diagnostics

| Code | Bedeutung |
| --- | --- |
| `rmt.vnext.remote.owner_missing` | Remote Surface besitzt keinen Owner |
| `rmt.vnext.remote.id_missing` | Remote ID fehlt |
| `rmt.vnext.remote.version_missing` | Version oder Version Range fehlt |
| `rmt.vnext.remote.origin_missing` | Origin fehlt |
| `rmt.vnext.remote.origin_invalid` | Origin ist keine gueltige HTTP(S)-Origin |
| `rmt.vnext.remote.integrity_missing` | Integrity fehlt oder nutzt keinen erlaubten Digest-Algorithmus |
| `rmt.vnext.remote.trust_boundary_missing` | Remote Trust Boundary fehlt |
| `rmt.vnext.remote.capability_missing` | Capabilities fehlen |
| `rmt.vnext.remote.capability_implicit` | Capability ist nicht durch die Adapter Boundary erlaubt |
| `rmt.vnext.remote.adapter_boundary_missing` | Adapter Boundary fehlt oder hat keine expliziten Capabilities |
| `rmt.vnext.remote.exposes_missing` | Shell-/Lane-Binding fehlt oder ist unvollstaendig |
| `rmt.vnext.remote.fallback_missing` | Fallback fehlt |
| `rmt.vnext.remote.runtime_execution_in_kernel` | Manifest versucht Runtime Loading im RMT-Kernel zu aktivieren |

## Artefakte

| Artefakt | Pfad |
| --- | --- |
| Modul | `tools/rmt-language/vnext-remote-manifest.js` |
| Suite | `tests/rmt-language/rmt_vnext_remote_manifest_suite.js` |
| Gueltiges Fixture | `tests/rmt-language/fixtures/vnext-remote-manifest-valid.json` |
| Negatives Fixture | `tests/rmt-language/fixtures/vnext-remote-manifest-invalid.json` |
| Workpackage | `development/WP-E16-02-Remote-Surface-Manifest-und-Core-Contract-definieren.md` |

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json
```

Das Gate prueft Modulsyntax, Suite-Syntax, Package-Metadaten, Export, Runner-Integration, deterministische Serialisierung, positive Manifest-Normalisierung, negative Diagnostics und die Kernel-Runtime-Boundary.
