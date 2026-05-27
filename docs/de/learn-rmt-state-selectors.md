# State und Selectors

State deklariert Daten, die dem Template gehören. Selectors stellen stabile View-Modelle für Surfaces, Actions und Adapter bereit.

## State Explizit Halten

Nutze `state` für dauerhafte Template-Daten und `selector` für die Form, die eine Komponente konsumieren soll. Dadurch bleiben Renderverträge lesbar und Compiler-Diagnosen hilfreicher.

```rmt
template learn.rmt.stateflow {
  state dashboard.summary type object preserve {
    initial {
      id "summary"
      title "Orders"
      status "ready"
    }
  }

  selector dashboard.summary from state dashboard.summary {
    output DashboardSummary
  }

  surface dashboard.card kind card component x-status {
    source selector dashboard.summary
    key summary.id

    lane visible weight 80 {
      hydrate dashboard-card from selector dashboard.summary
    }
  }
}
```

## Workflow-Tipp

Benenne Selectors nach dem View-Modell, das sie bereitstellen, nicht nach der ersten Komponente, die sie nutzt. So bleibt der Selector wiederverwendbar, wenn sich die UI ändert.

## Maraca-State-Vertrag

Im Maraca-Build werden `state` und `selector` zu Teilen des Orchestrierungsartefakts. Der Bundle-Report zeigt, welche View-Modelle zur Hydration, zu Actions und zu Browser Bridges gehören. Wenn ein Selector später in `window.XTendMaraca.orchestration.snapshot()` sichtbar sein soll, muss er in der RMT Quelle eindeutig benannt bleiben und darf nicht nur implizit aus einer Komponente abgeleitet werden.

## Nächster Schritt

Lerne in [Actions und Events](./learn-rmt-actions-events.md), wie Nutzerabsicht durch das System fließt.

## Öffentlicher Vertrag

State und Selectors ist der öffentliche Lernpfad-Vertrag für `docs/de/learn-rmt-state-selectors.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT-Quelldateien, Parser-Verhalten, Linter-Diagnosen und Playground-Ausgaben.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/learn-rmt-state-selectors.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/learn-rmt-state-selectors.md`
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
