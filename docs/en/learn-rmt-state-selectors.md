# State and Selectors

State declares data owned by the template. Selectors expose stable view models for surfaces, actions and adapters.

## Keep State Explicit

Use `state` for durable template data and `selector` for the shape a component should consume. This keeps render contracts readable and makes compiler diagnostics more useful. The vNext normalization in `tools/rmt-language/vnext-compiler.js` keeps state and selector references together in the core document.

```rmt
template learn.rmt.stateflow {
  state dashboard.summary type object preserve {
    initial {
      id "summary"
      title "Orders"
      status "ready"
    }
  }

  selector dashboard.summary from state dashboard.summary {
    output DashboardSummary
  }

  surface dashboard.card kind card component x-status {
    source selector dashboard.summary
    key summary.id

    lane visible weight 80 {
      hydrate dashboard-card from selector dashboard.summary
    }
  }
}
```

## Workflow Tip

Name selectors after the view model they provide, not after the component that first consumes them. That makes the selector reusable when the UI changes.

## Maraca State Contract

In a Maraca build, `state` and `selector` become parts of the orchestration artifact. The bundle report shows which view models belong to hydration, actions and browser bridges. If a selector should later be visible through `window.XTendMaraca.orchestration.snapshot()`, keep it explicitly named in the RMT source instead of deriving it only from a component.

## Next Step

Learn how user intent flows through [Actions and Events](./learn-rmt-actions-events.md).
