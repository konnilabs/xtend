# Templates and Surfaces

Templates define the application boundary. Surfaces define renderable regions inside that boundary. A surface can point to an XTend component, choose a portal and split work into lanes.

## Surface Model

Use `portal` when the runtime should mount into a specific DOM target. Use `surface` to describe the visible unit and its scheduling lanes.

```rmt
template learn.rmt.surfaces {
  portal surface.root root "#app" layer surface

  surface welcome.card kind card component x-status {
    portal surface.root
    bounds x 16 y 16 width 320 height 120

    lane visible weight 90 {
      hydrate welcome-card
    }
  }
}
```

## Why This Helps

The app boundary, target and component contract stay in one source file. The runtime can reason about focus, layout, hydration and cleanup without asking every consumer to duplicate that wiring.

## Next Step

Add data with [State and Selectors](./learn-rmt-state-selectors.md).
