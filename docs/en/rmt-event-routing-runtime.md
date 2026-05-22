# RMT Event Routing Runtime

- Contract: `xtend.epic18.rmt-event-routing-runtime.v1`
- Workpackage: `WP-E18-09`
- Runtime: `xtendrmt/rmt-event-routing-runtime.js`
- Types: `xtendrmt/rmt-event-routing-runtime.d.ts`
- Fixture: `tests/fixtures/rmt-event-routing-runtime.rmt`
- Local gate: `node scripts/run_xtend_tests.js rmt-event-routing-runtime --json`
- Next: `WP-E18-10`

## Purpose

The Event Routing Runtime makes DOM and custom events first-class RMT app
platform primitives. Apps can bind events to actions declaratively, validate
payloads before action execution, apply governance policies and clean up
listeners by owner scope.

The runtime delegates execution to the Action Effect Runtime from `WP-E18-08`.
It does not create a second action framework and does not import XTend UI
components.

## Event Bindings

An event binding can declare:

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

Targets are resolved through explicit refs, a passed `targets` map, a custom
target resolver or a DOM query from a provided root. Product-local
`event.target.closest(...)` delegation chains are not required for normal app
flows.

## Payload Contracts

Payloads are built from event data with expressions such as:

- `$event.target.value`
- `$detail.id`
- `$target.dataset.id`
- `$source.dataset.path`

Contracts use a small structural shape:

```json
{
  "type": "object",
  "required": ["id"],
  "properties": {
    "id": "string"
  }
}
```

Invalid payloads are blocked before the action runtime is called and emit
`rmt.event.payload_contract.invalid` diagnostics.

## Event Governance

Supported policies:

- `preventDefault`
- `stopPropagation`
- `stopImmediatePropagation`
- `capture`
- `passive`
- `once`
- `retarget`

Retargeting can use `target`, `current-target` or `composed-path`. This keeps
component interaction explicit without product-specific DOM walking.

## Ownership

`attach()` registers listeners and records their owner. `detachOwner(ownerId)`
removes only the listeners for that scope, while `detachAll()` removes the
remaining listeners. This is the bridge to the surface and resource lifecycle
work in `WP-E18-10`.

## Diagnostics

Diagnostics use `xtend.epic18.rmt-event-routing-diagnostic.v1` on
`rmt.app_platform.event_routing`. Route diagnostics include event id, component,
payload and action target so build and runtime reports can show why a user
interaction did or did not execute.

## Handoff

`WP-E18-10` can now harden surface, overlay, portal and resource graphs using
owner-scoped events plus the resource ownership model from `WP-E18-08`.
