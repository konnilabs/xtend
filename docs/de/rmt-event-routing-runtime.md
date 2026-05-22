# RMT Event Routing Runtime

- Contract: `xtend.epic18.rmt-event-routing-runtime.v1`
- Workpackage: `WP-E18-09`
- Runtime: `xtendrmt/rmt-event-routing-runtime.js`
- Types: `xtendrmt/rmt-event-routing-runtime.d.ts`
- Fixture: `tests/fixtures/rmt-event-routing-runtime.rmt`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-event-routing-runtime --json`
- Naechstes Paket: `WP-E18-10`

## Zweck

Die Event Routing Runtime macht DOM- und Custom Events zu nativen RMT-App-Platform-Primitives. Apps koennen Events deklarativ an Actions binden, Payloads vor der Action-Ausfuehrung validieren, Governance-Policies anwenden und Listener nach Owner-Scope bereinigen.

Die Runtime delegiert die Ausfuehrung an die Action Effect Runtime aus `WP-E18-08`. Sie erzeugt kein zweites Action-Framework und importiert keine XTend-UI-Komponenten.

## Event Bindings

Ein Event Binding kann deklarieren:

- `event`
- `target`
- `component`
- `owner`
- `action`
- `actionMode`
- `payload`
- `payloadContract`
- `governance`
- `condition`

Targets werden ueber explizite Refs, eine uebergebene `targets` Map, einen eigenen Target Resolver oder eine DOM-Query aus einem bereitgestellten Root aufgeloest. Produktlokale `event.target.closest(...)`-Delegationketten sind fuer normale App-Flows nicht erforderlich.

## Payload Contracts

Payloads werden aus Event-Daten mit Ausdruecken wie diesen gebaut:

- `$event.target.value`
- `$detail.id`
- `$target.dataset.id`
- `$source.dataset.path`

Contracts nutzen eine kleine strukturelle Form:

```json
{
  "type": "object",
  "required": ["id"],
  "properties": {
    "id": "string"
  }
}
```

Ungueltige Payloads werden geblockt, bevor die Action Runtime aufgerufen wird, und emittieren `rmt.event.payload_contract.invalid` Diagnostics.

## Event Governance

Unterstuetzte Policies:

- `preventDefault`
- `stopPropagation`
- `stopImmediatePropagation`
- `capture`
- `passive`
- `once`
- `retarget`

Retargeting kann `target`, `current-target` oder `composed-path` verwenden. Dadurch bleibt Component-Interaktion explizit, ohne produktspezifisches DOM-Walking.

## Ownership

`attach()` registriert Listener und merkt sich ihren Owner. `detachOwner(ownerId)` entfernt nur die Listener fuer diesen Scope, waehrend `detachAll()` die verbleibenden Listener entfernt. Das ist die Bruecke zur Surface- und Resource-Lifecycle-Arbeit in `WP-E18-10`.

## Diagnostics

Diagnostics nutzen `xtend.epic18.rmt-event-routing-diagnostic.v1` auf `rmt.app_platform.event_routing`. Route Diagnostics enthalten Event-ID, Component, Payload und Action-Ziel, damit Build- und Runtime-Reports zeigen koennen, warum eine User-Interaktion ausgefuehrt wurde oder nicht.

## Handoff

`WP-E18-10` kann nun Surface-, Overlay-, Portal- und Resource-Graphs mit owner-scoped Events und dem Resource-Ownership-Modell aus `WP-E18-08` haerten.
