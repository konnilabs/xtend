# RMT Syntax Basics

This page introduces the shape of a valid RMT-vNext source file. You only need basic HTML and JavaScript knowledge before you start.

## Document Shape

An RMT document starts with a `template`. The template contains declarations such as `state`, `selector`, `action`, `portal`, `resource` and `surface`. Blocks use braces, strings use quotes and nested declarations describe ownership.

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
