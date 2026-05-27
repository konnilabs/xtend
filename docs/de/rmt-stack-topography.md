# RMT Stack-Topographie

Die RMT Stack-Topographie erklärt, wie RMT Source, Compiler, Kernel, Fabric und UI-Schichten zusammenspielen. Sie hilft dir, XTendRMT nicht nur als Dokumentensprache zu lesen, sondern als Baustein für größere Anwendungen einzuordnen.

![RMT Stack-Topographie](../assets/rmt-stack-topography.svg)

## Schichten

Der RMT Source beschreibt App-Struktur, State, Selectors, Actions, Events, Resources, Surfaces und Scheduling-Absicht. Der Compiler übersetzt diese Beschreibung in stabile Core Records.

Der RMT Kernel verarbeitet diese Records host-neutral. Er plant Arbeit, verwaltet Runtime-State, löst Actions aus, publiziert Diagnostics und bleibt unabhängig von DOM, CSS und Frameworks.

XTend Fabric übersetzt Scheduling-Absicht in Lanes, Hydration-Entscheidungen, Telemetrie und Backpressure-Signale. Host Adapter verbinden diese Signale mit Browser, Server, Worker oder App Shell.

XTend UI, React, Vue oder VanillaJS rendern am Rand des Systems. Sie erhalten Props, Attribute, Slots, Events und Hydration-Aufträge über Adapter und bleiben dadurch austauschbar.

## Integrationsmodelle

Im XTend-only-Modell beschreibt RMT die App Shell, Fabric koordiniert die Arbeit und XTend UI rendert die sichtbaren Web Components.

Im MFE-Modell kann eine XTend Shell Surfaces für andere Teams bereitstellen. Diese Surfaces können XTend UI, React, Vue oder VanillaJS nutzen, solange sie über klare DOM- und Adapter-Grenzen angebunden werden.

Im Scheduler-Modell läuft der RMT Kernel als orchestrierende Schicht neben bestehenden Frontends. Dann nutzt die App RMT für State, Aktionen, Ressourcen und Scheduling, während die konkrete UI weiterhin in einem vorhandenen Framework entsteht.

## Nächste Schritte

- [RMT Kernel Runtime](./rmt-kernel-runtime.md)
- [XTend Fabric Runtime](./xtend-fabric-runtime.md)
- [XTend UI Runtime-Schicht](./xtend-ui-runtime-layer.md)
- [XTendRMT Runtime Bridge](./xtendrmt-runtime-bridge.md)

## Öffentlicher Vertrag

RMT Stack-Topographie ist der öffentliche RMT Runtime-Vertrag für `docs/de/rmt-stack-topography.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT Records, Compiler-Ausgaben, Runtime-Adapter, Events, Actions und Scheduler-Lanes.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/rmt-stack-topography.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/rmt-stack-topography.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`

Befehle:
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn Runtime-Verhalten anders wirkt, trenne Compiler-Record, Host-Adapter und Scheduler-Signal, bevor du die Doku änderst.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
