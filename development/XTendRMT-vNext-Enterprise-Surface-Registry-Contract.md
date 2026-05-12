# XTendRMT vNext Enterprise Surface Registry Contract

- Status: `accepted by WP-E16-03`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Contract: `xtend.rmt.vnext-enterprise-surface-registry.v1`
- Enterprise Surface: `xtend.rmt.vnext-enterprise-surface.v1`
- Report Schema: `xtend.rmt.vnext-enterprise-surface-registry-report.v1`
- Workpackage: `WP-E16-03`
- Depends on:
  - `xtend.rmt.vnext-remote-surfaces-threat-model.v1`
  - `xtend.rmt.vnext-remote-surface-manifest.v1`
  - `xtend.rmt.vnext-surface-registry.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `no-implicit-global-event-bus`
- Zielzustand: `rmt-vnext-enterprise-registry-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json`
- Package Script: `npm run test:rmt-vnext-enterprise-registry`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-enterprise-surface-registry.v1"
```

Dieser Contract erweitert die lokale vNext `surface.registry` zu einem Enterprise-Snapshot. Der Snapshot macht lokale und remote Surfaces gemeinsam auffindbar, besitzbar, versionierbar und fuer Operatoren, Tooling und AI-Agenten auswertbar.

Die Registry fuehrt keine Remote Runtime aus. Sie kombiniert host-neutrale Surface Records, Remote Surface Manifeste und Enterprise-Katalogfakten zu einem deterministischen Discoverability Report.

## Enterprise Surface Record

```json
{
  "schema": "xtend.rmt.vnext-enterprise-surface.v1",
  "enterpriseSurfaceId": "enterpriseSurface:remote:checkout.cart",
  "surfaceId": "remoteSurface:checkout.cart",
  "name": "checkout.cart",
  "kind": "remote",
  "type": "remote",
  "owner": {
    "kind": "team",
    "id": "checkout-platform",
    "known": true
  },
  "version": {
    "active": "2.4.3",
    "expected": "^2.4.0",
    "range": "^2.4.0",
    "status": "declared"
  },
  "remote": {
    "enabled": true,
    "manifestId": "remoteManifest:checkout.cart",
    "remoteId": "@xtend/checkout-cart",
    "origin": "https://cdn.xtend.example",
    "trustBoundary": "xtend.security.remote-surface.v1",
    "status": "ready"
  },
  "shellTargets": [
    {
      "lane": "critical",
      "target": "shell.slot:sidebar.cart",
      "mode": "mount"
    }
  ],
  "events": {
    "emits": [],
    "consumes": []
  },
  "dataSources": [],
  "capabilities": [
    "surface.mount"
  ],
  "fallback": {
    "kind": "surface",
    "ref": "checkout.cart.fallback"
  },
  "discoverability": {
    "discoverable": true,
    "source": "remote-surface-manifest",
    "operatorLabel": "checkout-platform:checkout.cart",
    "registryRef": "remoteManifest:checkout.cart"
  },
  "status": "ready",
  "diagnostics": []
}
```

## Registry Snapshot

```json
{
  "schema": "xtend.rmt.vnext-enterprise-surface-registry.v1",
  "surfaceCount": 7,
  "localSurfaceCount": 6,
  "remoteSurfaceCount": 1,
  "ownerCount": 7,
  "shellTargetCount": 8,
  "versionedSurfaceCount": 7,
  "discoverability": {
    "mode": "host-neutral",
    "operatorReady": true,
    "surfaceIds": [],
    "ownerIds": [],
    "shellTargets": []
  },
  "indexes": {
    "byKind": {},
    "byOwner": {},
    "byStatus": {},
    "byShellTarget": {}
  },
  "surfaces": [],
  "diagnostics": []
}
```

## Pflichtfakten

Jede Enterprise Surface braucht:

- Owner
- aktive und erwartete Version
- Shell Target
- Discoverability Record
- Status
- fuer Remote Surfaces: Manifest ID, Remote ID, Origin, Integrity, Trust Boundary, Capabilities und Fallback

## Diagnostics

| Code | Bedeutung |
| --- | --- |
| `rmt.vnext.enterprise_registry.owner_missing` | Surface besitzt keinen Enterprise Owner |
| `rmt.vnext.enterprise_registry.version_missing` | Surface hat keine aktive und erwartete Version |
| `rmt.vnext.enterprise_registry.shell_target_missing` | Surface ist nicht an ein Shell Target gebunden |
| `rmt.vnext.enterprise_registry.remote_manifest_blocked` | Remote Manifest ist blockiert und darf nicht als ready registriert werden |
| `rmt.vnext.enterprise_registry.surface_duplicate` | Surface taucht doppelt in derselben Registry auf |

## Artefakte

| Artefakt | Pfad |
| --- | --- |
| Modul | `tools/rmt-language/vnext-enterprise-registry.js` |
| Suite | `tests/rmt-language/rmt_vnext_enterprise_registry_suite.js` |
| Fixture | `tests/rmt-language/fixtures/vnext-enterprise-registry-fixture.json` |
| Workpackage | `development/WP-E16-03-Enterprise-surface-registry-fuer-Ownership-und-Discoverability-ausbauen.md` |

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json
```

Das Gate prueft lokale und remote Surface Discoverability, Owner-, Version- und ShellTarget-Pflichten, blockierte Remote Manifeste, Duplicate Detection, Package-Metadaten, Runner-Integration und deterministische Serialisierung.
