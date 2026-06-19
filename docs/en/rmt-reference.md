# RMT Reference

This section is the thematic reference for RMT vNext. The learning path teaches the flow; the reference explains the exact meaning of each operator, keyword and fixed catalog value.

JSON-RMT is no longer the normal authoring path. It remains only as compatibility test material.

## Syntax

RMT vNext is block-based. A document consists of top-level declarations such as `import`, `template`, `surface`, `remote surface`, `state`, `selector`, `datasource`, `action`, `portal`, `overlay`, `resource`, `validation` and `transition`.

## Allowed contexts

Operators are context-sensitive. `lane` is only valid in `surface`, lifecycle operations such as `mount` and `hydrate` are only valid in `lane` or `slot`, and event payloads only belong in `on ... -> action` blocks.

## Parameters

Parameters are static values, identifiers, paths, strings, numbers, booleans, arrays or simple condition expressions. RMT vNext does not allow function calls in `when`.

## Description

- [Document, Template and Import](./rmt-reference-document-template-import.md)
- [Primitives](./rmt-reference-primitives.md)
- [State, Selectors and Data](./rmt-reference-state-selectors-data.md)
- [Actions and Events](./rmt-reference-actions-events.md)
- [Surfaces, Lanes and Lifecycle](./rmt-reference-surfaces-lanes-lifecycle.md)
- [Validation and Transitions](./rmt-reference-validation-transitions.md)
- [Security and Policies](./rmt-reference-security-policies.md)
- [Remote Surfaces](./rmt-reference-remote-surfaces.md)
- [Conditions and Expressions](./rmt-reference-conditions-expressions.md)
- [Enums and Catalogs](./rmt-reference-enums-catalogs.md)

Use this page as the index, then follow the domain pages when you need exact operator shape, diagnostics or a compilable example. The reference is intentionally stricter than the learning path: if a pattern is not described here, treat it as unavailable until a contract, compiler fixture and runtime gate are added.

## Examples

```rmt
template reference.overview {
  state app.status type object preserve {
    initial {
      text "Ready"
    }
  }

  selector app.statusView from state app.status {
    output StatusView
  }

  portal app.root root "#app" layer surface

  surface dashboard kind page component x-section {
    portal app.root
    lane visible weight 80 {
      hydrate status.card from selector app.statusView
    }
  }
}
```

## Diagnostics

The parser reports context errors when an operator appears in the wrong place. The compiler adds semantic errors when a referenced primitive record is missing or an action path is incomplete.

## Related operators

Start with `template`, `surface`, `state`, `selector`, `action`, `lane`, `mount`, `hydrate`, `on`, `emit` and `when`.
