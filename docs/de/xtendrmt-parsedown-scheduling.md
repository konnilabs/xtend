# Parsedown RMT Scheduling

Wie die Docs-App Markdown sicher rendert und die Shell über RMT koordiniert.

## Worum es geht

Parsedown RMT Scheduling beschreibt die öffentliche RMT-Oberfläche dieser Seite: welche Records betroffen sind, welche Adapter sie ausüben und welche Scheduler-Signale ein Host prüfen sollte.

## Öffentliche Bausteine

- `docs/xtendrmt-parsedown-docs.rmt`.
- `xtend.docs.parsedown-rmt-pilot.v1`.
- `docs.app.shell` und Shell-first Rendering.
- `node scripts/run_xtend_tests.js docs-rmt-pilot --json`.

## Empfohlener Ablauf

Beginne bei Parsedown RMT Scheduling mit dem kleinsten Record-Beispiel, prüfe es mit dem Linter und binde erst danach Adapter für Host-Daten, Routing oder Komponenten an.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Linter](./rmt-linter.md)
- [RMT Language Server](./rmt-language-server.md)

## Öffentlicher Vertrag

Parsedown RMT Scheduling ist der öffentliche Runtime-Adapter-Vertrag für `docs/de/xtendrmt-parsedown-scheduling.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: SSR-Adapter, Prehydration, Browser-Bridges und die Grenze zwischen Server- und Client-Arbeit.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/xtendrmt-parsedown-scheduling.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `docs/xtendrmt-parsedown-docs.rmt`
- `docs/de/xtendrmt-parsedown-scheduling.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`

Befehle:
- `node scripts/verify_docs_public_quality.js`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json`
- `node scripts/run_xtend_tests.js rmt-playground-docs rmt-php-ssr-adapter docs-php-ssr-prehydration --json`
- `node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node scripts/verify_docs_public_quality.js
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality references --json
node scripts/run_xtend_tests.js rmt-playground-docs rmt-php-ssr-adapter docs-php-ssr-prehydration --json
node scripts/run_xtend_tests.js docs-content-depth docs-public-quality --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn SSR oder Prehydration abweicht, vergleiche Server-Output, Browser-Bridge und den lokalen Adapter-Test.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
