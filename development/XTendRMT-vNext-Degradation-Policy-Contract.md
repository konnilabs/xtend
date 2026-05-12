# XTendRMT vNext Degradation Policy Contract

- Status: `accepted by WP-E16-04`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Contract: `xtend.rmt.vnext-degradation-policy.v1`
- Degradation Surface: `xtend.rmt.vnext-degradation-surface.v1`
- Report Schema: `xtend.rmt.vnext-degradation-report.v1`
- Workpackage: `WP-E16-04`
- Depends on:
  - `xtend.rmt.vnext-enterprise-surface-registry.v1`
  - `xtend.rmt.vnext-remote-surface-manifest.v1`
  - `xtend.rmt.vnext-compatibility-matrix.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`
- Zielzustand: `rmt-vnext-degradation-policy-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-degradation --json`
- Package Script: `npm run test:rmt-vnext-degradation`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-degradation-policy.v1"
```

Dieser Contract macht Versionierung und Graceful Degradation zu einem pruefbaren Qualitaetsmerkmal. Enterprise Surfaces erhalten einen deterministischen Report ueber Shell-Kompatibilitaet, Version Range, Capabilities, Fallback Resolution und Event-/DataSource-Verhalten unter Degradation.

## Zustandsmodell

| State | Bedeutung |
| --- | --- |
| `full` | Version, Shell und Capabilities passen vollstaendig |
| `compatible` | keine Pflichtverletzung, aber optionale Capabilities fehlen |
| `degraded` | Pflichtverletzung ist vorhanden, aber ein Fallback oder kontrolliertes Verhalten ist verfuegbar |
| `blocked` | Surface darf nicht als betriebsfaehig gelten |

## Degradation Surface Record

```json
{
  "schema": "xtend.rmt.vnext-degradation-surface.v1",
  "enterpriseSurfaceId": "enterpriseSurface:remote:checkout.cart",
  "state": "degraded",
  "version": {
    "active": "3.0.0",
    "expected": "^2.4.0",
    "satisfies": false,
    "status": "mismatch"
  },
  "capabilities": {
    "required": ["surface.mount"],
    "optional": ["data.prefetch"],
    "missingRequired": [],
    "missingOptional": ["data.prefetch"]
  },
  "fallbackResolution": {
    "required": true,
    "resolved": true,
    "fallback": {
      "kind": "surface",
      "ref": "checkout.cart.fallback"
    }
  },
  "events": {
    "mode": "allow-safe",
    "allowed": ["checkout.cart.updated.v1"],
    "blocked": ["user.session.changed.v1"]
  },
  "dataSources": {
    "mode": "read-only",
    "count": 0,
    "blocked": []
  },
  "diagnostics": []
}
```

## Diagnostics

| Code | Bedeutung |
| --- | --- |
| `rmt.vnext.degradation.version_mismatch` | aktive Version erfuellt die erwartete Range nicht |
| `rmt.vnext.degradation.shell_version_unsupported` | aktive Shell-Version ist zu alt |
| `rmt.vnext.degradation.capability_missing` | verpflichtende Capability fehlt |
| `rmt.vnext.degradation.fallback_missing` | Remote Surface hat keinen aufloesbaren Fallback |
| `rmt.vnext.degradation.registry_surface_blocked` | Surface ist bereits im Enterprise Registry Snapshot blockiert |
| `rmt.vnext.degradation.event_restricted` | Event-Fluss wird unter Degradation eingeschraenkt |

Versionierungsfehler werden als `error` diagnostiziert. Ein Report darf trotzdem `degraded` bleiben, wenn ein Fallback und ein kontrolliertes Degradation-Verhalten verfuegbar sind.

## Artefakte

| Artefakt | Pfad |
| --- | --- |
| Modul | `tools/rmt-language/vnext-degradation.js` |
| Suite | `tests/rmt-language/rmt_vnext_degradation_suite.js` |
| Fixture | `tests/rmt-language/fixtures/vnext-degradation-policy-fixture.json` |
| Workpackage | `development/WP-E16-04-Versionierung-Compatibility-und-Graceful-Degradation-modellieren.md` |

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-degradation --json
```

Das Gate prueft State-Modell, Version Range, Shell-Version, Required/Optional Capabilities, Remote-Fallback-Pflicht, Event-Einschraenkung, Package-Metadaten, Runner-Integration und deterministische Serialisierung.
