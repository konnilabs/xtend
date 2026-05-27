# Actions und Events

Actions beschreiben Zustandsänderungen und fachliche Events. Surfaces können DOM- oder Komponentenereignisse an Actions binden, ohne ausführbares JavaScript in die RMT-Quelle einzubetten.

## Sicherer Event-Fluss

Halte Event-Selektoren deklarativ, übergib Payload-Werte über Action-Inputs und lass die Runtime Reducer anwenden.

```rmt
template learn.rmt.interactions {
  state page.counter type object preserve {
    initial {
      value 0
      status "ready"
    }
  }

  action page.increment {
    input label string
    reduce state.page.counter.status = "incremented"
    emit page.counter.incremented with label input.label
  }

  surface counter.card kind card component x-status {
    lane visible weight 90 {
      mount counter-card
    }

    on click "[data-action=increment]" -> action page.increment {
      payload label from target.dataset.label
    }
  }
}
```

## Maraca Action Gates

Maraca verbindet Actions mit Validation, Scheduler-Zielen und Telemetrie. Ein `emit` Record wird im Strict-Pfad nur dann nützlich, wenn Payload-Namen stabil bleiben und die Surface-Bindung auf eine vorhandene Action zeigt. Für Formularflüsse prüft [Maraca Orchestrierung](./xtend-maraca-orchestration.md), ob `target action` aus einer `validation` Gruppe tatsächlich zu dieser Action passt.

## Nächster Schritt

Ergänze externe Daten und Lifecycle-Cleanup mit [Daten und Ressourcen](./learn-rmt-data-resources.md).

## Öffentlicher Vertrag

Actions und Events ist der öffentliche Lernpfad-Vertrag für `docs/de/learn-rmt-actions-events.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT-Quelldateien, Parser-Verhalten, Linter-Diagnosen und Playground-Ausgaben.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/learn-rmt-actions-events.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/learn-rmt-actions-events.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`
- `x-status`

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
