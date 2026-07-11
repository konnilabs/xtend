# Templates und Surfaces

Templates definieren die Anwendungsgrenze. Surfaces beschreiben renderbare Bereiche innerhalb dieser Grenze. Eine Surface kann auf eine XTend-Komponente zeigen, ein Portal auswählen und Arbeit in Lanes aufteilen.

## Surface-Modell

Nutze `portal`, wenn die Runtime in ein bestimmtes DOM-Ziel mounten soll. Nutze `surface`, um die sichtbare Einheit und ihre Scheduling-Lanes zu beschreiben. `tools/rmt-language/vnext-surfaces.js` normalisiert diese Surface- und Portal-Records für die Runtime.

```rmt
template learn.rmt.surfaces {
  portal surface.root root "#app" layer surface

  surface welcome.card kind card component x-status {
    portal surface.root
    bounds x 16 y 16 width 320 height 120

    lane visible weight 90 {
      hydrate welcome-card
    }
  }
}
```

## Warum Das Hilft

App-Grenze, Ziel und Komponentenvertrag bleiben in einer Quelldatei. Die Runtime kann Fokus, Layout, Hydration und Cleanup auswerten, ohne dass jeder Consumer dieselbe Verdrahtung dupliziert.

## Maraca-Auswirkung

Für Maraca ist der `component` Wert einer Surface ein Build-Vertrag. `component x-status` bedeutet nicht nur Renderabsicht, sondern steuert, welche XTend Module in die Inline Registry und den Rollup Graphen gelangen. Wenn ein Produkt später loaderlos ausgeliefert wird, muss jeder Surface-Tag bekannt sein; unbekannte Tags sollten bewusst als Host-Policy behandelt werden. Die Details stehen in [XTend Maraca](./xtend-maraca.md).

## Nächster Schritt

Füge Daten mit [State und Selectors](./learn-rmt-state-selectors.md) hinzu.
