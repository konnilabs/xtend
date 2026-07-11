# RMT Syntax-Grundlagen

Diese Seite zeigt die Grundform einer gültigen RMT-vNext-Quelldatei. Vorwissen zu HTML und JavaScript reicht für den Einstieg aus.

## Dokumentform

Ein RMT-Dokument beginnt mit einem `template`. Darin liegen Deklarationen wie `state`, `selector`, `action`, `portal`, `resource` und `surface`. Blöcke verwenden geschweifte Klammern, Strings stehen in Anführungszeichen und verschachtelte Deklarationen beschreiben Besitz und Zuordnung. Die akzeptierten Record-Formen werden von `tools/rmt-language/vnext-parser.js` gelesen; bei einer Abweichung ist dessen Diagnose maßgeblich.

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

## Validation und Transitions

Formularlogik und Motion müssen nicht als Host-JavaScript neben der RMT Datei entstehen. Mit `validation` deklarierst du Field Rules und Action Gates; mit `animation` deklarierst du wiederverwendbare Motion-Presets; mit `transition` deklarierst du den visuellen Wechsel zwischen Surface-Gruppen.

```rmt
validation demo.contact {
  mode blocking
  target action demo.nextContact
  field demo.email required email message "Enter a valid email address."
}

animation demo.stepMotion {
  effect pop
  durationMs 220
  easing "cubic-bezier(.2,.8,.2,1)"
  reducedMotion fade
}

transition demo.contactToIssue {
  trigger action demo.nextContact
  from surfaces [demo.email demo.nextContact]
  to surfaces [demo.subject demo.nextIssue]
  use animation demo.stepMotion
  effect slide-left
  durationMs 220
  easing "ease-out"
  interrupt replace
  reducedMotion fade
  lane transition
}
```

`required`, `email`, `minLength`, `maxLength`, `pattern`, `message`, `target action`, `use animation`, `from surfaces`, `to surfaces`, `effect`, `durationMs`, `interrupt` und `reducedMotion` sind Teil der vNext-Syntax. `lane transition` sorgt dafür, dass der Wechsel über den Kernel Scheduler geplant werden kann.

## Maraca-Relevanz

Maraca liest genau diese Records aus der `.rmt` Quelle und entscheidet im Strict Mode, ob Validation, Transition und Kernel-Schicht vollständig genug sind. Wenn du später `xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json` ausführst, werden fehlende Targets, unbekannte Komponenten und unvollständige Messages zu Build-Diagnosen statt zu stillen Runtime-Fallbacks. Der nächste produktive Kontext ist [Maraca Orchestrierung](./xtend-maraca-orchestration.md).
