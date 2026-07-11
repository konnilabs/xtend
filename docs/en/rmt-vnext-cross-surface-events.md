# RMT Cross Surface Events

Events between surfaces without loose global event coupling.

## What it covers

Cross-surface events carry named payloads between separate surface owners. Registry, version, and receiver policy prevent arbitrary DOM events from becoming a global application bus.

## Public building blocks

- `tools/rmt-language/vnext-cross-surface-events.js` normalizes event contracts.
- `tests/rmt-language/fixtures/vnext-cross-surface-events-fixture.json` contains accepted and refused cases.
- `xtend.rmt.vnext-cross-surface-events.v1` versions the report.

## Recommended workflow

Define owner, event name, version, and payload schema. Register the receiver explicitly and treat unknown versions or capabilities as a refusal with a local fallback.

## Next steps

- [XTendRMT overview](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT vNext Remote Surfaces](./rmt-vnext-remote-surfaces.md)
- [RMT vNext Enterprise MFE contract](./rmt-vnext-remote-surfaces.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Event protocol

Cross-surface events use `xtend.rmt.vnext-cross-surface-event-protocol.v1`. Governance rules, owners, versions and allowed target scopes are checked through `xtend.rmt.vnext-event-governance-policy.v1`. That keeps the boundary clear: surfaces may signal each other, but there is `no implicit global Event Bus`.

The Enterprise fixture uses two stable event names:

- `checkout.cart.updated.v1`
- `user.session.changed.v1`

These names are part of the public contract because host adapters, telemetry and regression gates must find them again. If an event is renamed, update the fixture, Core output, governance policy and browser smoke together.

## Minimal event path

```rmt
event checkout.cart.updated.v1 {
  from surface checkout.cart
  to surface commerce.summary
  payload contract checkout.cart.payload.v1
}
```

Check event changes locally:

```bash
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events rmt-vnext-event-governance --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

If the governance gate fails, fix the owner, payload contract or target surface first. A host-side event bus must not hide the error.
