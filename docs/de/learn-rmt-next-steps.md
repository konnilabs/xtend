# RMT Nächste Schritte

Du kennst jetzt den Kernfluss von RMT-vNext: Templates definieren Grenzen, Surfaces definieren renderbare Einheiten, State und Selectors definieren Daten, Actions behandeln Nutzerabsicht, Ressourcen beschreiben Lifecycle-Besitz und Lanes drücken Scheduling-Priorität aus.

## Wohin Danach

Nutze [RMT vNext Authoring](./rmt-vnext-authoring.md) als Referenz für vollständige Sprachdetails. Lies die [App DSL](./xtendrmt-app-dsl.md), wenn du ganze Anwendungen modellieren möchtest, und fahre dann mit [XTend Maraca](./xtend-maraca.md), [Runtime Bridge](./xtendrmt-runtime-bridge.md), [RMT Linter](./rmt-linter.md) und [Language Server](./rmt-language-server.md) fort.

Für UI-Integration lies [SurfaceManager Authoring](./surface-manager-authoring-guide.md) und [XTend Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md).

## Übung

Öffne den [RMT Playground](./learn-rmt-playground.md), füge eine zweite Surface hinzu und gib ihr ein niedrigeres Lane-Gewicht. Vergleiche danach die kompilierte Ausgabe mit den Referenzdocs.

## Produktionspfad

Wenn dein Übungsdokument State, Actions, Validation oder Surface Transitions enthält, baue es als Maraca App weiter. Starte mit [XTend Maraca](./xtend-maraca.md), prüfe danach [Maraca Orchestrierung](./xtend-maraca-orchestration.md) und vergleiche dein Dokument mit `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`. Der entscheidende lokale Check ist der Strict-Build, weil er die öffentliche App-Orchestrierung und nicht nur den Parserpfad beweist.

## Öffentlicher Vertrag

RMT Nächste Schritte ist der öffentliche Lernpfad-Vertrag für `docs/de/learn-rmt-next-steps.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT-Quelldateien, Parser-Verhalten, Linter-Diagnosen und Playground-Ausgaben.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/learn-rmt-next-steps.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/learn-rmt-next-steps.md`
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

- Wenn ein Beispiel nicht kompiliert, prüfe zuerst Token-Reihenfolge, Record-Namen und Linter-Ausgabe.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
