# RMT Syntax-Grundlagen

Diese Seite zeigt die Grundform einer gültigen RMT-vNext-Quelldatei. Vorwissen zu HTML und JavaScript reicht für den Einstieg aus.

## Dokumentform

Ein RMT-Dokument beginnt mit einem `template`. Darin liegen Deklarationen wie `state`, `selector`, `action`, `portal`, `resource` und `surface`. Blöcke verwenden geschweifte Klammern, Strings stehen in Anführungszeichen und verschachtelte Deklarationen beschreiben Besitz und Zuordnung.

```rmt
template learn.rmt.syntax {
  state app.message type object preserve {
    initial {
      id "welcome"
      text "Hello RMT"
      tone "info"
    }
  }

  selector app.message from state app.message {
    output MessageView
  }

  surface root {
    lane visible weight 80 {
      hydrate message-card from selector app.message
    }
  }
}
```

## Beispiel Lesen

Das Template besitzt einen State-Datensatz, stellt ihn über einen Selector bereit und hydriert eine Surface-Lane aus diesem Selector. Das ist der Grundrhythmus von RMT: Daten beschreiben, View-Modell bereitstellen und Renderarbeit planen.

## Nächster Schritt

Weiter geht es mit [Templates und Surfaces](./learn-rmt-templates-surfaces.md).
