# RMT AnimationEngine

Die RMT AnimationEngine beschreibt UI-Übergänge zusammen mit den Surfaces und Actions, die sie auslösen. Effekte, Dauer, Easing, Unterbrechungsverhalten und barrierearme Fallbacks werden dadurch bereits beim Build geprüft, statt erst in verteiltem Browsercode sichtbar zu werden.

## Voraussetzungen

Du benötigst eine RMT-vNext-Quelle mit mindestens zwei Surfaces und einer Action, die zwischen ihnen wechselt. Für ein ausgeliefertes Bundle muss der Maraca-Build mit Orchestrierung und Transitions aktiviert sein. Der lokale Compiler liegt in `tools/rmt-language/vnext-compiler.js`; die Browser-Runtime wird über `xtendrmt/rmt-animation-engine-runtime.js` bereitgestellt.

```bash
xt rmt lint app.rmt --json
xt rmt build app.rmt --bundle maraca --orchestration strict --transitions strict --out dist --json
```

Der Build muss im Orchestrierungsartefakt das Schema `xtend.rmt.animation-engine.v1` ausgeben. Zur Laufzeit meldet die Engine `xtend.rmt.animation-engine-runtime.v1` und stellt unter anderem `runSurfaceTransitionPhase()`, `listActiveAnimations()` und `snapshot()` bereit.

## Eine Transition deklarieren

Das folgende Dokument verbindet eine Action mit zwei Surfaces. `animation docs.motion.detail` ist das wiederverwendbare Preset; `transition docs.motion.openDetail` bindet es an den konkreten Zustandswechsel. Der Host muss keine CSS-Klasse erraten und keine Action nachträglich beobachten.

```rmt
template docs.motion.example {
  state docs.motion.list type object preserve {
    initial {
      id "list"
      hidden false
    }
  }

  state docs.motion.detail type object preserve {
    initial {
      id "detail"
      hidden true
    }
  }

  selector docs.motion.list from state docs.motion.list {
    output MotionSurface
  }

  selector docs.motion.detail from state docs.motion.detail {
    output MotionSurface
  }

  action docs.motion.openDetail {
    input source string
    reduce state.docs.motion.list.hidden = true
    reduce state.docs.motion.detail.hidden = false
    emit docs.motion.changed with surface "detail"
  }

  animation docs.motion.detail {
    effect slide-left
    durationMs 240
    easing "cubic-bezier(.2,.8,.2,1)"
    reducedMotion fade
  }

  transition docs.motion.openDetail {
    trigger action docs.motion.openDetail
    from surfaces [docs.motion.list]
    to surfaces [docs.motion.detail]
    use animation docs.motion.detail
    layoutKey "docs-motion-content"
    interrupt replace
    reducedMotion fade
    lane transition
  }

  portal docs.motion.root root "#app" layer surface

  surface docs.motion.list kind view component x-section {
    source selector docs.motion.list
    key list.id
    portal docs.motion.root
    lane visible weight 80 {
      mount docs-motion-list from selector docs.motion.list
    }
  }

  surface docs.motion.detail kind view component x-section {
    source selector docs.motion.detail
    key detail.id
    portal docs.motion.root
    lane visible weight 80 {
      mount docs-motion-detail from selector docs.motion.detail
    }
  }
}
```

Der Compiler löst `use animation` auf und überträgt Effekt, Dauer, Easing und Reduced-Motion-Policy in den Transition-Record. Explizite Werte im `transition`-Block dürfen das Preset für diesen einen Wechsel überschreiben. Die Transition-Lane trennt die sichtbare Bewegung von Daten- oder Hintergrundarbeit.

## Effekte und Layout

Die aktuelle Effektliste umfasst `fade`, `crossfade`, vier Slide-Richtungen, `scale`, `pop`, `zoom`, `flip`, `rotate`, `expand`, `collapse`, `fade-blur`, `shared-element`, `layout-flip` und `none`. Für gewöhnliche Inhalte sind `fade`, `slide-left`, `slide-right` und `pop` gute Startpunkte. Bewegung über große Distanzen oder lange Laufzeiten erschwert Orientierung und sollte nicht als Standardnavigation dienen.

`shared-element` und `layout-flip` benötigen einen stabilen `layoutKey`. Ohne diesen Schlüssel kann der Compiler die korrespondierenden Layoutzustände nicht verbinden und meldet `rmt.animation.layout_key_missing`. `crossfade` wird als überlappende Enter-/Exit-Phase abgesenkt; andere Effekte verwenden standardmäßig serielle Phasen. Eine `timeline` kann die Reihenfolge explizit als parallel oder sequenziell festlegen.

Wird eine laufende Transition erneut ausgelöst, steuert `interrupt` das Verhalten. `replace` übernimmt die neueste Nutzerabsicht, `finish` wartet auf den laufenden Übergang und `cancel` verwirft ihn. Für Navigation ist `replace` meist die robusteste Wahl, weil eine schnelle zweite Aktion nicht hinter einer alten visuellen Entscheidung warten muss.

## Eigene Keyframes und Spring-Sampling

Ein Preset darf eigene Enter- oder Exit-Keyframes definieren. Standardmäßig akzeptiert der Compiler nur `opacity` und `transform`; damit bleibt der übliche Pfad compositorfreundlich. Eine Spring-Definition wird beim Build in feste Samples übersetzt, sodass die Browser-Runtime keine Physik neu berechnen muss.

```rmt
template docs.motion.popExample {
  animation docs.motion.pop {
    effect pop
    durationMs 240
    easing "cubic-bezier(.18,.9,.22,1)"
    keyframe enter {
      opacity 0
      transform "scale(.92)"
      offset 0
    }
    keyframe enter {
      opacity 1
      transform "scale(1)"
      offset 1
    }
    spring {
      stiffness 210
      damping 22
      mass 1
    }
    reducedMotion fade
  }
}
```

Filter sind absichtlich ausgeschlossen, solange ein Preset sie nicht einzeln erlaubt. Für `fade-blur` muss deshalb `allowFilter true` vorhanden sein. Diese Ausnahme sollte kurz bleiben, weil ein Blur über einen großen Text- oder Tabellenbereich deutlich teurer als Opacity und Transform sein kann.

```rmt
template docs.motion.blurExample {
  animation docs.motion.blur {
    effect fade-blur
    durationMs 180
    easing "ease-out"
    allowFilter true
    keyframe enter {
      opacity 0
      filter "blur(6px)"
      offset 0
    }
    keyframe enter {
      opacity 1
      filter "blur(0px)"
      offset 1
    }
    reducedMotion fade
  }
}
```

## Reduced Motion und Laufzeitverhalten

`reducedMotion fade` ersetzt den gewählten Effekt durch einen kurzen Fade von höchstens 120 ms, wenn der Browser `prefers-reduced-motion: reduce` meldet. `instant` und `none` führen ohne sichtbare Bewegung zum Zielzustand. Die Runtime liest die echte Browserpräferenz; Produktionscode darf `matchMedia` dafür nicht überschreiben.

Die Live-Demo oberhalb dieses Artikels verwendet dieselbe Runtime und einen vorab kompilierten Plan. Die Auswahl verändert nur eine begrenzte Vorschaukopie des AOT-Records. `Systemeinstellung` übernimmt die Browserpräferenz, während die drei Vorschauoptionen den jeweiligen Fallback über einen injizierten Testadapter sichtbar machen. Die Demo verändert keine Browser-Globals und lädt während des Replay keine Daten nach.

AnimationEngine-Ereignisse wie `xtend-rmt:animation-start`, `xtend-rmt:animation-phase`, `xtend-rmt:animation-complete`, `xtend-rmt:animation-interrupt` und `xtend-rmt:animation-fallback` eignen sich für Telemetrie. Der kanonische Zustand bleibt trotzdem in RMT State und Surface Runtime; Ereignisse sind Beobachtungssignale, keine zweite State-Quelle.

## Erwartetes Ergebnis

Nach einem erfolgreichen Build enthält das Maraca-Artefakt einen AnimationEngine-Plan mit aufgelösten Presets, Transition-Zielen, Scheduler-Records und Reduced-Motion-Policies. Beim Auslösen der Action animiert die Runtime Exit und Enter, aktualisiert danach die Surface-Sichtbarkeit und räumt aktive Animationen auf. `snapshot()` zeigt aktive Records, Fallback-Zähler, die letzten Ergebnisse und redigierte Diagnostics.

Die vollständige Produktprobe unter `products/rmt-animation-testbench` zeigt zusätzlich SSR Resume, XScaler-Preflight und mehrere lazy Surfaces. Starte sie bei Bedarf mit:

```bash
npm --prefix products/rmt-animation-testbench run build
npm --prefix products/rmt-animation-testbench run dev
```

Danach ist die TestBench standardmäßig unter `http://127.0.0.1:9196/` erreichbar.

## Fehlerbehebung

| Signal | Ursache | Behebung |
| --- | --- | --- |
| `rmt.animation.effect_unknown` | Der Effekt gehört nicht zum Compilerkatalog. | Nutze einen Effekt aus der Liste dieses Artikels und kompiliere erneut. |
| `rmt.animation.reference_missing` | `use animation` verweist auf kein bekanntes Preset. | Gleiche die vollständig qualifizierten IDs von Animation und Transition ab. |
| `rmt.animation.layout_key_missing` | `shared-element` oder `layout-flip` besitzt keinen `layoutKey`. | Vergib auf der Transition einen stabilen Schlüssel für beide Layoutzustände. |
| `rmt.animation.filter_opt_in_missing` | `fade-blur` verwendet Filter ohne Freigabe. | Setze `allowFilter true` im referenzierten Animation-Preset. |
| `rmt.animation.interrupt_invalid` | Die Interrupt-Policy ist unbekannt. | Verwende `replace`, `finish` oder `cancel`. |
| `rmt.animation.transition_reduced_motion_invalid` | Die Reduced-Motion-Policy ist ungültig. | Verwende `fade`, `instant` oder `none`. |
| `rmt.animation_engine.xutils_missing` | Die Runtime findet keinen lokalen XUtils-Transition-Runner. | Binde `components/xutils.js` lokal vor der AnimationEngine ein; die Engine degradiert bis dahin instantan. |

Die vollständige Syntax steht in [Validation und Transitions](./rmt-reference-validation-transitions.md). Der [RMT Authoring Guide](./rmt-vnext-authoring.md) ordnet Animationen in State, Actions und Surfaces ein; [Motion und Kontrast](./motion-contrast.md) beschreibt die zugehörigen Accessibility-Prüfungen.
