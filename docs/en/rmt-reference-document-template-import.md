# RMT Reference: Document, Template and Import

The parser implementation for these forms lives in `tools/rmt-language/vnext-parser.js`.

This page describes the outer document shape of RMT vNext.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="import"></a>`import` | `import "./shared.rmt"` | Top-level and inside `template` | static string path | Includes static RMT sources in the document model. | Import paths must be strings. | `template` |
| <a id="template"></a>`template` | `template app.shell { ... }` | Top-level | qualified identifier | Starts an app or shell context with owned declarations. | Templates may contain imports, surfaces and App Platform primitives only. | `surface`, `state`, `action` |
| <a id="surface-top-level"></a>`surface` | `surface root { ... }` | Top-level or inside `template` | qualified identifier, optional `kind`, `component` | Declares a host-neutral UI surface. | Surfaces may contain surface clauses, lanes and event bindings only. | `lane`, `portal` |
| <a id="remote-surface-top-level"></a>`remote surface` | `remote surface cart from remote "@scope/cart" { ... }` | Top-level | surface identifier, remote ID string | Declares an external surface with owner, version, origin and fallback facts. | Remote surfaces require static remote and security facts. | `fallback surface`, `exposes lane` |

## Allowed contexts

`import`, `template`, `surface` and `remote surface` are the normal top-level operators. Primitive declarations may also be top-level, but app sources usually group them in a `template`.

## Parameters

- `name`: qualified identifier such as `docs.shell`.
- `remote`: static string for package, manifest or remote ID.
- `kind` and `component`: inline attributes for surface type and host component.

## Description

An RMT document does not describe imperative execution. It describes records that parsers, compilers, schedulers and host adapters can process.

## Examples

```rmt
import "./shared.rmt"

template reference.document {
  portal app.root root "#app" layer surface

  surface home kind page component x-section {
    portal app.root
    lane visible weight 80 {
      mount home.content from endpoint app.home
    }
  }
}
```

## Diagnostics

Unexpected top-level tokens produce syntax diagnostics. Imperative words such as `if`, `for`, `return` or `async` are rejected intentionally.

## Related operators

`portal`, `lane`, `mount`, `remote surface`, `owner team`, `trust boundary`.

## Related reading

The RMT reference index connects document, template, and import syntax with the other grammar families. [Related article](./rmt-reference.md)
