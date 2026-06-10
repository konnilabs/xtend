# RMT Reference: Primitives

Primitives are the stable App Platform records in RMT vNext.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="state"></a>`state` | `state app.status type object preserve { ... }` | Top-level, `template`, primitive `surface` | identifier, `type`, `initial`, `preserve` | Declares persistent or lifecycle-owned app state. | State blocks may contain `initial` only. | `selector`, `reduce` |
| <a id="selector"></a>`selector` | `selector view from state app.status { ... }` | Top-level, `template`, primitive `surface` | identifier, source reference | Derives a view model from state or datasource. | Selector blocks allow only `where`, `find`, `sort by`, `output`. | `from state`, `from datasource` |
| <a id="datasource"></a>`datasource` | `datasource list from endpoint "/api" { ... }` | Top-level, `template`, primitive `surface` | identifier, source kind, source target | Describes data access without free runtime execution. | DataSource blocks allow only `method`, `contract`, `result`, `fallback`. | `endpoint`, `fixture`, `worker` |
| <a id="action"></a>`action` | `action save { ... }` | Top-level, `template`, primitive `surface` | identifier | Declares typed inputs, reducers, effects and events. | Action blocks allow only `input`, `status`, `effect`, `reduce`, `emit`, `on`. | `emit`, `reduce`, `on success ->` |
| <a id="portal"></a>`portal` | `portal app.root root "#app" layer surface` | Top-level, `template` | `root`, `layer`, optional `z` | Binds surfaces to a host root and layer. | Unexpected inline attributes are rejected. | `surface`, `overlay` |
| <a id="overlay"></a>`overlay` | `overlay notice kind toast portal app.root` | Top-level, `template` | `kind`, `portal` | Declares feedback or interaction overlays. | Overlay policy lines remain declarative. | `toast`, `dialog`, `on error -> overlay` |
| <a id="resource"></a>`resource` | `resource file kind object-url owner surface.preview` | Top-level, `template` | `kind`, `owner`, `source` | Declares owner-scoped resources with cleanup. | Resource blocks allow only `import`, `source`, `dispose`. | `destroy releases resource` |
| <a id="validation"></a>`validation` | `validation form.contact { ... }` | Top-level, `template` | identifier | Declares field rules and action gates. | Only `mode`, `target`, `field`, `include` are allowed. | `field`, `target action` |
| <a id="transition"></a>`transition` | `transition route.next { ... }` | Top-level, `template` | identifier | Declares surface changes with effect, duration and lane. | Only transition clauses are allowed in the block. | `trigger action`, `from surfaces` |

## Allowed contexts

Primitives may appear top-level, in `template` and partly in primitive-scoped surfaces. They declare records; they do not execute host code.

## Parameters

The main parameters are identifiers, source references, type names, catalog values and static strings.

## Description

Primitives bridge RMT authoring and Core format. They compile to state, selector, datasource, action, portal, overlay, resource, validation, transition and surface records.

## Examples

```rmt
template reference.primitives {
  state app.status type object preserve {
    initial {
      text "Ready"
    }
  }

  selector app.statusView from state app.status {
    output StatusView
  }

  datasource app.messages from endpoint "/api/messages" {
    method GET
    result list
    fallback fixture messages.fallback
  }

  action app.refresh {
    input id string
    status app.status
    reduce state.app.status.text = "Loading"
    emit app.refreshed with id input.id
  }

  portal app.root root "#app" layer surface
  overlay app.toast kind toast portal app.root
  resource app.timer kind timer owner surface.home {
    dispose clear
  }

  validation app.form {
    mode blocking
    target action app.refresh
    field app.email required email message "Valid email"
  }

  transition app.next {
    trigger action app.refresh
    from surfaces [home]
    to surfaces [done]
    effect fade
    durationMs 120
    easing "ease-out"
    lane transition
  }

  surface home kind card component x-status {
    portal app.root
    lane visible weight 80 {
      hydrate status.card from selector app.statusView
    }
  }
}
```

## Diagnostics

Missing owners, unknown references, unkeyed repeaters and actions without reducers or payload contracts are reported semantically.

## Related operators

`template`, `surface`, `lane`, `from`, `when`, `payload`, `trust boundary`.
