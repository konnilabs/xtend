# RMT vNext Cross Surface Events

Cross Surface Events verbinden Bereiche der App Shell, ohne einen impliziten
globalen Event Bus einzufuehren. Jede Richtung, jedes Ziel und jedes Payload-
Schema wird explizit beschrieben und durch Governance-Diagnostics abgesichert.
Boundary: no implicit global Event Bus.

## Contract

```js
schema: "xtend.rmt.vnext-cross-surface-event-protocol.v1"
reportSchema: "xtend.rmt.vnext-cross-surface-event-report.v1"
governanceSchema: "xtend.rmt.vnext-event-governance-policy.v1"
```

Ein Event muss definieren:

- `event` als versionierter Name, zum Beispiel `checkout.cart.updated.v1`.
- `owner` als Team fuer Event- und Versionspflege.
- `payload.schema` als stabile Payload-ID.
- `direction` als `outbound` oder `inbound`.
- `scope` als Lane-, Surface- oder Shell-Target-Bindung.
- `delivery` mit TTL, Korrelation und Idempotenz, wenn erforderlich.

## Direction

`emits` beschreibt ausgehende Events einer Surface. `consumes` beschreibt
eingehende Events. Die Shell darf diese Bindings weiterleiten, aber nicht frei
interpretieren. Dadurch bleibt sichtbar, ob eine User-Aktion mehrere Bereiche
der Shell tangiert.

## Scope

Events sind auf Lanes und Shell Targets begrenzt:

```rmt
emits checkout.cart.updated.v1 {
  owner: "checkout-platform"
  payload: "xtend.schemas.cartUpdated.v1"
  direction: outbound
  scope: lane critical -> shell.slot:sidebar.cart
}
```

Ein Event ohne klaren Scope wird im E16-Gate blockiert oder diagnostiziert. Das
verhindert denselben impliziten Kopplungsdruck, der Micro-Frontend-Systeme ohne
Disziplin schwer wartbar macht.

## Governance

Das Governance-Modell prueft:

- Event Owner und Payload Owner.
- Cross-Team-Events.
- Delivery Mode, TTL, `correlationId` und `idempotencyKey`.
- Sensitivity und Review-Pflichten.
- Degradation-Verhalten fuer Events einer blockierten oder degradierten Surface.

## Gates

```bash
node scripts/run_xtend_tests.js rmt-vnext-cross-surface-events --json
node scripts/run_xtend_tests.js rmt-vnext-event-governance --json
node scripts/run_xtend_tests.js rmt-vnext-enterprise-release --json
```

Die Enterprise Demo deckt `checkout.cart.updated.v1` und
`user.session.changed.v1` als typisierte, gerichtete Cross-Surface-Events ab.
