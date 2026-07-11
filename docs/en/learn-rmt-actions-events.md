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

## Maraca Action Gates

Maraca connects actions with validation, scheduler targets and telemetry. An `emit` record is useful in the strict path only when payload names stay stable and the surface binding points to an existing action. For form flows, [Maraca Orchestration](./xtend-maraca-orchestration.md) checks whether the `target action` from a `validation` group really matches that action.

## Collection And Command Events

The owned RMT surface extends the same rule to data display and command/search:

- `event.collection.select` sends `$event.key` to `action.orders.select`.
- `event.collection.sort` sends `$event.sort` to `action.orders.sort`.
- `event.command.query` sends `$event.value` to `action.command.query`.
- `event.command.execute` sends `$event.commandId` to a policy-bound effect action.

Command execution must stay registered and action-referenced. A search result selection should route through `action.command.execute`, and that action should use `policy: "registered-command-required"` before reaching the host effect.

See [RMT Event Routing Runtime](./rmt-event-routing-runtime.md) and [RMT Action Effect Runtime](./rmt-action-effect-runtime.md) for the full contract.

## Next Step

Add external data and lifecycle cleanup with [Data and Resources](./learn-rmt-data-resources.md).
