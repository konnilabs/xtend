# Security and Preview

RMT is declarative, but the playground accepts arbitrary text input. The Developer Center therefore compiles source, reports diagnostics and renders only structured output through a narrow preview path.

## Playground Safety Rules

The playground does not execute user-authored JavaScript, does not return raw HTML from the compile endpoint and resets the preview surface between compilations. Inline handler strings, HTML fragment rendering, remote imports and unsafe URL protocols are blocked or diagnosed. Language-level rules live in `tools/rmt-language/vnext-security.js`; the host still owns its CSP and trusted-DOM boundary.

```rmt
template learn.rmt.safePreview {
  state preview.message type object preserve {
    initial {
      id "safe"
      text "Rendered from structured RMT output"
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

## Related Reference

For production rendering, read [Trusted DOM Sanitizing](./trusted-dom-sanitizing.md) and the [DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md).

## Maraca Strict Mode

The playground is intentionally interactive; Maraca is intentionally strict. For shipped apps, build the same source type with `--orchestration strict`, `--validation strict` and `--transitions strict` so unsafe HTML sinks, missing targets and incomplete validation messages surface during the build. The Maraca pages explain which browser bridges remain public and which internals stay outside the contract.

## Next Step

Open the [RMT Playground](./learn-rmt-playground.md).
