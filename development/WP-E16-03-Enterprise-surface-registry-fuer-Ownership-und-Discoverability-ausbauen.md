# WP-E16-03 - Enterprise surface.registry fuer Ownership und Discoverability ausbauen

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Epic Contract: `xtend.rmt.vnext-remote-surfaces.v1`
- WP Contract: `xtend.epic16.wp03.enterprise-surface-registry.v1`
- Registry Contract: `xtend.rmt.vnext-enterprise-surface-registry.v1`
- Enterprise Surface Record: `xtend.rmt.vnext-enterprise-surface.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `no-implicit-global-event-bus`
- Zielzustand: `rmt-vnext-enterprise-registry-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json`

## Ziel

`WP-E16-03` erweitert `surface.registry` zu einem Enterprise-Snapshot fuer lokale und remote Surfaces. Das Paket macht sichtbar, welche Surfaces existieren, wem sie gehoeren, welche Version aktiv ist, welche Shell Targets sie belegen und welche Remote Manifest Facts sie mitbringen.

Die wichtigste Entscheidung:

- Enterprise Registry ist Discoverability und Governance, keine Runtime.
- Lokale E15-Surfaces und E16-Remote-Manifeste werden in einem gemeinsamen Snapshot normalisiert.
- Owner, Version und Shell Target sind Pflichtfakten.

## Umgesetzt

- Contract `xtend.rmt.vnext-enterprise-surface-registry.v1` angelegt
- Enterprise Surface Record `xtend.rmt.vnext-enterprise-surface.v1` definiert
- Modul `tools/rmt-language/vnext-enterprise-registry.js` erstellt
- gemischtes Fixture mit lokalen und remote Surfaces angelegt
- Gate-Suite `tests/rmt-language/rmt_vnext_enterprise_registry_suite.js` erstellt
- Package Export, Script und Metadaten fuer `rmt-vnext-enterprise-registry` verdrahtet
- Epic 16 auf `WP-E16-03` abgeschlossen gesetzt

## Contract-Fakten

Ein Enterprise Surface Record enthaelt:

- Surface ID, Name, Kind und Typ
- Owner mit Team-ID
- aktive und erwartete Version
- Remote Manifest Fakten fuer Remote Surfaces
- Shell Targets mit Lane-Bezug
- Events, Data Sources und Capabilities als explizite Arrays
- Fallback fuer Remote Surfaces
- Discoverability Record fuer Operatoren, Tooling und Agenten
- stabile Diagnostics

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Enterprise Registry Schema ist benannt | erfuellt: `xtend.rmt.vnext-enterprise-surface-registry.v1` |
| Enterprise Surface Record ist benannt | erfuellt: `xtend.rmt.vnext-enterprise-surface.v1` |
| lokale und remote Surfaces werden zusammengefuehrt | erfuellt |
| Owner sind Pflicht | erfuellt |
| Versionen sind Pflicht | erfuellt |
| Shell Targets sind Pflicht | erfuellt |
| blockierte Remote Manifeste blockieren Registry | erfuellt |
| Registry bleibt host-neutral | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-enterprise-registry --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `79`
- Failures: `0`
- Warnings: `0`

## Handoff

`WP-E16-03` ist abgeschlossen. `WP-E16-04` kann Versionierung, Compatibility und Graceful Degradation auf Basis der Enterprise Registry modellieren. `WP-E16-06` kann parallel das Cross Surface Event Protocol auf den registrierten Surface-, Lane- und Shell-Scopes aufbauen.
