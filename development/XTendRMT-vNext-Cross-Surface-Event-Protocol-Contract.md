# XTendRMT vNext Cross Surface Event Protocol Contract

- Status: `accepted by WP-E16-06`
- Datum: 12. Mai 2026
- Epic: `EPIC_E16_RMT_Remote_Surfaces_and_Surface_Registry`
- Contract: `xtend.rmt.vnext-cross-surface-event-protocol.v1`
- Event Record: `xtend.rmt.vnext-cross-surface-event.v1`
- Binding Record: `xtend.rmt.vnext-cross-surface-event-binding.v1`
- Report Schema: `xtend.rmt.vnext-cross-surface-event-report.v1`
- Workpackage: `WP-E16-06`
- Depends on:
  - `xtend.rmt.vnext-enterprise-surface-registry.v1`
  - `xtend.rmt.vnext-event-action-contract.v1`
  - `xtend.rmt.vnext-remote-security-policy.v1`
- Boundary: `no-implicit-global-event-bus`
- Boundary: `no-remote-runtime-execution-in-rmt-kernel`
- Zielzustand: `rmt-vnext-cross-surface-events-ready`
- Gate: `node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json`
- Package Script: `npm run test:rmt-vnext-cross-surface-events`

## Zweck

Contract marker:

```text
schema: "xtend.rmt.vnext-cross-surface-event-protocol.v1"
```

Dieser Contract beschreibt Cross Surface Events als explizites Protokoll zwischen Enterprise Surfaces. Er ersetzt keinen Runtime Event Bus und fuehrt keine Events aus. Er macht pruefbar, welche Surface ein Event ausgehend publiziert, welche Surface es eingehend konsumiert, welcher Owner und welches Payload Schema gelten und auf welchen Surface-, Lane- oder Shell-Scope der Fluss begrenzt ist.

## Event Record

```json
{
  "schema": "xtend.rmt.vnext-cross-surface-event.v1",
  "event": "checkout.cart.updated.v1",
  "owner": {
    "kind": "team",
    "id": "checkout-platform"
  },
  "version": "1.0.0",
  "payload": {
    "schema": "xtend.schemas.cartUpdated.v1"
  },
  "outboundCount": 1,
  "inboundCount": 2,
  "bindings": [
    {
      "schema": "xtend.rmt.vnext-cross-surface-event-binding.v1",
      "surfaceName": "checkout.cart",
      "direction": "outbound",
      "scopes": [
        {
          "type": "lane",
          "ref": "critical"
        },
        {
          "type": "shell.slot",
          "ref": "shell.slot:sidebar.cart"
        }
      ]
    }
  ]
}
```

## Required Controls

| Control | Regel |
| --- | --- |
| Owner | jedes Event und jede Binding-Projektion hat einen eindeutigen Owner |
| Richtung | nur `outbound` und `inbound` sind gueltig |
| Payload | jedes Event braucht ein Payload Schema |
| Version | jedes Event braucht eine Event-Version |
| Pairing | Cross Surface Events brauchen mindestens einen Producer und einen Consumer |
| Scope | Bindings muessen auf `surface`, `lane`, `shell.slot`, `shell.route` oder `shell.session` begrenzt sein |
| Global Bus | `*`, `global` und implizite Event-Busse sind verboten |
| Registry | Surface-, Lane- und Shell-Scope muessen gegen die Enterprise Registry oder deklarierte Shell-Fakten aufloesbar sein |

## Diagnostics

| Code | Bedeutung |
| --- | --- |
| `rmt.vnext.cross_surface_event.owner_missing` | Event oder Binding hat keinen Owner |
| `rmt.vnext.cross_surface_event.version_missing` | Event-Version fehlt |
| `rmt.vnext.cross_surface_event.payload_missing` | Payload Schema fehlt |
| `rmt.vnext.cross_surface_event.direction_invalid` | Richtung ist nicht `outbound` oder `inbound` |
| `rmt.vnext.cross_surface_event.scope_missing` | Binding hat keinen Scope |
| `rmt.vnext.cross_surface_event.scope_global_forbidden` | Binding nutzt globalen oder wildcardartigen Scope |
| `rmt.vnext.cross_surface_event.scope_unknown` | Scope ist nicht referenziell aufloesbar |
| `rmt.vnext.cross_surface_event.surface_unknown` | Surface ist nicht in der Enterprise Registry bekannt |
| `rmt.vnext.cross_surface_event.owner_conflict` | Binding Owner widerspricht dem Event Owner |
| `rmt.vnext.cross_surface_event.payload_conflict` | Bindings eines Events deklarieren unterschiedliche Payload Schemas |
| `rmt.vnext.cross_surface_event.pairing_missing` | Producer oder Consumer fehlt |
| `rmt.vnext.cross_surface_event.duplicate_binding` | Event, Surface und Richtung sind doppelt gebunden |

## Artefakte

| Artefakt | Pfad |
| --- | --- |
| Modul | `tools/rmt-language/vnext-cross-surface-events.js` |
| Suite | `tests/rmt-language/rmt_vnext_cross_surface_events_suite.js` |
| Fixture | `tests/rmt-language/fixtures/vnext-cross-surface-events-fixture.json` |
| Workpackage | `development/WP-E16-06-Cross-Surface-Event-Protocol-fuer-Lane-und-Shell-Scopes-definieren.md` |

## Gate

```bash
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json
```

Das Gate prueft Event Owner, Version, Payload Schema, Richtung, Pairing, Duplicate Bindings, globale Bus-Verbote, Scope-Aufloesung, Package-Metadaten, Runner-Integration und deterministische Serialisierung.
