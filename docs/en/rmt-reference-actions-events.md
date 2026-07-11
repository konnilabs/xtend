# RMT Reference: Actions and Events

Actions describe state changes, effects and emitted events. Event bindings connect DOM or surface events to actions.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="input"></a>`input` | `input id string` | `action` | name, type | Declares action payload fields. | Missing types are reported. | `payload` |
| <a id="status"></a>`status` | `status app.request` | `action` | state path | Binds loading, success and error status. | Unknown state is semantic diagnostic. | `effect` |
| <a id="effect"></a>`effect` | `effect fetch datasource tickets` | `action` | effect kind, optional source | Declares host-owned asynchronous work. | Effect source must be `datasource`, `resource` or `selector`. | `on success ->` |
| <a id="reduce"></a>`reduce` | `reduce state.app.status.text = "Saved"` | `action` | target path, expression | Writes declaratively to state. | Actions without reducers can be blocked. | `state`, `status` |
| <a id="emit"></a>`emit` | `emit app.saved with id input.id` | `action` | event name, optional payload | Publishes a typed RMT event. | Missing payload contracts may be reported semantically. | `with`, `emits` |
| <a id="with"></a>`with` | `with id input.id` | `emit` | key/value pairs | Maps event payload directly from action input or state. | Invalid payload values produce syntax errors. | `payload` |
| <a id="on"></a>`on` | `on click -> action save` | `surface`, policy block, action result | event or phase | Binds events or action results. | `->` and `action` are required for event bindings. | `target`, `payload` |
| <a id="target"></a>`target` | `on input target email -> action save` | event binding | target identifier | Narrows the event binding to one target. | Target must be an identifier. | `on` |
| <a id="arrow-action"></a>`-> action` | `on click -> action save` | event binding | action identifier | Connects event and action. | The `action` keyword is required. | `on`, `payload` |
| <a id="payload"></a>`payload` | `payload id from target.dataset.id` | event payload block | name and source path | Maps DOM, detail or surface context into action input. | Payload blocks allow only `payload` and `preventDefault`. | `from`, `input` |
| <a id="prevent-default"></a>`preventDefault` | `preventDefault true` | event payload block | boolean | Documents that the host prevents native default behavior. | Only valid in event payload blocks. | `payload` |
| <a id="on-success-reduce"></a>`on success -> reduce` | `on success -> reduce state.app.status.text = result.text` | `action` | phase, effect text | Describes result handling after a successful effect. | Result handlers require `->`. | `effect`, `reduce` |
| <a id="on-success-emit"></a>`on success -> emit` | `on success -> emit app.loaded` | `action` | phase, effect text | Emits an event after success. | Payload shape can be checked separately. | `emit` |
| <a id="on-error-overlay"></a>`on error -> overlay` | `on error -> overlay app.toast` | `action` | phase, overlay reference | Binds error feedback to an overlay. | Overlay reference must exist. | `overlay` |

## Allowed contexts

`input`, `status`, `effect`, `reduce`, `emit` and action result handlers belong in `action`. Event bindings belong in `surface` or lifecycle policy blocks.

## Parameters

Event names, action names and payload keys are identifiers. Payload values are paths such as `input.id`, `detail.value`, `target.dataset.id` or `surface.id`.

## Description

Actions are declarative transitions. They describe what should change or publish; the host decides how concrete adapters run.

## Examples

```rmt
template reference.actions {
  state app.status type object preserve {
    initial {
      text "Idle"
    }
  }

  datasource tickets from endpoint "/api/tickets" {
    method GET
  }

  action saveTicket {
    input id string
    status app.status
    effect fetch datasource tickets
    reduce state.app.status.text = "Saving"
    on success -> reduce state.app.status.text = "Saved"
    on success -> emit ticket.saved
    on error -> overlay app.toast
    emit ticket.requested with id input.id
  }

  portal app.root root "#app" layer surface
  overlay app.toast kind toast portal app.root

  surface editor kind form component x-form {
    portal app.root
    lane user-blocking weight 88 {
      mount editor.form from endpoint ticket.editor {
        on submit target editor -> action saveTicket {
          payload id from target.dataset.ticketId
          preventDefault true
        }
      }
    }
  }
}
```

## Diagnostics

Wrong action clauses, missing reducers, unknown overlay references and missing payload contracts are reported by parser, linter or semantic graph.

## Related operators

`action`, `state`, `datasource`, `overlay`, `surface`, `on`, `emit`.

## Related reading

The RMT reference index places action and event records in the complete language model. [Related article](./rmt-reference.md)
