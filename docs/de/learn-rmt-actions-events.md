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

## Nächster Schritt

Ergänze externe Daten und Lifecycle-Cleanup mit [Daten und Ressourcen](./learn-rmt-data-resources.md).
