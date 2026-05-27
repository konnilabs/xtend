# Templates und Surfaces

Templates definieren die Anwendungsgrenze. Surfaces beschreiben renderbare Bereiche innerhalb dieser Grenze. Eine Surface kann auf eine XTend-Komponente zeigen, ein Portal auswählen und Arbeit in Lanes aufteilen.

## Surface-Modell

Nutze `portal`, wenn die Runtime in ein bestimmtes DOM-Ziel mounten soll. Nutze `surface`, um die sichtbare Einheit und ihre Scheduling-Lanes zu beschreiben.

```rmt
template learn.rmt.surfaces {
  portal surface.root root "#app" layer surface

  surface welcome.card kind card component x-status {
    portal surface.root
    bounds x 16 y 16 width 320 height 120

    lane visible weight 90 {
      hydrate welcome-card
    }
  }
}
```

## Warum Das Hilft

App-Grenze, Ziel und Komponentenvertrag bleiben in einer Quelldatei. Die Runtime kann Fokus, Layout, Hydration und Cleanup auswerten, ohne dass jeder Consumer dieselbe Verdrahtung dupliziert.

## Maraca-Auswirkung

Für Maraca ist der `component` Wert einer Surface ein Build-Vertrag. `component x-status` bedeutet nicht nur Renderabsicht, sondern steuert, welche XTend Module in die Inline Registry und den Rollup Graphen gelangen. Wenn ein Produkt später loaderlos ausgeliefert wird, muss jeder Surface-Tag bekannt sein; unbekannte Tags sollten bewusst als Host-Policy behandelt werden. Die Details stehen in [XTend Maraca](./xtend-maraca.md).

## Nächster Schritt

Füge Daten mit [State und Selectors](./learn-rmt-state-selectors.md) hinzu.

## Öffentlicher Vertrag

Templates und Surfaces ist der öffentliche Lernpfad-Vertrag für `docs/de/learn-rmt-templates-surfaces.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT-Quelldateien, Parser-Verhalten, Linter-Diagnosen und Playground-Ausgaben.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/learn-rmt-templates-surfaces.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/learn-rmt-templates-surfaces.md`
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
