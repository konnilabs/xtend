# RMT Nächste Schritte

Du kennst jetzt den Kernfluss von RMT-vNext: Templates definieren Grenzen, Surfaces definieren renderbare Einheiten, State und Selectors definieren Daten, Actions behandeln Nutzerabsicht, Ressourcen beschreiben Lifecycle-Besitz und Lanes drücken Scheduling-Priorität aus.

## Wohin Danach

Nutze [RMT vNext Authoring](./rmt-vnext-authoring.md) als geführten Einstieg und [RMT Reference](./rmt-reference.md) für die vollständige Operator-Syntax. Lies die [App DSL](./xtendrmt-app-dsl.md), wenn du ganze Anwendungen modellieren möchtest, und fahre dann mit [XTend Maraca](./xtend-maraca.md), [Runtime Bridge](./xtendrmt-runtime-bridge.md), [RMT Linter](./rmt-linter.md) und [Language Server](./rmt-language-server.md) fort.

Für UI-Integration lies [SurfaceManager Authoring](./surface-manager-authoring-guide.md) und [XTend Fabric RMT Lane Mapping](./xtend-fabric-rmt-lane-mapping.md).

## Übung

Öffne den [RMT Playground](./learn-rmt-playground.md), füge eine zweite Surface hinzu und gib ihr ein niedrigeres Lane-Gewicht. Vergleiche danach die kompilierte Ausgabe mit den Referenzdocs.

## Produktionspfad

Wenn dein Übungsdokument State, Actions, Validation oder Surface Transitions enthält, baue es als Maraca App weiter. Starte mit [XTend Maraca](./xtend-maraca.md), prüfe danach [Maraca Orchestrierung](./xtend-maraca-orchestration.md) und vergleiche dein Dokument mit `products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt`. Der entscheidende lokale Check ist der Strict-Build, weil er die öffentliche App-Orchestrierung und nicht nur den Parserpfad beweist.

## Lokaler Abschlusscheck

Prüfe Lernpfad, Playground und Referenz gemeinsam. Der JSON-Report nennt die fehlerhafte Suite und bleibt damit auch in CI auswertbar:

```bash
node scripts/run_xtend_tests.js rmt-playground-docs rmt-reference-docs --json
```

Wenn der Lauf fehlschlägt, korrigiere zuerst die RMT Quelle gegen `tools/rmt-language/vnext-parser.js` und führe den Befehl unverändert erneut aus.
