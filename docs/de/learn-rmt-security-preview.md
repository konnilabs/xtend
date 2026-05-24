# Sicherheit und Preview

RMT ist deklarativ, aber der Playground akzeptiert beliebige Texteingabe. Das Developer Center kompiliert Quelle deshalb, meldet Diagnosen und rendert ausschließlich strukturierte Ausgabe über einen engen Preview-Pfad.

## Sicherheitsregeln Im Playground

Der Playground führt kein von Nutzern geschriebenes JavaScript aus, gibt keine rohen HTML-Fragmente aus dem Compile-Endpunkt zurück und setzt die Preview-Surface zwischen Kompilierungen zurück. Inline-Handler-Strings, HTML-Fragment-Rendering, Remote-Imports und unsichere URL-Protokolle werden blockiert oder diagnostiziert.

```rmt
template learn.rmt.safePreview {
  state preview.message type object preserve {
    initial {
      id "safe"
      text "Rendered from structured RMT output"
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

## Verwandte Referenz

Für produktives Rendering lies [Trusted DOM Sanitizing](./trusted-dom-sanitizing.md) und den [DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md).

## Nächster Schritt

Öffne den [RMT Playground](./learn-rmt-playground.md).
