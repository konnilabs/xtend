# WP-E16-07 - Event Ownership, Delivery Policy und Governance Diagnostics bauen

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Epic Contract: `xtend.rmt.vnext-remote-surfaces.v1`
- WP Contract: `xtend.epic16.wp07.event-governance.v1`
- Event Governance Contract: `xtend.rmt.vnext-event-governance-policy.v1`
- Governance Event Record: `xtend.rmt.vnext-event-governance-event.v1`
- Boundary: `no-implicit-global-event-bus`
- Zielzustand: `rmt-vnext-event-governance-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-event-governance --json`

## Ziel

`WP-E16-07` macht Cross Surface Events operativ kontrollierbar. Das Paket definiert Delivery Policies, Ownership-Regeln und Governance Diagnostics auf Basis des akzeptierten Cross Surface Event Protocols.

Die wichtigste Entscheidung:

- Governance Reports liefern keine Runtime Events aus.
- Fehlende Delivery Policies blockieren im strikten Gate.
- Cross-Team-Kopplung braucht eine explizite, genehmigte Review-Entscheidung.
- Event-Version und Payload Schema gehoeren klar einem Owner.

## Umgesetzt

- Contract `xtend.rmt.vnext-event-governance-policy.v1` angelegt
- Governance Event Record `xtend.rmt.vnext-event-governance-event.v1` definiert
- Modul `tools/rmt-language/vnext-event-governance.js` erstellt
- Governance-Fixture mit Owner Catalog und Delivery Policies angelegt
- Gate-Suite `tests/rmt-language/rmt_vnext_event_governance_suite.js` erstellt
- Package Export, Script und Metadaten fuer `rmt-vnext-event-governance` verdrahtet
- Epic 16 auf `WP-E16-07` abgeschlossen gesetzt

## Contract-Fakten

Ein Event Governance Report enthaelt:

- Delivery Mode `sync`, `queued`, `replayable` oder `drop-if-stale`
- TTL in Millisekunden
- correlationId-Pflicht
- idempotencyKey-Pflicht
- Sensitivity Level `public`, `internal`, `confidential` oder `restricted`
- Owner Catalog fuer Event Namespace und Payload Schema
- Cross-Team-Coupling-Index
- Cross-Team-Review-Status
- Governance Diagnostics fuer CI und Review

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Governance Schema ist benannt | erfuellt: `xtend.rmt.vnext-event-governance-policy.v1` |
| Delivery Modes sind begrenzt | erfuellt |
| TTL ist im strikten Gate Pflicht | erfuellt |
| correlationId und idempotencyKey sind Pflicht | erfuellt |
| Sensitivity ist Pflicht | erfuellt |
| Event Owner ist gegen Owner Catalog pruefbar | erfuellt |
| Version Owner und Payload Owner sind pruefbar | erfuellt |
| Cross-Team-Kopplung ist sichtbar | erfuellt |
| Cross-Team-Review ist erzwingbar | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-event-governance --json
```

Ergebnis vom 12. Mai 2026:

- Status: `passed`
- Passes: `95`
- Failures: `0`

## Handoff

`WP-E16-07` ist abgeschlossen. `WP-E16-08` kann Parser, Compiler und Core-Erweiterungen fuer Remote Surfaces, Event Protocol und Governance-Fakten integrieren.
