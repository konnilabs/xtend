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

## Nächster Schritt

Steuere Renderpriorität mit [Scheduling und Lanes](./learn-rmt-scheduling-lanes.md).
