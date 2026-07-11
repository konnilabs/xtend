# Actions und Events

Actions beschreiben Zustandsänderungen und fachliche Events. Surfaces können DOM- oder Komponentenereignisse an Actions binden, ohne ausführbares JavaScript in die RMT-Quelle einzubetten.

## Sicherer Event-Fluss

Halte Event-Selektoren deklarativ, übergib Payload-Werte über Action-Inputs und lass die Runtime Reducer anwenden.

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

Maraca verbindet Actions mit Validation, Scheduler-Zielen und Telemetrie. Ein `emit` Record wird im Strict-Pfad nur dann nützlich, wenn Payload-Namen stabil bleiben und die Surface-Bindung auf eine vorhandene Action zeigt. Für Formularflüsse prüft [Maraca Orchestrierung](./xtend-maraca-orchestration.md), ob `target action` aus einer `validation` Gruppe tatsächlich zu dieser Action passt.

## Collection- und Command-Events

Die eigene RMT-Oberfläche erweitert dieselbe Regel auf Data Display und Command/Search:

- `event.collection.select` sendet `$event.key` an `action.orders.select`.
- `event.collection.sort` sendet `$event.sort` an `action.orders.sort`.
- `event.command.query` sendet `$event.value` an `action.command.query`.
- `event.command.execute` sendet `$event.commandId` an eine policy-gebundene Effect Action.

Command-Ausführung muss registriert und action-referenziert bleiben. Eine Search-Result-Selection sollte über `action.command.execute` laufen, und diese Action sollte `policy: "registered-command-required"` nutzen, bevor sie den Host Effect erreicht.

Siehe [RMT Event Routing Runtime](./rmt-event-routing-runtime.md) und [RMT Action Effect Runtime](./rmt-action-effect-runtime.md) für den vollständigen Vertrag.

## Nächster Schritt

Ergänze externe Daten und Lifecycle-Cleanup mit [Daten und Ressourcen](./learn-rmt-data-resources.md).
