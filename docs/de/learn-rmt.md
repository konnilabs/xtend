# Learn RMT

Learn RMT ist der geführte Einstieg in RMT-vNext. Die Strecke beginnt mit dem Sprachmodell und führt dann zu State, Actions, Ressourcen, Scheduling und dem integrierten Playground. Für ausgelieferte Anwendungen ist Maraca der anschließende Orchestrierungspfad.

## Was RMT Ist

RMT beschreibt Anwendungsstruktur als kompilierbares Dokument. Statt jede Surface von Hand zu verdrahten, deklarierst du das App-Template, den eigenen State, Selectors für View-Modelle, Actions für Zustandsänderungen und die Surfaces, die XTend rendern oder hydrieren soll.

Der Compiler erzeugt daraus ein stabiles Core-Dokument, das XTend Runtime, SSR-Adapter und Tooling auswerten können.
Die Syntax wird in `tools/rmt-language/parser.js` gelesen; `tools/rmt-language/vnext-compiler.js` erzeugt das vNext Core-Modell.

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

## Von RMT Zu Maraca

Der Lernpfad erklärt die Sprache; [XTend Maraca](./xtend-maraca.md) erklärt, wie dieselbe Quelle als App-Bundle ausgeliefert wird. Der Wechsel ist besonders wichtig, wenn das Dokument echte Runtime-Arbeit enthält: `validation`-Gruppen, `transition`-Blöcke, Action Gates, Hydration Policies oder kernel-schedulierte Lanes. Dann prüft der Maraca-Build nicht nur Syntax, sondern materialisiert eine browserfähige App-Orchestrierung.

## Nächster Schritt

Öffne die [Syntax-Grundlagen](./learn-rmt-syntax-basics.md) und kompiliere das erste vollständige Dokument.
