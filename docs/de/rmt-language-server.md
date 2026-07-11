# RMT Language Server

Editor-Integration für Completion, Hover, Definition und Code Actions.

## Worum es geht

Der RMT Language Server liefert Diagnostics, Navigation, Completion und Code Actions aus demselben Source-Modell wie CLI und Compiler. Editor-Hinweise sind dadurch keine separate Grammatik, sondern eine frühe Sicht auf dieselben Fehler.

## Öffentliche Bausteine

- `tools/rmt-language-server/server.js` verarbeitet Dokumente und Requests.
- `tools/rmt-language-server/protocol.js` definiert die öffentlichen Nachrichtenformen.
- `tools/rmt-language/diagnostics.js` liefert normalisierte RMT Diagnostics.

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

Öffne eine `.rmt` Datei über die Editor-Integration, behebe Parserfehler vor semantischen Diagnostics und bestätige kritische Änderungen zusätzlich mit dem CLI-Gate. Ein Editor-Neustart darf keine andere Diagnosemenge erzeugen.

## Nächste Schritte

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Linter](./rmt-linter.md)
