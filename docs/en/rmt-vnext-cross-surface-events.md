# RMT vNext Cross Surface Events

Cross-surface events connect areas of the app shell without introducing an implicit global event bus. Every direction, target and payload schema is described explicitly and secured through governance diagnostics. Boundary: no implicit global event bus.

## Contract

```js
schema: "xtend.rmt.vnext-cross-surface-event-protocol.v1"
reportSchema: "xtend.rmt.vnext-cross-surface-event-report.v1"
governanceSchema: "xtend.rmt.vnext-event-governance-policy.v1"
```

An event must define:

- `event` as a versioned name, for example `checkout.cart.updated.v1`.
- `owner` as the team responsible for event and version maintenance.
- `payload.schema` as stable payload ID.
- `direction` as `outbound` or `inbound`.
- `scope` as lane, surface or shell target binding.
- `delivery` with TTL, correlation and idempotency when required.

## Direction

`emits` describes outbound events from a surface. `consumes` describes inbound events. The shell may forward these bindings, but not interpret them freely. This keeps it visible whether a user action affects several areas of the shell.

## Scope

Events are constrained to lanes and shell targets:

```rmt
emits checkout.cart.updated.v1 {
  owner: "checkout-platform"
  payload: "xtend.schemas.cartUpdated.v1"
  direction: outbound
  scope: lane critical -> shell.slot:sidebar.cart
}
```

An event without clear scope is blocked or diagnosed in the E16 gate. This prevents the same implicit coupling pressure that makes micro-frontend systems hard to maintain without discipline.

## Governance

The governance model checks:

- event owner and payload owner.
- cross-team events.
- delivery mode, TTL, `correlationId` and `idempotencyKey`.
- sensitivity and review obligations.
- degradation behavior for events from a blocked or degraded surface.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json
node scripts/run_xtend_tests.js rmt-vnext-event-governance --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

The enterprise demo covers `checkout.cart.updated.v1` and `user.session.changed.v1` as typed, directed cross-surface events.
