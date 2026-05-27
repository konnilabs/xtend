# Scheduling und Lanes

Lanes trennen dringende UI-Arbeit von sichtbarer Hydration und Hintergrundaufgaben. XTend Fabric kann diese Lane-Namen und Gewichte in Runtime-Scheduling übersetzen.

## Lane-Priorität

Nutze hohe Gewichte für direkte Interaktionsflächen, mittlere Gewichte für sichtbare Inhalte und niedrige Gewichte für optionale Arbeit.

```rmt
template learn.rmt.scheduling {
  surface dashboard.card kind card component x-status {
    lane critical weight 100 {
      mount dashboard-shell
    }

    lane visible weight 85 {
      hydrate dashboard-summary
    }

    lane idle weight 5 {
      hydrate analytics-panel
    }
  }
}
```

## Design-Regel

Betrachte Lanes als Aussage über Nutzererlebnis. Die Lane sagt, warum Arbeit wichtig ist; die Runtime entscheidet, wie sie auf der aktuellen Plattform ausgeführt wird.

## Maraca Kernel-Pfad

Im loaderlosen Maraca-Pfad werden Lanes zu Scheduler-Einträgen im Bundle. `critical`, `visible`, `idle` und `transition` landen nicht als lose Strings im Host, sondern werden in Kernel- und Fiber-Pläne übersetzt. Nutze [Maraca Orchestrierung](./xtend-maraca-orchestration.md), wenn du prüfen willst, welche Endpoints der Build für Hydration, Actions und Surface Transitions erzeugt.

## Nächster Schritt

Bevor du beliebige Quelle in der Preview ausprobierst, lies [Sicherheit und Preview](./learn-rmt-security-preview.md).

## Öffentlicher Vertrag

Scheduling und Lanes ist der öffentliche Lernpfad-Vertrag für `docs/de/learn-rmt-scheduling-lanes.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT-Quelldateien, Parser-Verhalten, Linter-Diagnosen und Playground-Ausgaben.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/learn-rmt-scheduling-lanes.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/learn-rmt-scheduling-lanes.md`
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
