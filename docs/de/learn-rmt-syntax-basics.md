# RMT Syntax-Grundlagen

Diese Seite zeigt die Grundform einer gültigen RMT-vNext-Quelldatei. Vorwissen zu HTML und JavaScript reicht für den Einstieg aus.

## Dokumentform

Ein RMT-Dokument beginnt mit einem `template`. Darin liegen Deklarationen wie `state`, `selector`, `action`, `portal`, `resource` und `surface`. Blöcke verwenden geschweifte Klammern, Strings stehen in Anführungszeichen und verschachtelte Deklarationen beschreiben Besitz und Zuordnung.

```rmt
template learn.rmt.syntax {
  state app.message type object preserve {
    initial {
      id "welcome"
      text "Hello RMT"
      tone "info"
    }
  }

  selector app.message from state app.message {
    output MessageView
  }

  surface root {
    lane visible weight 80 {
      hydrate message-card from selector app.message
    }
  }
}
```

## Beispiel Lesen

Das Template besitzt einen State-Datensatz, stellt ihn über einen Selector bereit und hydriert eine Surface-Lane aus diesem Selector. Das ist der Grundrhythmus von RMT: Daten beschreiben, View-Modell bereitstellen und Renderarbeit planen.

## Nächster Schritt

Weiter geht es mit [Templates und Surfaces](./learn-rmt-templates-surfaces.md).

## Validation und Transitions

Formularlogik muss nicht als Host-JavaScript neben der RMT Datei entstehen. Mit `validation` deklarierst du Field Rules und Action Gates; mit `transition` deklarierst du den visuellen Wechsel zwischen Surface-Gruppen.

```rmt
validation demo.contact {
  mode blocking
  target action demo.nextContact
  field demo.email required email message "Enter a valid email address."
}

transition demo.contactToIssue {
  trigger action demo.nextContact
  from surfaces [demo.email demo.nextContact]
  to surfaces [demo.subject demo.nextIssue]
  effect slide-left
  durationMs 220
  easing "ease-out"
  lane transition
}
```

`required`, `email`, `minLength`, `maxLength`, `pattern`, `message`, `target action`, `from surfaces`, `to surfaces`, `effect` und `durationMs` sind Teil der vNext-Syntax. `lane transition` sorgt dafür, dass der Wechsel über den Kernel Scheduler geplant werden kann.

## Maraca-Relevanz

Maraca liest genau diese Records aus der `.rmt` Quelle und entscheidet im Strict Mode, ob Validation, Transition und Kernel-Schicht vollständig genug sind. Wenn du später `xt maraca build app.rmt --orchestration strict --kernel strict --hydration strict --validation strict --transitions strict --json` ausführst, werden fehlende Targets, unbekannte Komponenten und unvollständige Messages zu Build-Diagnosen statt zu stillen Runtime-Fallbacks. Der nächste produktive Kontext ist [Maraca Orchestrierung](./xtend-maraca-orchestration.md).

## Öffentlicher Vertrag

RMT Syntax-Grundlagen ist der öffentliche Lernpfad-Vertrag für `docs/de/learn-rmt-syntax-basics.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT-Quelldateien, Parser-Verhalten, Linter-Diagnosen und Playground-Ausgaben.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/learn-rmt-syntax-basics.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/learn-rmt-syntax-basics.md`
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
