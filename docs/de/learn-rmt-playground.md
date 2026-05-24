# RMT Playground

Der RMT Playground kompiliert RMT-vNext-Quelle direkt im Developer Center. Er nutzt `x-surface-manager` als Arbeitsfläche, `x-textarea` für die erste Editor-Version, Diagnose- und JSON-Ausgabeflächen sowie ein sicheres Preview-Ziel, das niemals rohes Compiler-HTML rendert.

## Ausprobieren

Der interaktive Playground wird unter diesem Artikel gerendert. Ändere die Quelle, danach läuft der Compiler nach einem kurzen Debounce. Diagnosen zeigen Zeilen- und Spaltenbereiche, wenn der Compiler sie bereitstellt.

```rmt
template learn.rmt.playground {
  state preview.message type object preserve {
    initial {
      id "hello"
      text "Hello from the playground"
      tone "success"
    }
  }

  selector preview.message from state preview.message {
    output PreviewMessage
  }

  surface preview.card kind card component x-status {
    source selector preview.message
    key message.id

    lane visible weight 80 {
      hydrate preview-card from selector preview.message
    }
  }
}
```

## Sicherheitsmodell

Der Compile-Endpunkt akzeptiert nur POST-Anfragen, begrenzt die Quellgröße und liefert JSON-Diagnosen plus Core-Ausgabe. Die Preview-Surface rendert eine strukturierte Zusammenfassung mit DOM-APIs, nicht mit `innerHTML`.

## Nächster Schritt

Schließe den Lernpfad mit [Nächste Schritte](./learn-rmt-next-steps.md) ab.
