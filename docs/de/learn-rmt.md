# Learn RMT

Learn RMT ist der geführte Einstieg in RMT-vNext. Die Strecke beginnt mit dem Sprachmodell und führt dann zu State, Actions, Ressourcen, Scheduling und dem integrierten Playground. Für ausgelieferte Anwendungen ist Maraca der anschließende Orchestrierungspfad.

## Was RMT Ist

RMT beschreibt Anwendungsstruktur als kompilierbares Dokument. Statt jede Surface von Hand zu verdrahten, deklarierst du das App-Template, den eigenen State, Selectors für View-Modelle, Actions für Zustandsänderungen und die Surfaces, die XTend rendern oder hydrieren soll.

Der Compiler erzeugt daraus ein stabiles Core-Dokument, das XTend Runtime, SSR-Adapter und Tooling auswerten können.

```rmt
template learn.rmt.hello {
  surface root {
    lane visible weight 80 {
      mount hello-card
    }
  }
}
```

## Lernpfad

Beginne mit den [Syntax-Grundlagen](./learn-rmt-syntax-basics.md), dann folge Templates, State, Actions, Daten, Scheduling und Sicherheit. Nutze den [RMT Playground](./learn-rmt-playground.md), wenn du ein kleines Beispiel direkt im Developer Center kompilieren möchtest.

## Von RMT Zu Maraca

Der Lernpfad erklärt die Sprache; [XTend Maraca](./xtend-maraca.md) erklärt, wie dieselbe Quelle als App-Bundle ausgeliefert wird. Der Wechsel ist besonders wichtig, wenn das Dokument echte Runtime-Arbeit enthält: `validation`-Gruppen, `transition`-Blöcke, Action Gates, Hydration Policies oder kernel-schedulierte Lanes. Dann prüft der Maraca-Build nicht nur Syntax, sondern materialisiert eine browserfähige App-Orchestrierung.

## Nächster Schritt

Öffne die [Syntax-Grundlagen](./learn-rmt-syntax-basics.md) und kompiliere das erste vollständige Dokument.

## Öffentlicher Vertrag

Learn RMT ist der öffentliche Lernpfad-Vertrag für `docs/de/learn-rmt.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT-Quelldateien, Parser-Verhalten, Linter-Diagnosen und Playground-Ausgaben.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/learn-rmt.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/learn-rmt.md`
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
