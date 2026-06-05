# Daten und Ressourcen

RMT kann Host-Datenquellen und Runtime-Ressourcen direkt neben den Surfaces beschreiben, die sie verwenden. Die Runtime führt weiterhin aus; das RMT-Dokument deklariert den Vertrag.

## Datenverträge

Nutze `datasource` für Host-Aufrufe und `resource` für Dinge, die freigegeben werden müssen, etwa Timer, Subscriptions oder Object URLs.

```rmt
template learn.rmt.dataflow {
  state app.items type object preserve {
    initial {
      id "inbox"
      count 3
    }
  }

  selector app.itemsView from state app.items {
    output ItemsView
  }

  datasource app.items from endpoint "/api/items" {
    method GET
    contract ItemList
    result records
    fallback fixture app.items.fixture
  }

  resource app.refreshTimer kind timer owner surface.inbox.card {
    dispose on surface.destroy
  }

  surface inbox.card kind card component x-status {
    source selector app.itemsView
    key items.id
    bounds x 16 y 16 width 320 height 100
    destroy releases resource app.refreshTimer

    lane visible weight 75 {
      hydrate inbox-card from selector app.itemsView
    }
  }
}
```

## Maraca Resource Ownership

Ressourcen sind für Maraca mehr als Kommentar zur Laufzeit. `owner surface.inbox.card` und `destroy releases resource app.refreshTimer` werden im Orchestrierungsplan genutzt, damit Kernel Runtime und Surface Lifecycle dieselbe Besitzregel kennen. Wenn der Build einen Resource Owner nicht auflösen kann, ist das ein Hinweis auf ein echtes App-Problem und nicht nur auf fehlenden Dokumentationstext.

## Collection- und Search-Resources

Die eigene RMT-Oberfläche nutzt dasselbe Data- und Resource-Modell für Data Display und Command/Search:

- `resource.orders` speist `selector.visibleOrders`, der `collection.orders` speist.
- `resource.commands` speist `selector.visibleCommands`, der `search.commands` speist.
- Dashboard Resources bleiben owner-scoped an ihrer Surface.
- Popover Resources können `release: "on-surface-close"` nutzen, damit Query-Daten beim Schließen des Overlays freigegeben werden.

Nutze [Native-First RMT Recipes](./native-first-rmt-recipes.md) für die vollständigen Collection- und Command/Search-Records und [RMT Surface Resource Graph Runtime](./rmt-surface-resource-graph-runtime.md) für Cleanup-Regeln.

## Nächster Schritt

Steuere Renderpriorität mit [Scheduling und Lanes](./learn-rmt-scheduling-lanes.md).

## Öffentlicher Vertrag

Daten und Ressourcen ist der öffentliche Lernpfad-Vertrag für `docs/de/learn-rmt-data-resources.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT-Quelldateien, Parser-Verhalten, Linter-Diagnosen und Playground-Ausgaben.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/learn-rmt-data-resources.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/learn-rmt-data-resources.md`
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
- `node scripts/run_xtend_tests.js rmt-owned-data-display-primitives rmt-owned-command-search-primitives --json`

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
