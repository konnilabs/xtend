# RMT Reference: Surfaces, Lanes and Lifecycle

Surfaces describe UI areas. Lanes schedule work. Lifecycle operations describe what happens in a lane.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="kind"></a>`kind` | `surface shell kind page` | Surface header, overlay, resource | catalog value or identifier | Classifies a surface, overlay or resource. | Surface headers allow only `kind` and `component`. | `component` |
| <a id="component"></a>`component` | `component x-section` | Surface header | custom element name or identifier | Binds a host component. | Unexpected header clauses are reported. | `surface` |
| <a id="source"></a>`source` | `source selector app.items` | Surface, resource | source kind and reference | Binds a primitive record as source. | Missing references are semantic diagnostics. | `repeat from` |
| <a id="repeat-from"></a>`repeat from` | `repeat from selector app.items` | Surface | source reference | Creates repeated surface instances. | Repeaters need stable keys. | `key` |
| <a id="key"></a>`key` | `key item.id` | Surface | path | Declares the stable repeater key. | Unkeyed repeaters can be blocked. | `repeat from` |
| <a id="bounds"></a>`bounds` | `bounds x 0 y 0 width 640 height 400` | Surface | key/value pairs | Sets initial geometry. | Bounds keys need values. | `surface` |
| <a id="preserve-on-minimize"></a>`preserve on minimize` | `preserve on minimize` | Surface | raw clause | Preserves surface state when minimized. | Only valid in surface. | `preserve` |
| <a id="destroy-releases"></a>`destroy releases` | `destroy releases resource app.stream` | Surface | resource reference | Binds surface destroy to resource cleanup. | Resource must exist. | `resource`, `dispose` |
| <a id="lane"></a>`lane` | `lane visible weight 80 { ... }` | Surface | lane name, optional `weight` | Groups scheduled work. | Lanes may contain lifecycle or `stream` only. | `weight`, `mount` |
| <a id="weight"></a>`weight` | `weight 80` | Lane header | nonnegative integer | Prioritizes lane work. | Weight must be a nonnegative integer. | `lane` |
| <a id="mount"></a>`mount` | `mount card from endpoint app.card` | Lane, slot | target, optional source, condition, policy | Materializes new UI work. | Operations may not be top-level. | `slot`, `when` |
| <a id="hydrate"></a>`hydrate` | `hydrate card from selector app.card` | Lane, slot | target, source | Fills existing UI with data. | Source kind must be allowed. | `hydration policy` |
| <a id="suspend"></a>`suspend` | `suspend card` | Lane, slot | target | Pauses a UI or resource unit. | Only valid in lane or slot. | `resume` |
| <a id="resume"></a>`resume` | `resume card` | Lane, slot | target | Resumes paused work. | Only valid in lane or slot. | `suspend` |
| <a id="invalidate"></a>`invalidate` | `invalidate card` | Lane, slot | target | Marks work for recomputation. | Only valid in lane or slot. | `update` |
| <a id="dispose"></a>`dispose` | `dispose card` | Lane, slot, resource block | target or cleanup text | Releases work or a resource. | Wrong context is reported. | `destroy releases` |
| <a id="prewarm"></a>`prewarm` | `prewarm data from worker prepare` | Lane, slot | target, source | Prepares data or UI before it becomes visible. | Source kind must be static. | `worker`, `idle` |
| <a id="recycle"></a>`recycle` | `recycle row from resource pool` | Lane, slot | target, source | Reuses existing instances. | Resource must exist. | `resource` |
| <a id="detach"></a>`detach` | `detach panel` | Lane, slot | target | Detaches a surface unit from the current host context. | Only valid in lane or slot. | `reattach` |
| <a id="reattach"></a>`reattach` | `reattach panel` | Lane, slot | target | Attaches a detached unit again. | Only valid in lane or slot. | `detach` |
| <a id="stream"></a>`stream` | `stream feed from sse app.feed` | Lane, slot | target, source | Describes incremental rendering data. | `stream` requires a data source. | `sse`, `sanitize` |
| <a id="slot"></a>`slot` | `slot header { hydrate title from selector app.title }` | Policy block | slot name | Groups operations in a composition slot. | Slots allow only lifecycle or `stream`. | `mount`, `hydrate` |

## Allowed contexts

`lane` belongs directly in `surface`. Lifecycle operations and `stream` belong in `lane` or `slot`. `slot`, `on`, `trust`, `hydration`, `isolation` and `sanitize` belong in lifecycle policy blocks.

## Parameters

Targets are identifiers. Sources follow `from <kind> <target>`. Conditions follow `when`. Policy blocks use braces.

## Description

Lifecycle syntax separates visible work, user-blocking interaction, background work and diagnostics. The host can map these records to scheduler lanes without executing free functions from the RMT source.

## Examples

```rmt
template reference.lifecycle {
  state app.ready type boolean initial true
  state app.status type object preserve {
    initial {
      text "Ready"
    }
  }
  selector app.header from state app.status {
    output HeaderView
  }
  selector app.cardView from state app.status {
    output CardView
  }
  resource app.stream kind stream owner surface.shell
  resource app.pool kind object-url owner surface.shell
  portal app.root root "#app" layer surface

  surface shell kind page component x-section {
    portal app.root
    bounds x 0 y 0 width 640 height 400
    preserve on minimize
    destroy releases resource app.stream
    lane visible weight 90 {
      mount shell.card from endpoint app.card when app.ready == true {
        slot header {
          hydrate header.view from selector app.header
        }
        on click ".save" -> action app.save {
          payload id from target.dataset.id
          preventDefault true
        }
      }
      hydrate shell.card from selector app.cardView
      suspend shell.card
      resume shell.card
      invalidate shell.card
      dispose shell.card
      prewarm shell.data from worker app.prepare
      recycle shell.row from resource app.pool
      detach shell.panel
      reattach shell.panel
      stream shell.feed from sse app.feed
    }
  }

  action app.save {
    input id string
    reduce state.app.status.text = "Saved"
    emit app.saved with id input.id
  }
}
```

## Diagnostics

Lifecycle and stream statements outside lanes or slots produce context diagnostics. Missing selector, resource or action references are reported semantically.

## Related operators

`surface`, `portal`, `source`, `when`, `slot`, `on`, `resource`, `trust boundary`.
