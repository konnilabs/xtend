# RMT Classic Authoring Guide

Schreibe App Shells, Routen, Surfaces und Interaktionen in einer RMT Quelle.

## Worum es geht

RMT Classic Authoring führt von einer lesbaren `.rmt` Source zu validierten Core-Records. Die Sprache trennt deklarative App-Struktur von Host-Diensten und macht Referenzen, Ownership und Scheduling bereits vor der Runtime prüfbar.

## Öffentliche Bausteine

- `tools/rmt-language/vnext-parser.js` liest RMT Classic Records.
- `tools/rmt-language/vnext-compiler.js` erzeugt das Core-Dokument.
- `docs/xtendrmt-docs-shell-vnext.rmt` ist eine größere, reale Source-Probe.

## Empfohlener Ablauf

Schreibe zuerst Template, State und eine Surface. Lasse Parser und Linter laufen, ergänze danach Actions, Resources und Policies und prüfe jeden Schritt über den Core-Diff statt über zufälliges Browserverhalten.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT AnimationEngine](./rmt-animation-engine.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Classic Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT Classic Releasevertrag](./rmt-vnext-migration-notes.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Orchestrierungs-Primitives

RMT Classic kann inzwischen die komplette App-Orchestrierung beschreiben, die Maraca in ein loaderloses Bundle materialisiert. Neben `state`, `selector`, `action`, `resource`, `event`, `surface`, `portal` und `overlay` sind `validation`, `animation` und `transition` native Authoring-Bausteine. Der Compiler senkt sie in `xtend.rmt.app-orchestration.v1`, `xtend.rmt.form-validation.v1`, `xtend.rmt.surface-transitions.v1` und `xtend.rmt.animation-engine.v1` und erzeugt Scheduler-Ziele, Patch-Pläne, Source Maps und redigierte Diagnostics.

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

Der Deep-Dive [Hydration Policies](./hydration-policies.md) trennt Execution Mode, Scheduling Policy und DOM-Ownership und zeigt kompilierbare Beispiele für Client Rendering, SSR Hydration, Resume und Worker-Prerender.

### Lokale Portal-Komposition

Ein Portal, dessen Root-Selektor eine bekannte lokale Surface referenziert,
komponiert seine Surfaces als Kinder dieser Surface. Die Komposition ist
rekursiv: Ein Shell-Manager kann daher ein `x-form` enthalten, das wiederum
Felder und Actions enthält.

```rmt
portal app.formChildren root "[data-maraca-surface='app.form']" layer surface
```

Ein einfacher ID-Selektor kann außerdem auf ein Element im statischen
`viewTemplate` der Parent-Surface zeigen. So bleiben Layout-Rezepte auf
Light-DOM-Gruppen-Wrappern, während die Child-Surfaces frameworkverwaltet sind:

```rmt
surface app.form component x-form {
  viewTemplate {
    element div {
      attributes { id "app-form-actions" class "xtm-actions" }
    }
  }
}
portal app.formActions root "#app-form-actions" layer surface
```

Nur direkte Kinder eines `x-surface-manager` erhalten dessen öffentliches
Slot-Mapping. Kinder gewöhnlicher Parents bleiben normale DOM-Kinder.
Unbekannte, mehrdeutige oder zyklische lokale Parent-Referenzen sind
blockierende Compiler-Diagnostics. Ein statisches ID-Target muss über alle
lokalen Surface-Templates hinweg eindeutig sein.

## Referenzdemo und Releasevertrag

Der RMT Classic Authoring Guide ist an den Releasevertrag `xtend.rmt.vnext-release-handoff.v1` gebunden. Die Referenzquelle `demos/xtendrmt/fixtures/vnext-reference/source.rmt` zeigt die kleinste vollständige Kombination aus `template`, `surface`, `lane`, `when`, `slot`, `stream`, `trust boundary`, `sanitize html` und Event-Action-Binding. Der erwartete Core-Output liegt in `demos/xtendrmt/fixtures/vnext-reference/generated/core.json`.

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

Wenn ein Beispiel in diesem Guide erweitert wird, muss es entweder mit der Referenzdemo kompatibel bleiben oder als neue Fixture in `tests/rmt-language` abgesichert werden. Die Abschlussseite [RMT Classic Releasevertrag](./rmt-vnext-migration-notes.md) beschreibt, welche Gates für diesen Vertrag massgeblich sind.

Der [AnimationEngine-Guide](./rmt-animation-engine.md) führt die AOT-Definition von Presets, Transitions, Keyframes und Reduced-Motion-Policies als eigenständigen Praxispfad fort.

## Compiler-Einstiege und Prüfgrenze

`compileRmtVNextSource(input, options)` parst RMT und liefert ein Compilerresultat mit `ok`, Diagnosen, Core und abgeleiteten Plänen. `compileRmtVNextAst(ast, options)` und die Factory-Methode `compileAst()` übernehmen einen syntaktisch gültigen `xtend.rmt.vnext.ast.v1`-Baum. Beide Einstiege verwenden anschließend dieselbe semantische Prüfung, Lowering-, AppService- und Orchestrierungspipeline.

Der AST-Einstieg behält seinen Core-Rückgabewert bei Erfolg. Bei Fehlern wirft er einen `RmtAstCompilationError` mit `code: rmt.vnext.ast.compilation_failed`, `phase` und `diagnostics`; ein ungültiger AST wird nicht als erfolgreicher Core zurückgegeben. `options.sourceModel` kann das Source-Modell des erfolgreichen Parserresultats übernehmen, damit Datei, URI und Diagnosekontext erhalten bleiben. Ohne Source-Modell können `filePath` und `uri` angegeben werden; die AST-Ranges bleiben Teil des Eingabevertrags.

Die gemeinsame Grenze prüft AST-Version, Dokumentwurzel, Top-Level-Deklarationen und den Datencharakter des Baums. Sie ersetzt nicht die Syntaxprüfung des Frontends oder ein vollständiges, noch festzulegendes Schema für fremde Frontends. Ein RMTX-Frontend und dessen syntaxneutrale Repräsentation sind damit noch nicht definiert.

### Eindeutige Core-Identitäten

Source-Namen bleiben case-sensitiv; die bestehende Core-ID-Normalisierung verwendet unter anderem Kleinbuchstaben und entfernt äußere Unterstriche. Wenn etwa die States `app.One` und `app.one` auf dieselbe ID abgebildet werden, bricht der Compiler mit `rmt.vnext.core.id_collision` vor der Projektion ab. Die Diagnose nennt beide Fundstellen. Es werden keine Core-/Service-/Orchestrierungsartefakte ausgegeben. Das gilt auch für kollidierende Template-, Lane- und Slot-Identitäten; eindeutige bisherige IDs bleiben unverändert. Verschiedene Domains und unterstützte getrennte Scopes dürfen weiterhin gleichnamige Records besitzen, solange die erzeugten IDs eindeutig sind.

### Vollständige Compilerdiagnosen

Das Compilerresultat enthält unter `diagnostics` Parser-, zuständige semantische, Compiler- und sämtliche Orchestrierungsplan-Meldungen. `compilerDiagnostics` umfasst Lowering, AppService und alle Plandiagnosen; verschachtelte Plankanäle bleiben verfügbar. Planmeldungen tragen `stage: orchestration`, ihren `plan` und nach Möglichkeit den Source-Map-Bezug. Identische Meldungen werden dedupliziert; unterschiedliche Felder oder Fundstellen bleiben erhalten. Warnungen lassen den Compile erfolgreich; Fehler setzen `ok: false` und führen beim AST-Einstieg zur Ablehnung mit demselben Diagnosebestand.
