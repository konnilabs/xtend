# RMT Syntax Basics

This page introduces the shape of a valid RMT-vNext source file. You only need basic HTML and JavaScript knowledge before you start.

## Document Shape

An RMT document starts with a `template`. The template contains declarations such as `state`, `selector`, `action`, `portal`, `resource` and `surface`. Blocks use braces, strings use quotes and nested declarations describe ownership. `tools/rmt-language/vnext-parser.js` reads the accepted record forms; when an example differs, its diagnostic is authoritative.

```rmt
template learn.rmt.syntax {
  state app.message type object preserve {
    initial {
      id "welcome"
      text "Hello RMT"
      tone "info"
    }
  }

  selector app.message from state app.message {
    output MessageView
  }

  surface root {
    lane visible weight 80 {
      hydrate message-card from selector app.message
    }
  }
}
```

## Reading The Example

The template owns one state record, exposes it through one selector and hydrates one surface lane from that selector. This is the basic RMT rhythm: describe data, expose the view model, then schedule rendering work.

## Next Step

Continue with [Templates and Surfaces](./learn-rmt-templates-surfaces.md).

## Validation And Transitions

Form logic does not have to live as host JavaScript next to the RMT file. Use `validation` to declare field rules and action gates; use `transition` to declare the visual change between surface groups.

```rmt
validation demo.contact {
  mode blocking
  target action demo.nextContact
  field demo.email required email message "Enter a valid email address."
}

transition demo.contactToIssue {
  trigger action demo.nextContact
  from surfaces [demo.email demo.nextContact]
  to surfaces [demo.subject demo.nextIssue]
  effect slide-left
  durationMs 220
  easing "ease-out"
  lane transition
}
```

`required`, `email`, `minLength`, `maxLength`, `pattern`, `message`, `target action`, `from surfaces`, `to surfaces`, `effect` and `durationMs` are part of the vNext syntax. `lane transition` lets the kernel scheduler plan the change.

## Maraca Relevance

Maraca reads these records from the `.rmt` source and, in strict mode, decides whether validation, transition and kernel layers are complete enough. When you later run `xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json`, missing targets, unknown components and incomplete messages become build diagnostics instead of silent runtime fallbacks. The next production context is [Maraca Orchestration](./xtend-maraca-orchestration.md).
