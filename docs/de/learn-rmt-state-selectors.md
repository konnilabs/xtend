# State und Selectors

State deklariert Daten, die dem Template gehören. Selectors stellen stabile View-Modelle für Surfaces, Actions und Adapter bereit.

## State Explizit Halten

Nutze `state` für dauerhafte Template-Daten und `selector` für die Form, die eine Komponente konsumieren soll. Dadurch bleiben Renderverträge lesbar und Compiler-Diagnosen hilfreicher. Die vNext-Normalisierung in `tools/rmt-language/vnext-compiler.js` hält State- und Selector-Referenzen im Core-Dokument zusammen.

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

## Maraca-State-Vertrag

Im Maraca-Build werden `state` und `selector` zu Teilen des Orchestrierungsartefakts. Der Bundle-Report zeigt, welche View-Modelle zur Hydration, zu Actions und zu Browser Bridges gehören. Wenn ein Selector später in `window.XTendMaraca.orchestration.snapshot()` sichtbar sein soll, muss er in der RMT Quelle eindeutig benannt bleiben und darf nicht nur implizit aus einer Komponente abgeleitet werden.

## Nächster Schritt

Lerne in [Actions und Events](./learn-rmt-actions-events.md), wie Nutzerabsicht durch das System fließt.
