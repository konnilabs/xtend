# WP-E16-06 - Cross Surface Event Protocol fuer Lane- und Shell-Scopes definieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Epic Contract: `xtend.rmt.vnext-remote-surfaces.v1`
- WP Contract: `xtend.epic16.wp06.cross-surface-event-protocol.v1`
- Cross Surface Event Protocol: `xtend.rmt.vnext-cross-surface-event-protocol.v1`
- Event Record: `xtend.rmt.vnext-cross-surface-event.v1`
- Binding Record: `xtend.rmt.vnext-cross-surface-event-binding.v1`
- Boundary: `no-implicit-global-event-bus`
- Zielzustand: `rmt-vnext-cross-surface-events-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json`

## Ziel

`WP-E16-06` definiert Cross Surface Events als explizites, typisiertes und scoping-bewusstes Protokoll. Events sind nicht an den SurfaceManager gekoppelt und bilden keinen impliziten globalen Event Bus. Jede Binding-Projektion ist auf Surface, Lane oder Shell-Scope begrenzt.

Die wichtigste Entscheidung:

- Cross Surface Events brauchen Owner, Richtung, Version und Payload Schema.
- `outbound` und `inbound` sind die einzigen gueltigen Richtungen.
- Globale Event-Wildcards sind im produktiven Protokoll verboten.
- Der RMT-Kernel fuehrt keine Events aus und laedt keine Runtime.

## Umgesetzt

- Contract `xtend.rmt.vnext-cross-surface-event-protocol.v1` angelegt
- Event Record `xtend.rmt.vnext-cross-surface-event.v1` definiert
- Binding Record `xtend.rmt.vnext-cross-surface-event-binding.v1` definiert
- Modul `tools/rmt-language/vnext-cross-surface-events.js` erstellt
- Fixture fuer Checkout-/Session-Cross-Surface-Events angelegt
- Enterprise Registry Fixture um lokale Event-Discoverability erweitert
- Gate-Suite `tests/rmt-language/rmt_vnext_cross_surface_events_suite.js` erstellt
- Package Export, Script und Metadaten fuer `rmt-vnext-cross-surface-events` verdrahtet
- Epic 16 auf `WP-E16-06` abgeschlossen gesetzt

## Contract-Fakten

Ein Cross Surface Event Report enthaelt:

- Event Owner
- Event Version
- Payload Schema
- Binding-Richtung `outbound` oder `inbound`
- Surface-, Lane-, `shell.slot`-, `shell.route`- und `shell.session`-Scopes
- Pairing zwischen Producer und Consumer
- Scope-, Owner-, Surface- und Direction-Diagnostics
- Kernel Boundary mit `remoteRuntimeExecution: false`

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Cross Surface Event Schema ist benannt | erfuellt: `xtend.rmt.vnext-cross-surface-event-protocol.v1` |
| `emits`/`consumes` Richtung ist eindeutig | erfuellt: `outbound` und `inbound` |
| Owner ist Pflicht | erfuellt |
| Payload Schema ist Pflicht | erfuellt |
| Event-Version ist Pflicht | erfuellt |
| Shell- und Lane-Scopes sind referenziell pruefbar | erfuellt |
| globaler Event Bus ist verboten | erfuellt |
| Producer/Consumer-Pairing ist pruefbar | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json
```

Ergebnis vom 12. Mai 2026:

- Status: `passed`
- Passes: `94`
- Failures: `0`

## Handoff

`WP-E16-06` ist abgeschlossen. `WP-E16-07` kann Event Ownership, Delivery Policy und Governance Diagnostics auf dem typisierten Protokoll aufbauen. `WP-E16-08` kann Parser, Compiler und Core-Erweiterungen fuer Remote Surfaces integrieren.
