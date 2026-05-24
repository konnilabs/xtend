# Learn RMT

Learn RMT ist der geführte Einstieg in RMT-vNext. Die Strecke beginnt mit dem Sprachmodell und führt dann zu State, Actions, Ressourcen, Scheduling und dem integrierten Playground.

## Was RMT Ist

RMT beschreibt Anwendungsstruktur als kompilierbares Dokument. Statt jede Surface von Hand zu verdrahten, deklarierst du das App-Template, den eigenen State, Selectors für View-Modelle, Actions für Zustandsänderungen und die Surfaces, die XTend rendern oder hydrieren soll.

Der Compiler erzeugt daraus ein stabiles Core-Dokument, das XTend Runtime, SSR-Adapter und Tooling auswerten können.

```rmt
template learn.rmt.hello {
  surface root {
    lane visible weight 80 {
      mount hello-card
    }
  }
}
```

## Lernpfad

Beginne mit den [Syntax-Grundlagen](./learn-rmt-syntax-basics.md), dann folge Templates, State, Actions, Daten, Scheduling und Sicherheit. Nutze den [RMT Playground](./learn-rmt-playground.md), wenn du ein kleines Beispiel direkt im Developer Center kompilieren möchtest.

## Nächster Schritt

Öffne die [Syntax-Grundlagen](./learn-rmt-syntax-basics.md) und kompiliere das erste vollständige Dokument.
