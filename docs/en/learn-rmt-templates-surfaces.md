# Templates and Surfaces

Templates define the application boundary. Surfaces define renderable regions inside that boundary. A surface can point to an XTend component, choose a portal and split work into lanes.

## Surface Model

Use `portal` when the runtime should mount into a specific DOM target. Use `surface` to describe the visible unit and its scheduling lanes. `tools/rmt-language/vnext-surfaces.js` normalizes these surface and portal records for the runtime.

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

## Maraca Impact

For Maraca, the `component` value on a surface is a build contract. `component x-status` is not only render intent; it controls which XTend modules enter the inline registry and the Rollup graph. When a product later ships without the loader, every surface tag must be known; unknown tags should be handled as an explicit host policy. The details live in [XTend Maraca](./xtend-maraca.md).

## Next Step

Add data with [State and Selectors](./learn-rmt-state-selectors.md).
