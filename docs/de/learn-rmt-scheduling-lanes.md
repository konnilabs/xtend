# Scheduling und Lanes

Lanes trennen dringende UI-Arbeit von sichtbarer Hydration und Hintergrundaufgaben. XTend Fabric kann diese Lane-Namen und Gewichte in Runtime-Scheduling übersetzen.

## Lane-Priorität

Nutze hohe Gewichte für direkte Interaktionsflächen, mittlere Gewichte für sichtbare Inhalte und niedrige Gewichte für optionale Arbeit.

```rmt
template learn.rmt.scheduling {
  surface dashboard.card kind card component x-status {
    lane critical weight 100 {
      mount dashboard-shell
    }

    lane visible weight 85 {
      hydrate dashboard-summary
    }

    lane idle weight 5 {
      hydrate analytics-panel
    }
  }
}
```

## Design-Regel

Betrachte Lanes als Aussage über Nutzererlebnis. Die Lane sagt, warum Arbeit wichtig ist; die Runtime entscheidet, wie sie auf der aktuellen Plattform ausgeführt wird.

## Nächster Schritt

Bevor du beliebige Quelle in der Preview ausprobierst, lies [Sicherheit und Preview](./learn-rmt-security-preview.md).
