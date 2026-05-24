# State und Selectors

State deklariert Daten, die dem Template gehören. Selectors stellen stabile View-Modelle für Surfaces, Actions und Adapter bereit.

## State Explizit Halten

Nutze `state` für dauerhafte Template-Daten und `selector` für die Form, die eine Komponente konsumieren soll. Dadurch bleiben Renderverträge lesbar und Compiler-Diagnosen hilfreicher.

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

## Workflow-Tipp

Benenne Selectors nach dem View-Modell, das sie bereitstellen, nicht nach der ersten Komponente, die sie nutzt. So bleibt der Selector wiederverwendbar, wenn sich die UI ändert.

## Nächster Schritt

Lerne in [Actions und Events](./learn-rmt-actions-events.md), wie Nutzerabsicht durch das System fließt.
