# RMT Reference: Security and Policies

Security and hydration policies live in lifecycle operation policy blocks.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="trust-boundary"></a>`trust boundary` | `trust boundary "xtend.security.sanitizing-boundary.v1"` | Lifecycle policy, remote surface | static string | Binds rendering or remote surface to a trust boundary. | Boundary must be a string. | `sanitize` |
| <a id="hydration-policy"></a>`hydration policy` | `hydration policy visible-only` | Lifecycle policy | policy identifier | Documents the hydration strategy. | Hydration must use `policy`, `mode` or `insular`. | `hydrate` |
| <a id="hydration-mode"></a>`hydration mode` | `hydration mode eager` | Lifecycle policy | mode identifier | Sets the hydration mode. | Wrong clause kind is reported. | `hydration policy` |
| <a id="hydration-insular"></a>`hydration insular` | `hydration insular true` | Lifecycle policy | boolean or identifier | Marks isolated hydration. | Value must be boolean or identifier. | `isolation boundary` |
| <a id="isolation-boundary"></a>`isolation boundary` | `isolation boundary "docs.preview"` | Lifecycle policy | string or identifier | Sets an isolation boundary. | Isolation must use `boundary` or `mode`. | `trust boundary` |
| <a id="isolation-mode"></a>`isolation mode` | `isolation mode strict` | Lifecycle policy | mode identifier | Sets isolation mode. | Wrong clause kind is reported. | `sanitize` |
| <a id="sanitize"></a>`sanitize` | `sanitize html` | Lifecycle policy | format identifier | Requires sanitizing for rendered content. | Format must be an identifier. | `trust boundary` |

## Allowed contexts

These operators appear in the policy block after `mount`, `hydrate`, `update`, `stream` or other lifecycle operations. `trust boundary` also appears in `remote surface`.

## Parameters

Trust boundaries are stable string identifiers. Hydration, isolation and sanitize values are static identifiers or booleans.

## Description

Policies describe security and hydration boundaries without executing host code in the RMT source.

## Examples

```rmt
template reference.security {
  portal app.root root "#app" layer surface

  surface preview kind page component x-section {
    portal app.root
    lane visible weight 80 {
      mount preview.body from endpoint docs.preview {
        trust boundary "xtend.security.sanitizing-boundary.v1"
        hydration policy visible-only
        hydration mode eager
        hydration insular true
        isolation boundary "docs.preview"
        isolation mode strict
        sanitize html
      }
    }
  }
}
```

## Diagnostics

Policy blocks allow only slots, event bindings, hydration, isolation and security policies. Other tokens are context errors.

## Related operators

`mount`, `hydrate`, `stream`, `remote surface`, `origin`, `integrity sha256`.
