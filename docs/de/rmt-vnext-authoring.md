# RMT Authoring Guide

Schreibe App Shells, Routen, Surfaces und Interaktionen in einer RMT Quelle.

## Worum es geht

RMT vNext Authoring führt von einer lesbaren `.rmt` Source zu validierten Core-Records. Die Sprache trennt deklarative App-Struktur von Host-Diensten und macht Referenzen, Ownership und Scheduling bereits vor der Runtime prüfbar.

## Öffentliche Bausteine

- `tools/rmt-language/vnext-parser.js` liest vNext Records.
- `tools/rmt-language/vnext-compiler.js` erzeugt das Core-Dokument.
- `docs/xtendrmt-docs-shell-vnext.rmt` ist eine größere, reale Source-Probe.

## Empfohlener Ablauf

Schreibe zuerst Template, State und eine Surface. Lasse Parser und Linter laufen, ergänze danach Actions, Resources und Policies und prüfe jeden Schritt über den Core-Diff statt über zufälliges Browserverhalten.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT AnimationEngine](./rmt-animation-engine.md)
- [RMT Reference](./rmt-reference.md)
- [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT vNext Releasevertrag](./rmt-vnext-migration-notes.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Orchestrierungs-Primitives

RMT vNext kann inzwischen die komplette App-Orchestrierung beschreiben, die Maraca in ein loaderloses Bundle materialisiert. Neben `state`, `selector`, `action`, `resource`, `event`, `surface`, `portal` und `overlay` sind `validation`, `animation` und `transition` native Authoring-Bausteine. Der Compiler senkt sie in `xtend.rmt.app-orchestration.v1`, `xtend.rmt.form-validation.v1`, `xtend.rmt.surface-transitions.v1` und `xtend.rmt.animation-engine.v1` und erzeugt Scheduler-Ziele, Patch-Pläne, Source Maps und redigierte Diagnostics.

```rmt
validation product.service.contact {
  mode blocking
  target action product.service.nextContact
  field product.service.email required email message "Enter a valid email address."
}

animation product.service.stepMotion {
  effect pop
  durationMs 220
  easing "cubic-bezier(.2,.8,.2,1)"
  reducedMotion fade
  keyframe enter {
    opacity 0
    transform "scale(.96)"
    offset 0
  }
}

transition product.service.contactToIssue {
  trigger action product.service.nextContact
  from surfaces [product.service.email product.service.nextContact]
  to surfaces [product.service.subject product.service.nextIssue]
  use animation product.service.stepMotion
  effect crossfade
  durationMs 240
  easing "ease-out"
  interrupt replace
  reducedMotion fade
  lane transition
}
```

Strict Builds erwarten vollständige Payload Contracts, Resource Ownership, Hydration Policies, bekannte Component Capabilities, Messages pro Validation Field und auflösbare Transition Surfaces. Animationen erlauben standardmäßig nur `opacity` und `transform`; `filter` ist nur per `allowFilter` für Effekte wie `fade-blur` zulässig. Maraca baut daraus Kernel-, Hydration-, Validation-, AnimationEngine- und Transition-Runtimes; Host-Code bleibt Adapterlogik.

## Referenzdemo und Releasevertrag

Der RMT vNext Authoring Guide ist an den Releasevertrag `xtend.rmt.vnext-release-handoff.v1` gebunden. Die Referenzquelle `xtendrmt/rmt-vnext-reference-demo.rmt` zeigt die kleinste vollständige Kombination aus `template`, `surface`, `lane`, `when`, `slot`, `stream`, `trust boundary`, `sanitize html` und Event-Action-Binding. Der erwartete Core-Output liegt in `xtendrmt/rmt-vnext-reference-demo.core.json`.

```rmt
template xtend.vnext.reference {
  surface root {
    lane critical weight 10 {
      hydrate app-shell
      hydrate hero-panel when route.visible == true
    }
  }
}
```

Wenn ein Beispiel in diesem Guide erweitert wird, muss es entweder mit der Referenzdemo kompatibel bleiben oder als neue Fixture in `tests/rmt-language` abgesichert werden. Die Abschlussseite [RMT vNext Releasevertrag](./rmt-vnext-migration-notes.md) beschreibt, welche Gates für diesen Vertrag massgeblich sind.

Der [AnimationEngine-Guide](./rmt-animation-engine.md) führt die AOT-Definition von Presets, Transitions, Keyframes und Reduced-Motion-Policies als eigenständigen Praxispfad fort.
