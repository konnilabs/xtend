# RMT Reference: Remote Surfaces

Remote Surfaces beschreiben externe UI-Flächen mit Owner-, Version-, Origin-, Integrity-, Trust- und Event-Fakten.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="from-remote"></a>`from remote` | `remote surface cart from remote "@scope/cart"` | `remote surface` Header | statischer String | Referenziert Remote-Package oder Manifest. | Remote-ID muss String sein. | `remote surface` |
| <a id="owner-team"></a>`owner team` | `owner team "checkout-platform"` | Remote Surface, Remote Event | Owner-ID | Setzt Enterprise-Ownership. | Owner muss String sein. | `version` |
| <a id="version"></a>`version` | `version "^2.4.0"` | Remote Surface | String | Dokumentiert erwartete Version oder Range. | Wert muss String sein. | `origin` |
| <a id="origin"></a>`origin` | `origin "https://cdn.example"` | Remote Surface | String | Setzt erlaubte Remote-Origin. | Wert muss String sein. | `integrity sha256` |
| <a id="integrity-sha256"></a>`integrity sha256` | `integrity sha256 "abc123"` | Remote Surface | Algorithmus, Digest | Bindet Artefakt-Integrität. | Digest muss String sein. | `trust boundary` |
| <a id="fallback-surface"></a>`fallback surface` | `fallback surface checkout.fallback` | Remote Surface | Surface-Referenz | Deklariert lokale Degradation. | Fallback-Surface muss referenzierbar sein. | `surface` |
| <a id="exposes-lane"></a>`exposes lane ->` | `exposes lane visible -> shell.slot "checkout"` | Remote Surface | Lane, Shell-Target | Bindet Remote-Lane an Shell-Ziel. | `->` und Shell-Target sind Pflicht. | `lane` |
| <a id="emits"></a>`emits` | `emits checkout.updated.v1 { ... }` | Remote Surface | Eventname | Deklariert ausgehendes Cross-Surface-Event. | Event braucht Richtung und Payload. | `direction outbound` |
| <a id="consumes"></a>`consumes` | `consumes user.changed.v1 { ... }` | Remote Surface | Eventname | Deklariert eingehendes Cross-Surface-Event. | Event braucht Richtung und Payload. | `direction inbound` |
| <a id="direction-outbound"></a>`direction outbound` | `direction outbound` | Remote Event | Richtung | Markiert ausgehendes Event. | Nur `outbound` oder `inbound` erlaubt. | `emits` |
| <a id="direction-inbound"></a>`direction inbound` | `direction inbound` | Remote Event | Richtung | Markiert eingehendes Event. | Nur `outbound` oder `inbound` erlaubt. | `consumes` |
| <a id="from-shell-session"></a>`from shell.session` | `from shell.session` | Remote Event | Shell-Scope | Bindet Event an Shell-Session-Scope. | Source-Scope muss parsebar sein. | `payload` |
| <a id="remote-payload"></a>remote `payload` | `payload "xtend.schemas.event.v1"` | Remote Event | String-Schema | Deklariert Payload-Schema für Remote-Events. | Payload-Schema muss String sein. | `emits`, `consumes` |

## Allowed contexts

Remote-Clauses stehen nur in `remote surface`. Remote-Event-Clauses stehen nur in `emits` oder `consumes`.

## Parameters

Remote-Fakten sind absichtlich statisch: Strings, Identifier, Lane-Namen und Shell-Targets.

## Description

Remote Surface Syntax erlaubt Discovery und Degradation, ohne Remote-Code im RMT-Kernel auszuführen.

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

Fehlende Owner-, Version-, Origin-, Integrity-, Trust-, Fallback- oder Payload-Fakten blockieren Remote-Tooling und Security-Berichte.

## Related operators

`surface`, `lane`, `trust boundary`, `fallback`, `emits`, `consumes`.
