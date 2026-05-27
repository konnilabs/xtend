# Sicherheit und Preview

RMT ist deklarativ, aber der Playground akzeptiert beliebige Texteingabe. Das Developer Center kompiliert Quelle deshalb, meldet Diagnosen und rendert ausschließlich strukturierte Ausgabe über einen engen Preview-Pfad.

## Sicherheitsregeln Im Playground

Der Playground führt kein von Nutzern geschriebenes JavaScript aus, gibt keine rohen HTML-Fragmente aus dem Compile-Endpunkt zurück und setzt die Preview-Surface zwischen Kompilierungen zurück. Inline-Handler-Strings, HTML-Fragment-Rendering, Remote-Imports und unsichere URL-Protokolle werden blockiert oder diagnostiziert.

```rmt
template learn.rmt.safePreview {
  state preview.message type object preserve {
    initial {
      id "safe"
      text "Rendered from structured RMT output"
    }
  }

  selector preview.message from state preview.message {
    output PreviewMessage
  }

  surface preview.card kind card component x-status {
    source selector preview.message
    key message.id

    lane visible weight 80 {
      hydrate preview-card from selector preview.message
    }
  }
}
```

## Verwandte Referenz

Für produktives Rendering lies [Trusted DOM Sanitizing](./trusted-dom-sanitizing.md) und den [DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md).

## Maraca Strict Mode

Der Playground ist absichtlich interaktiv; Maraca ist absichtlich streng. Für auslieferbare Apps sollte der gleiche Quelltyp mit `--orchestration strict`, `--validation strict` und `--transitions strict` gebaut werden, damit unsichere HTML-Sinks, fehlende Targets und unvollständige Validation Messages im Build auffallen. Die Maraca-Seiten erklären, welche Browser Bridges dabei öffentlich bleiben und welche Interna nicht Teil des Vertrags sind.

## Nächster Schritt

Öffne den [RMT Playground](./learn-rmt-playground.md).

## Öffentlicher Vertrag

Sicherheit und Preview ist der öffentliche Lernpfad-Vertrag für `docs/de/learn-rmt-security-preview.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT-Quelldateien, Parser-Verhalten, Linter-Diagnosen und Playground-Ausgaben.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/learn-rmt-security-preview.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/de/learn-rmt-security-preview.md`
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
