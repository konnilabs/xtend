# RMT Reference: Actions and Events

Actions describe state changes, effects and emitted events. Event bindings connect DOM or surface events to actions.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="execution-fastpass"></a>`execution fastpass` | `execution fastpass` | `action` | `fastpass` | Navigation, focus or close on `user-blocking` without a Model transaction. | Reducers, fetch, services, streams, custom effects and command chains are forbidden. | `effect navigation`, `effect close surface`, `effect focus surface` |
| <a id="input"></a>`input` | `input id string` | `action` | name, type | Declares action payload fields. | Missing types are reported. | `payload` |
| <a id="status"></a>`status` | `status app.request` | `action` | state path | Binds loading, success and error status. | Unknown state is semantic diagnostic. | `effect` |
| <a id="effect"></a>`effect` | `effect fetch datasource tickets` | `action` | effect kind, optional source | Declares host-owned asynchronous work or a fixed component command. | Fetch uses `datasource`; other effects use their declared source contract. FastPass supports navigation, `close surface` and `focus surface`; component commands permit only `focus`, `reset` and `snapshot`. | `on success ->` |
| <a id="reduce"></a>`reduce` | `reduce state.app.status.text = "Saved"` | `action` | target path, expression | Writes declaratively to state. | Business actions require a valid reducer contract; FastPass forbids reducers. | `state`, `status` |
| <a id="emit"></a>`emit` | `emit app.saved with id input.id` | `action` | event name, optional payload | Publishes a declared RMT event after a successful commit. | Missing payload contracts may be reported semantically. | `with`, `emits` |
| <a id="with"></a>`with` | `with id input.id` | `emit` | key/value pairs | Maps event payload directly from action input or state. | Invalid payload values produce syntax errors. | `payload` |
| <a id="on"></a>`on` | `on click -> action save` | `surface`, policy block, action result | event or phase | Binds events or action results. | `->` and `action` are required for event bindings. | `target`, `payload` |
| <a id="target"></a>`target` | `on input target email -> action save` | event binding | target identifier | Narrows the event binding to one target. | Target must be an identifier. | `on` |
| <a id="arrow-action"></a>`-> action` | `on click -> action save` | event binding | action identifier | Connects event and action. | The `action` keyword is required. | `on`, `payload` |
| <a id="payload"></a>`payload` | `payload id from target.dataset.id` | event payload block | name and source path | Maps DOM, detail or surface context into action input. | Payload blocks allow only `payload` and `preventDefault`. | `from`, `input` |
| <a id="prevent-default"></a>`preventDefault` | `preventDefault true` | event payload block | boolean | Documents that the host prevents native default behavior. | Only valid in event payload blocks. | `payload` |
| <a id="on-success-reduce"></a>`on success -> reduce` | `on success -> reduce state.app.status.text = result.text` | `action` | phase, declarative operation | Runs the success reducer in the managed Model commit. | Result handlers require `->`. | `effect`, `reduce` |
| <a id="on-success-emit"></a>`on success -> emit` | `on success -> emit app.loaded` | `action` | phase, declarative operation | Plans an event for the successful phase. | Payload shape can be checked separately. | `emit` |
| <a id="on-error-overlay"></a>`on error -> overlay` | `on error -> overlay app.toast` | `action` | phase, overlay reference | Binds error feedback to an overlay. | Overlay reference must exist. | `overlay` |

## Allowed contexts

`execution fastpass`, `input`, `status`, `effect`, `reduce`, `emit` and action result handlers belong in `action`. Event bindings belong in `surface` or lifecycle policy blocks.

## Parameters

Event names, action names and payload keys are identifiers. DOM payload mappings use event-context paths such as `detail.value` or `target.dataset.id`. Action values use explicit `state`, `selector`, `input`, `payload`, `result` or `error` references. Literals remain distinct from those references.

## Description

Actions are declarative transitions. They describe what should change or publish; the host decides how concrete adapters run.

### Values, references and result handlers

The compiler normalizes `on success -> ...` and `on error -> ...` into closed handler records. The supported operations are exactly `reduce`, `emit` and `overlay`. Phase, operation, payload names and references remain data; handler text is never evaluated as JavaScript. Unknown phases, handler kinds, unsafe paths and overlay options are diagnosed.

Reducers accept scalar literals or explicitly qualified references. `reduce state.copied = state.original` reads the declared Model state; `reduce state.copied = "state.original"` writes the literal string instead. Selector values resolve through the Model reader. The same literal/reference distinction applies to emit payloads and overlay options, including declarative values with nested references. A similar-looking string gains no execution meaning.

`on error -> overlay app.toast message error.message tone "danger"` uses a declared overlay. The allowed options are `message` and `tone`. Messages render as text. The eight tones and their canonical visual mapping are listed in the [catalog](./rmt-reference-enums-catalogs.md#tones-for-action-result-overlays).

### Execution phases and event publication

Action text is not an imperative command sequence. The direct executor groups data acquisition, reducers and effects. Managed Maraca adds precommit, Model/view commit and presentation phases. Certain service, stream and lazy-import effects run before commit; presentation runs after rendering. A navigation effect written before a reducer is therefore not automatically an earlier JavaScript statement.

In managed Maraca, ordinary `emit` declarations and success-handler emits publish only after a successful Model/view commit. The error phase adds only matching error-handler emits, also after that phase commits successfully. Cancelled or rolled-back commits and invalid presentation/lifetime tokens do not publish the corresponding events. Publication is a runtime event, not an implicit DOM `CustomEvent` or a global event bus.

```js
const unsubscribe = runtime.subscribeEvents(entry => {
  if (entry.type === 'emit') {
    console.log(entry.event, entry.payload, entry.action, entry.correlationId);
  }
});
// When the owner ends its subscription:
unsubscribe();
```

Direct use of `createRmtActionEffectRuntime` requires an explicitly injected `effectAdapter.invoke(effect, context)` for publication. For `effect.kind === "emit"`, it receives the static event name and resolved payload. Without this port, the action returns a structured error result; a missing publication path is not a silent success. Result overlays also require an explicitly provided host path. A successful compile check establishes the source/data form, not the availability of every host adapter.

### Event guards and API versions

An event binding's `when` condition survives as an AST through to the event router. False guards block payload mapping, event governance and dispatch. Model/selector values use a read-only snapshot; unknown or unresolved guards grant no permission. Details, including Classic precedence, are under [Conditions and Expressions](./rmt-reference-conditions-expressions.md#event-conditions-in-the-maraca-path).

This implementation uses Classic Compiler API **4.1.0**, the compatible vNext compiler entry **1.2.0**, Event Routing API **3.0.0**, Action Effect API **2.0.0**, Surface Resource Graph API **2.1.0** and DOM Descriptor Renderer API **2.1.0**. Existing Classic AST/wire IDs remain unchanged. This does not establish a new RMTX syntax.

Result overlays open inside the declared, uniquely resolved application portal. The shared renderer preserves native portal roots across subsequent view commits using private ownership recorded from actual create-node requests. HTML attributes and descriptor markers do not grant this reservation. Portal resolution stays in the view/resource-graph adapter; the controller does not read DOM.


### Component commands

An action may call public methods on an eligible, statically known surface through exactly these forms:

```rmt
template reference.componentCommands {
  state editor.command type object preserve {
    initial {
      last "idle"
    }
  }

  action editor.focus {
    effect focus selector maraca.testbench.editor
    reduce state.editor.command.last = "focus"
  }

  action editor.reset {
    effect reset selector maraca.testbench.editor
    reduce state.editor.command.last = "reset"
  }

  action editor.capture {
    effect snapshot selector maraca.testbench.editor
    reduce state.editor.command.last = "snapshot"
  }

  surface maraca.testbench.editor kind field component x-textarea {
  }
}
```

Here, `selector` is the authoring form for a static surface ID; the compiler resolves it to a `surface` target with a component type. This contract currently permits `x-textarea` and only `focus()`, `reset()` and `snapshot()`. Unknown surfaces, ineligible components, other source kinds and arbitrary method names are hard compiler errors with a source range.

Maraca runs the command after rendering and hydration, within the orchestration root. It has no document fallback and does not traverse shadow roots. The action result remains visible in `XTendMaraca.orchestration.snapshot().actions[]`. `effects[].value.result` uses schema `xtend.maraca.component-command-result.v1` with `command`, `surfaceId`, `component` and `result`; `focus` and `reset` return `null`, while `snapshot` contains the public XTextarea snapshot. A component command does not mutate RMT state automatically.

### FastPass (0.8.0)

```rmt
template reference.fastpass {
  action showReports {
    execution fastpass
    effect navigation "#reports"
  }
  action dismissPanel {
    execution fastpass
    effect close surface panel
  }
  action focusNavigation {
    execution fastpass
    effect focus surface navigation
  }
  surface panel kind panel component x-section {}
  surface navigation kind panel component x-section {}
}
```

Navigation accepts a literal path or a declared input such as `input path string` with `effect navigation input.path`. Close and focus refer to named surfaces. FastPass focus uses the focus port; the separate `selector` component-command restriction to `x-textarea` does not apply. Event bindings and `dispatchCommand()` select the same executor for declared FastPass actions; `dispatchFastPass()` returns a cancellable job. Navigation and focus coalesce per scope. Business-command ordering is preserved.

For restrictions, ports and presentation epochs, see [FastPass and Abort Boundary](./maraca-fastpass-abort-boundary.md).

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
    emit ticket.completed with id input.id
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

Wrong action clauses, missing reducers, unknown overlay references, invalid component commands and missing payload contracts are reported by parser, linter, compiler or semantic graph.

## Related operators

`action`, `state`, `datasource`, `overlay`, `surface`, `on`, `emit`.

## Related reading

The RMT reference index places action and event records in the complete language model. [Related article](./rmt-reference.md)
