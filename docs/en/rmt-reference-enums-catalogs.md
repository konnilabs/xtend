# RMT Reference: Enums and Catalogs

This page lists fixed values used by operators.

## Syntax

| Catalog | Values | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="lane-names"></a>Lane names | `critical`, `visible`, `user-blocking`, `transition`, `resource`, `a11y`, `idle`, `background`, `diagnostics` | `lane`, `lane transition`, remote events | identifier | Maps work to a scheduling class. | Unknown lane names can be catalog diagnostics. | `lane`, `weight` |
| <a id="source-kinds"></a>Source kinds | `endpoint`, `sse`, `worker`, `selector`, `state`, `datasource`, `fixture`, `resource` | `from`, `fallback`, `source` | identifier plus reference | Describes where data or work comes from. | Parser reports disallowed source kinds. | `from` |
| <a id="overlay-kinds"></a>Overlay kinds | `tooltip`, `toast`, `popover`, `lightbox`, `menu`, `dialog` | `overlay kind` | identifier | Classifies overlay UI. | Unknown overlay kinds can be semantic diagnostics. | `overlay` |
| <a id="resource-kinds"></a>Resource kinds | `object-url`, `stream`, `observer`, `timer`, `lazy-import` | `resource kind` | identifier | Classifies cleanup and ownership behavior. | Missing owner can be reported. | `resource`, `destroy releases` |
| <a id="transition-effects"></a>Transition effects | `fade`, `crossfade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scale`, `pop`, `zoom`, `flip`, `rotate`, `expand`, `collapse`, `fade-blur`, `shared-element`, `layout-flip`, `none` | `transition effect` | identifier | Selects visual surface transition. | Unknown effects can be catalog diagnostics. | `transition` |
| <a id="trust-boundary-identifiers"></a>Trust boundary identifiers | `xtend.security.sanitizing-boundary.v1`, `xtend.security.streaming-boundary.v1`, `xtend.security.worker-boundary.v1`, `xtend.security.remote-surface.v1` | `trust boundary` | string | Names host-owned security boundaries. | Boundary must be a string. | `sanitize`, `remote surface` |

## Allowed contexts

Catalog values appear in clauses that expect static values. They are not JavaScript enums and are not imported.

## Parameters

All values are literal in RMT source. Trust boundaries are written as strings; the other values are usually identifiers.

## Description

Catalogs keep authoring stable and inspectable. New values need tooling, docs and test coverage.

## Examples

```rmt
template reference.catalogs {
  resource preview.file kind object-url owner surface.preview
  overlay notice kind toast portal app.root
  portal app.root root "#app" layer surface

  transition preview.open {
    trigger action preview.show
    from surfaces [preview.closed]
    to surfaces [preview.open]
    effect crossfade
    durationMs 160
    easing "ease-out"
    lane transition
  }

  action preview.show {
    input id string
    reduce state.preview.id = input.id
    emit preview.opened with id input.id
  }

  state preview.id type string initial ""

  surface preview kind page component x-section {
    portal app.root
    lane visible weight 80 {
      mount preview.card from endpoint preview.card {
        trust boundary "xtend.security.sanitizing-boundary.v1"
      }
    }
  }
}
```

## Diagnostics

Parser diagnostics check syntax and context. Catalog and semantic checks report unknown or incomplete values.

## Related operators

`lane`, `from`, `overlay`, `resource`, `transition`, `trust boundary`.
