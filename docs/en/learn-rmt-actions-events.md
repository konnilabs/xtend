# Actions and Events

Actions describe state changes and emitted domain events. Surfaces can bind DOM or component events to those actions without embedding executable JavaScript in the RMT source.

## Safe Event Flow

Keep event selectors declarative, pass payload values through the action input and let the runtime apply reducers.

```rmt
template learn.rmt.interactions {
  state page.counter type object preserve {
    initial {
      value 0
      status "ready"
    }
  }

  action page.increment {
    input label string
    reduce state.page.counter.status = "incremented"
    emit page.counter.incremented with label input.label
  }

  surface counter.card kind card component x-status {
    lane visible weight 90 {
      mount counter-card
    }

    on click "[data-action=increment]" -> action page.increment {
      payload label from target.dataset.label
    }
  }
}
```

## Next Step

Add external data and lifecycle cleanup with [Data and Resources](./learn-rmt-data-resources.md).
