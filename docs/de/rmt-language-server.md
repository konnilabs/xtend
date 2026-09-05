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

## Gemeinsamer Projektindex

Workspace-Symbole (`workspace/symbol`), Definitionen, Importnavigation und
`textDocument/references` verwenden einen gemeinsamen Index im Arbeitsspeicher.
Er erfasst auch geschlossene RMT-Dateien in allen Workspace-Roots. Offene Buffer
haben Vorrang; beim Schließen wird die Datei neu gelesen. Clients melden externe
Änderungen über `workspace/didChangeWatchedFiles` und geänderte Roots über
`workspace/didChangeWorkspaceFolders`. Ältere Dokumentversionen werden verworfen.
Positionen verwenden die UTF-16-Konvention des vorhandenen Source Models.

Symbolidentitäten enthalten Projekt, relativen Dateipfad, Domäne und deklarierten
Scope. Eingefügte Zeilen verändern diese Identität nicht. Ein Dateiumzug erzeugt
eine neue Identität; Auswirkungsberichte berücksichtigen deshalb beide Snapshots.

```js
const { createProjectIndex, computeImpact } = require('@ccslabs/xtend-compiler/project-index');
const index = createProjectIndex({ rootDir: '/absolute/project', profile: 'rmt' });
index.build();
const treffer = index.searchSymbols('orders');
const referenzen = treffer.length ? index.references({ symbolId: treffer[0].id }) : [];
const snapshot = index.snapshot();
index.dispose();
```

Dieselbe API steht unter `@ccslabs/xtend/project-index` bereit. `updateDocument`
übernimmt URI, Text und eine aufsteigende Version. `closeDocument`,
`refreshDocument` und `removeDocument` verarbeiten weitere Änderungen. Die
Snapshots enthalten typisierte Dokumente, Symbole, Referenzen, Beziehungen und
Erfassungslücken mit nachvollziehbarer Herkunft.

```bash
xt index build --root /absolute/project --profile rmt --json
xt index symbols orders --root /absolute/project --json
xt index references --symbol '<symbol-id-from-symbols>' --root /absolute/project --json
xt index build --root /absolute/repository --profile repository --out /tmp/base-index.json --json
xt index impact --root /absolute/repository --base /tmp/base-index.json --changed tests/fixtures/input.json --json
```

Das Profil `repository` ergänzt statische JS-/TS-Imports, Paketexports, kuratierte
Schema-Verträge und Suite-Registrierungen aus `scripts/run_xtend_tests.js`.
TypeScript ist für RMT-Navigation optional; für die Modulanalyse muss es im
Projekt verfügbar sein. Das Editorprofil lädt weder TypeScript noch das
Schema-Gesamtinventar oder Tests. Beide Profile führen keine Projektmodule aus
und lösen keine Abhängigkeiten über das Netzwerk auf. Der Repository-Bericht
unterscheidet Browser-, Node- und Typziele sowie fehlende und berechnete Ziele.

RMT-Kompilierung bleibt dateilokal. Importpfade führen innerhalb der bestehenden
Resolver-Grenzen zu Dateien. Passende Deklarationen aus importierten Dateien
erscheinen gegebenenfalls als Kandidaten im Indexbericht. Sie werden dadurch
keine bestätigten Definitionen oder Referenzen und entfernen keine
Compilerdiagnosen. Fehlerhafte Zwischenstände liefern die vom Parser erhaltenen
Deklarationen mit ausdrücklich unvollständigem Analysestatus.

Auswirkungsberichte nennen Begründungspfade aus Basis- und aktuellem Snapshot,
unbekannte Zuordnungen und mögliche doppelte Suite-Implementierungen. Sie wählen
keine Gates aus und überspringen oder vereinen keine Prüfungen. Auch ein Bericht
ohne gefundene Suite bedeutet nicht, dass keine Tests erforderlich sind. Rename,
Formatter, Semantic Tokens und vollständige JS-/TS-Symbolanalyse bleiben
eigenständige Folgearbeiten.

`--cache` aktiviert ausdrücklich `.project-index-cache/snapshot.json`. Der Cache
wird beim Scan ignoriert und bei geänderten Quellen, Konfigurationen, Inventaren
oder Analyserversionen verworfen. Er lässt sich jederzeit löschen und aufbauen;
auslieferbare Pakete enthalten keinen Repository-Snapshot. Messungen und
Prüfungen sind über `npm run test:project-index` erreichbar. Gemessene Laufzeiten
sind zunächst Beobachtungen und keine neuen Zeitlimits für Gates.

## Verwandte Anleitungen

- [XTendRMT Überblick](./xtendrmt-overview.md)
- [RMT Authoring Guide](./rmt-vnext-authoring.md)
- [RMT Reference](./rmt-reference.md)
- [RMT Linter](./rmt-linter.md)
