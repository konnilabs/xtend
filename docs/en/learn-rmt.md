# Learn RMT

Learn RMT is the guided path for writing RMT-vNext documents. It starts with the language model, then builds toward state, actions, resources, scheduling and the integrated playground.

## What RMT Is

RMT describes application structure as a compileable document. Instead of wiring every surface by hand, you declare the app template, the state it owns, the selectors that expose view models, the actions that change state and the surfaces that XTend should render or hydrate.

The compiler turns that source into a stable core document that the XTend runtime, SSR adapters and tooling can inspect.

```rmt
template learn.rmt.hello {
  surface root {
    lane visible weight 80 {
      mount hello-card
    }
  }
}
```

## Learning Path

Start with [syntax basics](./learn-rmt-syntax-basics.md), then continue through templates, state, actions, data, scheduling and security. Use the [RMT Playground](./learn-rmt-playground.md) whenever you want to compile a small example without leaving the Developer Center.

## Next Step

Open [Syntax Basics](./learn-rmt-syntax-basics.md) and compile the first complete document.
