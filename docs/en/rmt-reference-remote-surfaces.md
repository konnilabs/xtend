# RMT Reference: Remote Surfaces

Remote surfaces describe external UI areas with owner, version, origin, integrity, trust and event facts.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="from-remote"></a>`from remote` | `remote surface cart from remote "@scope/cart"` | `remote surface` header | static string | References remote package or manifest. | Remote ID must be a string. | `remote surface` |
| <a id="owner-team"></a>`owner team` | `owner team "checkout-platform"` | Remote surface, remote event | owner ID | Sets enterprise ownership. | Owner must be a string. | `version` |
| <a id="version"></a>`version` | `version "^2.4.0"` | Remote surface | string | Documents expected version or range. | Value must be a string. | `origin` |
| <a id="origin"></a>`origin` | `origin "https://cdn.example"` | Remote surface | string | Sets allowed remote origin. | Value must be a string. | `integrity sha256` |
| <a id="integrity-sha256"></a>`integrity sha256` | `integrity sha256 "abc123"` | Remote surface | algorithm, digest | Binds artifact integrity. | Digest must be a string. | `trust boundary` |
| <a id="fallback-surface"></a>`fallback surface` | `fallback surface checkout.fallback` | Remote surface | surface reference | Declares local degradation. | Fallback surface must be referenceable. | `surface` |
| <a id="exposes-lane"></a>`exposes lane ->` | `exposes lane visible -> shell.slot "checkout"` | Remote surface | lane, shell target | Binds a remote lane to a shell target. | `->` and shell target are required. | `lane` |
| <a id="emits"></a>`emits` | `emits checkout.updated.v1 { ... }` | Remote surface | event name | Declares outbound cross-surface event. | Event needs direction and payload. | `direction outbound` |
| <a id="consumes"></a>`consumes` | `consumes user.changed.v1 { ... }` | Remote surface | event name | Declares inbound cross-surface event. | Event needs direction and payload. | `direction inbound` |
| <a id="direction-outbound"></a>`direction outbound` | `direction outbound` | Remote event | direction | Marks outbound event. | Only `outbound` or `inbound` are allowed. | `emits` |
| <a id="direction-inbound"></a>`direction inbound` | `direction inbound` | Remote event | direction | Marks inbound event. | Only `outbound` or `inbound` are allowed. | `consumes` |
| <a id="from-shell-session"></a>`from shell.session` | `from shell.session` | Remote event | shell scope | Binds event to shell session scope. | Source scope must parse. | `payload` |
| <a id="remote-payload"></a>remote `payload` | `payload "xtend.schemas.event.v1"` | Remote event | string schema | Declares payload schema for remote events. | Payload schema must be a string. | `emits`, `consumes` |

## Allowed contexts

Remote clauses appear only in `remote surface`. Remote event clauses appear only in `emits` or `consumes`.

## Parameters

Remote facts are intentionally static: strings, identifiers, lane names and shell targets.

## Description

Remote surface syntax enables discovery and degradation without executing remote code in the RMT kernel.

## Examples

```rmt
remote surface checkout.cart from remote "@xtend/checkout-cart" {
  owner team "checkout-platform"
  version "^2.4.0"
  origin "https://cdn.xtend.example"
  integrity sha256 "abc123"
  trust boundary "xtend.security.remote-surface.v1"
  fallback surface checkout.cart.fallback
  exposes lane visible -> shell.slot "checkout"

  emits checkout.cart.updated.v1 {
    owner team "checkout-platform"
    direction outbound
    lane visible
    from shell.session
    payload "xtend.schemas.cartUpdated.v1"
  }

  consumes user.session.changed.v1 {
    owner team "identity-platform"
    direction inbound
    lane background
    from shell.session
    payload "xtend.schemas.sessionChanged.v1"
  }
}
```

## Diagnostics

Missing owner, version, origin, integrity, trust, fallback or payload facts block remote tooling and security reports.

## Related operators

`surface`, `lane`, `trust boundary`, `fallback`, `emits`, `consumes`.

## XScaler preflight

Remote surface hosts can validate scale-out readiness with [XScaler Protocol](./xscaler-protocol.md) before loading remote code. The preflight response complements owner, integrity, fallback and lane facts with SSR and XTension deployment compatibility.
