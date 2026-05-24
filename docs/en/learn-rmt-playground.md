# RMT Playground

The RMT Playground compiles RMT-vNext source inside the Developer Center. It uses `x-surface-manager` for the workspace, `x-textarea` for the first editor version, diagnostics and JSON output panels, and a safe preview target that never renders raw compiler HTML.

## Try It

The interactive playground is rendered below this article. Change the source and the compiler runs after a short debounce. Diagnostics show line and column ranges when the compiler can provide them.

```rmt
template learn.rmt.playground {
  state preview.message type object preserve {
    initial {
      id "hello"
      text "Hello from the playground"
      tone "success"
    }
  }

  selector preview.message from state preview.message {
    output PreviewMessage
  }

  surface preview.card kind card component x-status {
    source selector preview.message
    key message.id

    lane visible weight 80 {
      hydrate preview-card from selector preview.message
    }
  }
}
```

## Safety Model

The compile endpoint accepts POST requests only, limits source size and returns JSON diagnostics plus core output. The preview surface renders a structured summary with DOM APIs, not `innerHTML`.

## Next Step

Finish the guided path with [Next Steps](./learn-rmt-next-steps.md).
