# RMT Language Server

Editor-Integration für Completion, Hover, Definition und Code Actions.

## Worum es geht

RMT Language Server beschreibt die öffentliche RMT-Oberfläche dieser Seite: welche Records betroffen sind, welche Adapter sie ausüben und welche Scheduler-Signale ein Host prüfen sollte.

## Öffentliche Bausteine

- `node tools/rmt-language-server/server.js`.
- Completion, Hover, Definition und Code Actions.
- Snippets für App-, Component- und Route-Strukturen.
## Editor Setup

```bash
node tools/rmt-language-server/server.js
```

Der Server unterstützt VS Code, JetBrains, Neovim und Helix über stdio. Snippets wie `rmt-app`, `rmt-component`, `rmt-route` und `rmt-template-dom` beschleunigen neue Dateien. Die relevanten Schemas sind `xtend.rmt.language-server.v1`, `xtend.rmt.editor-packaging.v1` und `xtend.rmt.snippet-catalog.v1`.

VS Code bringt außerdem die Befehle `XTendRMT: Show vNext Primitive Apply Experience` und `XTendRMT: Run Active RMT Lint` mit. Für Problem-Matcher-Flows nutzt das Tooling `xt rmt lint app.rmt --format problem-matcher --fail-on warning`; Debug-Konfigurationen liegen als Vorlage unter `tools/rmt-editor/vscode/templates/launch.json`.

## Orchestrierungs-DX

Der Language Server ergänzt Completion, Hover und Document Symbols für `validation`, `animation` und `transition`. Das gilt für native `.rmt` Dateien und für JSON/Core-nahe Dokumente mit `validations`, `animations` und `transitions`. Effekte wie `fade`, `crossfade`, `slide-left`, `slide-right`, `slide-up`, `slide-down`, `scale`, `pop`, `zoom`, `flip`, `fade-blur`, `shared-element`, `layout-flip` und `none` sowie Validation-Regeln wie `required`, `email`, `minLength`, `maxLength` und `pattern` werden im Editor erklärt.

Die vollständigen Keyword- und Operator-Kontexte stehen in der [RMT Reference](./rmt-reference.md).

Neue Snippets:

- `rmt-vnext-validation`
- `rmt-vnext-animation`
- `rmt-vnext-transition`
- `rmt-vnext-maraca-orchestration-app`

```bash
node scripts/run_xtend_tests.js rmt-completions rmt-navigation rmt-vnext-tooling rmt-editor-packaging --json
```

## Empfohlener Ablauf

Beginne bei RMT Language Server mit dem kleinsten Record-Beispiel, prüfe es mit dem Linter und binde erst danach Adapter für Host-Daten, Routing oder Komponenten an.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Linter](./rmt-linter.md)

## Öffentlicher Vertrag

RMT Language Server ist der öffentliche RMT Runtime-Vertrag für `docs/de/rmt-language-server.md`. Stabil ist nicht die Textlänge, sondern ob ein externer Host die genannten Dateien, Namen und Prüfungen ohne internes Projektwissen nachvollziehen kann.

- Rolle: erklärt, welche Entscheidung ein Integrator auf dieser Seite treffen kann.
- Stabile Oberfläche: RMT Records, Compiler-Ausgaben, Runtime-Adapter, Events, Actions und Scheduler-Lanes.
- Nicht versprochen: Private Runtime-Interna, generierte DOM-Strukturen und interne Planungsbegriffe bleiben außerhalb des öffentlichen Vertrags.

## Schnittstellen und Anker

Diese Anker sind konkret genug, damit ein Drittentwickler Verhalten lokal nachprüfen kann:

Quellen:
- `docs/de/rmt-language-server.md`
- `docs/menu.json`
- `package.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`

Namen:
- `tools/rmt-editor/vscode/templates/launch.json`
- `docs/de/rmt-language-server.md`
- `docs/menu.json`
- `docs/xtendrmt-docs-shell-vnext.rmt`
- `tools/rmt-language/parser.js`
- `tools/rmt-language/vnext-compiler.js`
- `tools/rmt-language/vnext-scheduler.js`
- `tools/rmt-language/vnext-surfaces.js`
- `docs/dev-router.php`
- `package.json`

Befehle:
- `node tools/rmt-language-server/server.js`
- `node scripts/run_xtend_tests.js rmt-completions rmt-navigation rmt-vnext-tooling rmt-editor-packaging --json`
- `node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-reference-docs --json`
- `node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json`

## Minimaler Prüfpfad

Führe diese Prüfung aus, wenn der Artikel, ein Beispiel oder die genannte öffentliche Oberfläche geändert wird:

```bash
node tools/rmt-language-server/server.js
node scripts/run_xtend_tests.js rmt-completions rmt-navigation rmt-vnext-tooling rmt-editor-packaging --json
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-reference-docs --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server --json
```

- Erwartetes Signal: Der Befehl muss ohne Linkfehler, ohne bekannte Boilerplate und mit konkreten Ankern im Artikel abschließen.
- Quellen: Wenn Source und Artikel voneinander abweichen, ist die Source maßgeblich; aktualisiere danach beide Locales mit identischen Codeblöcken.

## Spezifische Fehlerbilder

- Wenn Runtime-Verhalten anders wirkt, trenne Compiler-Record, Host-Adapter und Scheduler-Signal, bevor du die Doku änderst.
- Wenn ein Link aus diesem Artikel bricht, repariere den lokalen Markdown-Zielpfad und prüfe danach `node scripts/verify_docs_public_quality.js`.
- Wenn ein Beispiel kopiert wird, müssen Dateipfade, Record-Namen und Commands aus diesem Abschnitt unverändert startfähig bleiben.
