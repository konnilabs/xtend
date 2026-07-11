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

## Maraca Runtime Preview

Der Playground sendet erfolgreiche Quellen zusätzlich mit `playgroundMode: "maraca-preview"` an `docs/index.php?xtend-rmt-playground=compile`. Die Antwort enthält weiter `coreJson` und `preview`, ergänzt aber `maraca.schema = "xtend.docs.rmt-playground.maraca-preview.v1"` mit Feature-Status für `orchestration`, `kernel`, `hydration`, `validation` und `transitions`.

Wähle im Preset-Menü `Customer Service Kernel`, um die App aus `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt` im Browser zu starten. Die Preview lädt nur die whitelisted Runtime-Module aus `DOCS_RMT_PLAYGROUND_MARACA_RUNTIME_MODULES`, materialisiert die Surfaces in einem isolierten Root, routet DOM-Events an RMT-Actions, patcht Validation-Gates wie `product.service.nextContact` und protokolliert Transition-Events wie `xtend-maraca:surface-transition-start`.

Für Browser-Smokes steht `window.xtendDocsRmtPlaygroundLastMaraca` bereit. Ein erfolgreicher Snapshot enthält Kernel-, Validation- und Transition-Zähler; die lokale Gate-Prüfung ist `node scripts/run_xtend_tests.js rmt-playground-docs rmt-playground-security --json`.

## Vom Playground Zum Bundle

Nutze den Playground für schnelle Syntax- und Modelltests, aber verlasse dich für produktive App-Orchestrierung auf Maraca. Kopiere ein funktionierendes Beispiel in eine `.rmt` Datei, ergänze echte Portals, Validation und Transitions und baue es danach mit `xt maraca build`. So prüfst du denselben RMT-Ausdruck gegen Bundle-Report, Kernel-Plan und Browser Bridge statt nur gegen die Preview-Ausgabe.

## Nächster Schritt

Schließe den Lernpfad mit [Nächste Schritte](./learn-rmt-next-steps.md) ab.
