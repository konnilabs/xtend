# WP-E16-02 - Remote Surface Manifest und Core Contract definieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Epic Contract: `xtend.rmt.vnext-remote-surfaces.v1`
- WP Contract: `xtend.epic16.wp02.remote-surface-manifest-core.v1`
- Manifest Contract: `xtend.rmt.vnext-remote-surface-manifest.v1`
- Remote Surface Record: `xtend.rmt.vnext-remote-surface.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`
- Zielzustand: `rmt-vnext-remote-manifest-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json`

## Ziel

`WP-E16-02` definiert Remote Surface Manifeste als host-neutrale, auditierbare Contract Records. Das Paket schafft die Grundlage fuer Enterprise `surface.registry`, Degradation, Remote Security und Cross Surface Events.

Die wichtigste Entscheidung:

- Remote Surface Manifeste sind Daten, keine Runtime Loader.
- Der RMT-Kernel normalisiert, validiert, serialisiert und diagnostiziert Manifest Records.
- Host-Adapter bleiben fuer Laden, Mounting, Caching, Isolation und Telemetrie verantwortlich.

## Umgesetzt

- Contract `xtend.rmt.vnext-remote-surface-manifest.v1` angelegt
- Remote Surface Core Record `xtend.rmt.vnext-remote-surface.v1` definiert
- Modul `tools/rmt-language/vnext-remote-manifest.js` erstellt
- Fixtures fuer gueltige und ungueltige Remote Manifeste angelegt
- Gate-Suite `tests/rmt-language/rmt_vnext_remote_manifest_suite.js` erstellt
- Package Export, Script und Metadaten fuer `rmt-vnext-remote-manifest` verdrahtet
- Epic 16 auf `WP-E16-02` abgeschlossen und `WP-E16-03` startbar gesetzt

## Contract-Fakten

Ein gueltiger Remote Surface Record enthaelt:

- Owner
- Remote ID
- Origin
- Version Range
- Integrity mit `sha256`, `sha384` oder `sha512`
- Remote Trust Boundary
- Shell-/Lane-Bindings
- explizite Capabilities
- host-owned Adapter Boundary
- Fallback Surface
- Runtime Boundary mit `kernelRemoteExecution: false`

## Diagnostics

Das Paket blockiert fehlende oder implizite Manifest-Fakten mit stabilen Codes:

- `rmt.vnext.remote.owner_missing`
- `rmt.vnext.remote.version_missing`
- `rmt.vnext.remote.origin_missing`
- `rmt.vnext.remote.integrity_missing`
- `rmt.vnext.remote.trust_boundary_missing`
- `rmt.vnext.remote.capability_missing`
- `rmt.vnext.remote.capability_implicit`
- `rmt.vnext.remote.adapter_boundary_missing`
- `rmt.vnext.remote.exposes_missing`
- `rmt.vnext.remote.fallback_missing`

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Manifest Schema ist benannt | erfuellt: `xtend.rmt.vnext-remote-surface-manifest.v1` |
| Remote Surface Core Record ist benannt | erfuellt: `xtend.rmt.vnext-remote-surface.v1` |
| Owner, Version, Origin und Integrity sind Pflicht | erfuellt |
| Adapter Boundary ist Pflicht | erfuellt |
| Runtime Loader bleibt ausserhalb des Kernels | erfuellt |
| Positive und negative Fixtures existieren | erfuellt |
| Package Script und Runner sind verdrahtet | erfuellt |
| `WP-E16-03` ist startbar | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-remote-manifest --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `69`
- Failures: `0`
- Warnings: `0`

## Handoff

`WP-E16-02` ist abgeschlossen. `WP-E16-03` kann die Enterprise `surface.registry` auf Basis der Manifest Records ausbauen.

Die naechste Umsetzung soll den Manifest Record nicht neu erfinden, sondern ihn als Input fuer Registry Ownership, Discoverability, aktive Versionen, Shell Targets, Events und Fallbacks nutzen.
