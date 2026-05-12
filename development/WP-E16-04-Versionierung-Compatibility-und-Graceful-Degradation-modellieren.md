# WP-E16-04 - Versionierung, Compatibility und Graceful Degradation modellieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Epic Contract: `xtend.rmt.vnext-remote-surfaces.v1`
- WP Contract: `xtend.epic16.wp04.degradation-policy.v1`
- Degradation Contract: `xtend.rmt.vnext-degradation-policy.v1`
- Degradation Surface Record: `xtend.rmt.vnext-degradation-surface.v1`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Boundary: `remote-surfaces-require-explicit-owner-version-integrity-and-fallback`
- Zielzustand: `rmt-vnext-degradation-policy-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-degradation --json`

## Ziel

`WP-E16-04` macht Degradation zum kontrollierten Enterprise-Qualitaetsmerkmal. Das Paket prueft Version Range, Shell-Version, Capability-Verfuegbarkeit, Fallback Resolution und Event-/DataSource-Verhalten auf Basis der Enterprise Registry.

Die wichtigste Entscheidung:

- Versionierungsfehler werden nicht als Warnung versteckt.
- Remote Surfaces ohne Fallback sind im strikten Modell blockiert.
- Degradation Reports bleiben host-neutral und agentenlesbar.

## Umgesetzt

- Contract `xtend.rmt.vnext-degradation-policy.v1` angelegt
- Degradation Surface Record `xtend.rmt.vnext-degradation-surface.v1` definiert
- Modul `tools/rmt-language/vnext-degradation.js` erstellt
- Fixture fuer Policy-, Shell- und Capability-Fakten angelegt
- Gate-Suite `tests/rmt-language/rmt_vnext_degradation_suite.js` erstellt
- Package Export, Script und Metadaten fuer `rmt-vnext-degradation` verdrahtet
- Epic 16 auf `WP-E16-04` abgeschlossen gesetzt

## Contract-Fakten

Ein Degradation Report enthaelt:

- States `full`, `compatible`, `degraded`, `blocked`
- Version Check gegen erwartete Range
- Shell-Version gegen `minShellVersion`
- Required und Optional Capability Checks
- Fallback Resolution
- Event Policy unter Degradation
- DataSource Policy unter Degradation
- stabile Diagnostics

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Degradation Schema ist benannt | erfuellt: `xtend.rmt.vnext-degradation-policy.v1` |
| Degradation Surface Record ist benannt | erfuellt |
| Zustandsmodell ist implementiert | erfuellt |
| Version Range wird geprueft | erfuellt |
| Remote Surface ohne Fallback blockiert | erfuellt |
| Capability Checks unterscheiden required/optional | erfuellt |
| Event-/DataSource-Verhalten unter Degradation ist sichtbar | erfuellt |
| Reports sind deterministisch serialisierbar | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-degradation --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `67`
- Failures: `0`
- Warnings: `0`

## Handoff

`WP-E16-04` ist abgeschlossen. `WP-E16-05` kann Remote Trust Boundaries, Manifest Integrity und Sandbox Policies auf dem Degradation-Modell haerten. `WP-E16-06` bleibt parallel startbar fuer das Cross Surface Event Protocol.
