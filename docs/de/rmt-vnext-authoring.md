# RMT Authoring Guide

Schreibe App Shells, Routen, Surfaces und Interaktionen in einer RMT Quelle.

## Worum es geht

RMT Authoring Guide beschreibt die öffentliche RMT-Oberfläche dieser Seite: welche Records betroffen sind, welche Adapter sie ausüben und welche Scheduler-Signale ein Host prüfen sollte.

## Öffentliche Bausteine

- `.rmt` Quellen.
- Core Records und Source Maps.
- Host Adapter für DOM, Router und Komponenten.

## Empfohlener Ablauf

Beginne bei RMT Authoring Guide mit dem kleinsten Record-Beispiel, prüfe es mit dem Linter und binde erst danach Adapter für Host-Daten, Routing oder Komponenten an.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Reference](./rmt-reference.md)
- [RMT vNext Migration Notes](./rmt-vnext-migration-notes.md)
- [RMT vNext Releasevertrag](./rmt-vnext-release-handoff.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Orchestrierungs-Primitives

RMT vNext kann inzwischen die komplette App-Orchestrierung beschreiben, die Maraca in ein loaderloses Bundle materialisiert. Neben `state`, `selector`, `action`, `resource`, `event`, `surface`, `portal` und `overlay` sind `validation` und `transition` native Authoring-Bausteine. Der Compiler senkt sie in `xtend.rmt.app-orchestration.v1`, `xtend.rmt.form-validation.v1` und `xtend.rmt.surface-transitions.v1` und erzeugt Scheduler-Ziele, Patch-Pläne, Source Maps und redigierte Diagnostics.

```rmt
validation product.service.contact {
  mode blocking
  target action product.service.nextContact
  field product.service.email required email message "Enter a valid email address."
}

transition product.service.contactToIssue {
  trigger action product.service.nextContact
  from surfaces [product.service.email product.service.nextContact]
  to surfaces [product.service.subject product.service.nextIssue]
  effect crossfade
  durationMs 240
  easing "ease-out"
  lane transition
}
```

Strict Builds erwarten vollständige Payload Contracts, Resource Ownership, Hydration Policies, bekannte Component Capabilities, Messages pro Validation Field und auflösbare Transition Surfaces. Maraca baut daraus Kernel-, Hydration-, Validation- und Transition-Runtimes; Host-Code bleibt Adapterlogik.

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

Wenn ein Beispiel in diesem Guide erweitert wird, muss es entweder mit der Referenzdemo kompatibel bleiben oder als neue Fixture in `tests/rmt-language` abgesichert werden. Die Abschlussseite [RMT vNext Releasevertrag](./rmt-vnext-release-handoff.md) beschreibt, welche Gates für diesen Vertrag massgeblich sind.

## Öffentlicher Vertrag

RMT Authoring Guide ist der öffentliche RMT Runtime-Vertrag für `docs/de/rmt-vnext-authoring.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT Records, Compiler-Ausgaben, Runtime-Adapter, Events, Actions und Scheduler-Lanes.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/rmt-vnext-authoring.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/rmt-vnext-authoring.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `xtend.rmt.app-orchestration.v1`

Befehle:
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-reference-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-reference-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn Runtime-Verhalten anders wirkt, trenne Compiler-Record, Host-Adapter und Scheduler-Signal, bevor du die Doku änderst.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
