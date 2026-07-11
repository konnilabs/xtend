# Daten und Ressourcen

RMT kann Host-Datenquellen und Runtime-Ressourcen direkt neben den Surfaces beschreiben, die sie verwenden. Die Runtime führt weiterhin aus; das RMT-Dokument deklariert den Vertrag.

## Datenverträge

Nutze `datasource` für Host-Aufrufe und `resource` für Dinge, die freigegeben werden müssen, etwa Timer, Subscriptions oder Object URLs.

```rmt
template learn.rmt.dataflow {
  state app.items type object preserve {
    initial {
      id "inbox"
      count 3
    }
  }

  selector app.itemsView from state app.items {
    output ItemsView
  }

  datasource app.items from endpoint "/api/items" {
    method GET
    contract ItemList
    result records
    fallback fixture app.items.fixture
  }

  resource app.refreshTimer kind timer owner surface.inbox.card {
    dispose on surface.destroy
  }

  surface inbox.card kind card component x-status {
    source selector app.itemsView
    key items.id
    bounds x 16 y 16 width 320 height 100
    destroy releases resource app.refreshTimer

    lane visible weight 75 {
      hydrate inbox-card from selector app.itemsView
    }
  }
}
```

## Maraca Resource Ownership

Ressourcen sind für Maraca mehr als Kommentar zur Laufzeit. `owner surface.inbox.card` und `destroy releases resource app.refreshTimer` werden im Orchestrierungsplan genutzt, damit Kernel Runtime und Surface Lifecycle dieselbe Besitzregel kennen. Wenn der Build einen Resource Owner nicht auflösen kann, ist das ein Hinweis auf ein echtes App-Problem und nicht nur auf fehlenden Dokumentationstext.

## Collection- und Search-Resources

Die eigene RMT-Oberfläche nutzt dasselbe Data- und Resource-Modell für Data Display und Command/Search:

- `resource.orders` speist `selector.visibleOrders`, der `collection.orders` speist.
- `resource.commands` speist `selector.visibleCommands`, der `search.commands` speist.
- Dashboard Resources bleiben owner-scoped an ihrer Surface.
- Popover Resources können `release: "on-surface-close"` nutzen, damit Query-Daten beim Schließen des Overlays freigegeben werden.

Nutze [Native-First RMT Recipes](./native-first-rmt-recipes.md) für die vollständigen Collection- und Command/Search-Records und [RMT Surface Resource Graph Runtime](./rmt-surface-resource-graph-runtime.md) für Cleanup-Regeln.

## Nächster Schritt

Steuere Renderpriorität mit [Scheduling und Lanes](./learn-rmt-scheduling-lanes.md).
