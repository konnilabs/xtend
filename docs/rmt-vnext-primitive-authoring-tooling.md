# RMT vNext Primitive Authoring Tooling

- Contract: `xtend.rmt.vnext.primitive-authoring-tooling.v1`
- Workpackage: `RMT-VNEXT-PRIM-07`
- Status: `completed`
- Quelle: Media-Manager-Downstream-Transfer, `2026-05-19`

## Ziel

`RMT-VNEXT-PRIM-07` macht die neue Primitive-Syntax in der Developer
Experience sichtbar. App-Autoren sollen State, Selectors, Actions, Events,
Surfaces, Portals, Overlays und Resources nicht in Legacy-JSON suchen muessen:
Completions, Hover, Document Symbols und Snippets fuehren direkt durch RMT
vNext.

## Tooling Surface

Die erste PRIM-07-Scheibe erweitert `tools/rmt-language/vnext-tooling.js`.
Das Modul indexiert nun auch Primitive-Domains aus PRIM-04:

- `states`
- `selectors`
- `actions`
- `effects`
- `portals`
- `overlays`
- `resources`

Bestehende Domains wie `surfaces`, `events` und `dataSources` bleiben erhalten
und werden fuer Primitive-Records angereichert.

## Completions

Neue Completion-Kontexte:

| Context | Zweck |
| --- | --- |
| `vnext-primitive-keywords` | top-level Primitive-Keywords wie `state`, `selector`, `action`, `surface`, `resource` |
| `vnext-primitive-state-clauses` | `type`, `preserve`, `initial` |
| `vnext-primitive-selector-clauses` | `from state`, `where`, `find`, `sort by`, `output` |
| `vnext-primitive-action-clauses` | `input`, `reduce`, `effect fetch datasource`, `on success`, `on error`, `emit` |
| `vnext-primitive-surface-clauses` | `source selector`, `repeat from selector`, `key`, `portal`, `bounds`, `lane visible`, Event- und Lifecycle-Klauseln |
| `vnext-primitive-resource-kinds` | `object-url`, `stream`, `observer`, `timer`, `lazy-import` |
| `vnext-primitive-overlay-kinds` | `tooltip`, `toast`, `popover`, `lightbox`, `menu`, `dialog` |

Wenn ein Pointer in einer Primitive-Domain liegt, waehlt das Tooling den
passenden Kontext automatisch.

### Cursor-nahe Completion

Die zweite PRIM-07-Scheibe macht Completion ohne expliziten
`xtend.context` nutzbar. `getRmtVNextToolingCompletions(...)` akzeptiert nun
eine LSP-Position, loest daraus wenn moeglich den Source-Map-Pointer auf und
wertet die aktuelle Zeile sowie das Teilwort vor dem Cursor aus.

Abgedeckte Authoring-Faelle:

- `state ... {` liefert direkt State-Klauseln wie `initial`.
- `resource ... kind ` liefert Resource-Kinds wie `lazy-import`.
- Teilwoerter in Action-Bloecken, z. B. `red`, priorisieren Action-Klauseln
  wie `reduce`.

Der Language Server reicht `textDocument/completion.position` an das vNext-
Tooling weiter. Damit bekommen Editoren Primitive-Completions auch dann, wenn
sie keine XTend-spezifischen Zusatzparameter setzen.

## Hover

Hover nutzt die PRIM-04-Core-Records und Source Maps. Beispiele:

- `State: media.records`
- `Action: media.select`
- `Resource: lightbox.import`

Die Hover-Ausgabe enthaelt weiterhin Core Pointer, damit Editor, Compiler und
Runtime-Evidence dieselbe Primitive-ID nachvollziehen koennen.

## Document Symbols

Document Symbols enthalten nun Primitive-Namespaces:

```text
states
selectors
actions
portals
overlays
resources
surfaces
events
```

Damit kann ein Editor eine granulare App Shell aus der Outline heraus
navigieren, ohne Legacy-Records zu oeffnen.

## Code Actions

Die dritte PRIM-07-Scheibe liefert sichere Quick-Fixes fuer Primitive-
Diagnosen aus `getRmtVNextToolingCodeActions(...)` und ueber
`textDocument/codeAction` im Language Server.

Unterstuetzte erste Reparaturen:

- `rmt.vnext.primitive.owner-missing`: ergaenzt `owner surface.<id>` an einer
  Resource-Deklaration, wenn eine Surface im Dokument vorhanden ist.
- `rmt.vnext.primitive.unkeyed-repeat`: ergaenzt `key instance.id` nach einer
  `repeat from selector`-Klausel.
- `rmt.vnext.primitive.payload-contract-missing`: ergaenzt einen
  Payload-Contract fuer Event-Bindings oder `emit`-Statements.

Die naechste Scheibe erweitert diese Reparaturen um die haeufigsten
Authoring-Luecken:

- `rmt.vnext.primitive.initial-missing`: ergaenzt einen sicheren initial-Wert
  oder einen kleinen `initial {}`-Block.
- `rmt.vnext.primitive.resource-kind-missing`: ergaenzt `kind object-url` als
  konservativen Resource-Default.
- `rmt.vnext.primitive.unknown-reference` fuer Selector-Referenzen: erzeugt
  einen source-erhaltenden Selector-Stub aus dem ersten vorhandenen State.
- `rmt.vnext.primitive.unknown-reference` fuer Portal-Referenzen: erzeugt einen
  Portal-Stub mit stabilem `root` und `layer surface`.

Die Action-Authoring-Scheibe ergaenzt ausserdem:

- `rmt.vnext.primitive.action-reducer-missing`: ergaenzt ein
  `reduce state.<id> = input.<name>`-Ziel vor dem Action-Ende.
- `rmt.vnext.primitive.effect-source-missing`: ergaenzt
  `datasource <id>` an einem `effect fetch`.
- `rmt.vnext.primitive.kernel-boundary`: erzeugt bewusst keinen Textedit,
  sondern ein Command-Action-Handoff, damit Kernel-/Fabric-Imports in einen
  Host-Adapter ausgelagert werden.

Die Actions sind absichtlich source-erhaltende Textedits. Sie reparieren die
naheliegende Authoring-Luecke und lassen weitergehende semantische Probleme
sichtbar, statt ganze Primitive-Bloecke synthetisch umzuschreiben.

### Code-Action-Previews und Fix-All

Die naechste PRIM-07-Scheibe macht die Quick-Fixes editorfreundlicher:

- Jede Code Action traegt eine `xtend.rmt.vnext.primitive-code-action-preview.v1`
  Preview mit betroffenen URIs, Edit-Anzahl, erstem veraenderten Source-Line-
  Ausschnitt und Vorher-/Nachher-Zeilen.
- Sichere Textedit-Actions werden zusaetzlich in
  `source.fixAll.rmt.vnext.primitives` zusammengefasst.
- Das Fix-All bleibt auf Actions mit `safe: true` und `edit` begrenzt.
  Manuelle Command-Handoffs wie `kernel-boundary` werden nicht automatisch
  angewendet.
- Der Language Server gibt die Preview im `CodeAction.data.preview`-Feld
  weiter, damit Editoren eine Reparatur anzeigen koennen, bevor sie den
  WorkspaceEdit anwenden.

### Command-Handoff

Manuelle Boundary-Faelle bekommen jetzt ebenfalls eine stabile Editor-
Erfahrung:

- Der Language Server meldet `executeCommandProvider.commands` mit
  `xtend.rmt.vnext.extractKernelImport`.
- `workspace/executeCommand` erzeugt fuer diesen Command ein
  `xtend.rmt.vnext.primitive-command-handoff.v1` Ergebnis.
- Das Ergebnis bleibt `safe: false`, `edit: null` und `status:
  "manual_handoff"`, weil Kernel-/Fabric-Imports nicht automatisch in RMT
  vNext-Source geschrieben werden duerfen.
- Der Handoff benennt die Boundary
  `no-kernel-fabric-imports-in-vnext-source` und fuehrt den Zielort
  `xtend-rmt-host-adapter`, damit Editoren einen klaren manuellen Apply-Pfad
  anzeigen koennen.

### VS Code Bridge Apply Experience

Die VS-Code-Bridge bietet nun eine erste sichtbare Authoring-Erfahrung fuer
die drei Apply-Pfade:

- `XTendRMT: Show vNext Primitive Apply Experience` rendert einen
  `xtend.rmt.editor.vscode-primitive-authoring-experience.v1` Report im
  Output Channel.
- `XTendRMT: Show vNext Primitive Code Action Preview` zeigt den Preview-
  Ausschnitt einer einzelnen Code Action.
- `XTendRMT: Show vNext Primitive Command Handoff` zeigt manuelle Boundary-
  Handoffs ohne WorkspaceEdit.

Die Bridge bleibt bewusst duenn: sie klassifiziert bereits vom Language Server
gelieferte Actions in `workspace-edit`, `fix-all` und `manual-command` und
macht diese Pfade sichtbar. Der LSP bleibt die Source of Truth fuer Diagnose,
Preview und Command-Handoff.

### Aktive VS-Code-Dokument-Integration

Die abschliessende PRIM-07-Scheibe verbindet die Bridge mit dem aktiven
`.rmt`-Dokument:

- `createActiveDocumentPrimitiveAuthoringExperience(...)` liest das aktive
  Dokument, startet den lokalen RMT Language Server in-process und ruft
  `textDocument/codeAction` gegen echte LSP-Diagnosen ab.
- `XTendRMT: Show vNext Primitive Apply Experience` kann ohne uebergebenen
  Report direkt aus dem aktiven Dokument eine QuickPick-Auswahl fuer Preview,
  Fix-All und manuelle Handoffs aufbauen.
- `applyPrimitiveAuthoringWorkspaceEdit(...)` wendet nur sichere
  WorkspaceEdits an. `kernel-boundary`-Actions bleiben blockiert, weil sie
  `edit: null` tragen und in einen Host-Adapter ueberfuehrt werden muessen.
- `XTendRMT: Apply Safe vNext Primitive Fix-All` wendet ausschliesslich
  `source.fixAll.rmt.vnext.primitives` an. Wenn kein sicherer Fix-All
  verfuegbar ist, rendert die Bridge den aktuellen Apply-Report statt blind
  einzelne Edits auszufuehren.

Damit ist PRIM-07 nicht mehr nur ein LSP-/Dokumentationspaket: Die
Editor-Bruecke kann vNext-Primitive-Reparaturen aus echtem Source-Kontext
auswaehlen, previewen und sicher anwenden, waehrend Boundary-Handoffs sichtbar
und manuell bleiben.

## Snippet

Neues Snippet:

```text
RMT vNext Primitive Shell
```

Prefix:

```text
rmt-vnext-primitive-shell
```

Das Snippet erzeugt eine kleine App Shell mit State, Selector, Action, Portal,
Surface, sichtbarer Lane und Event-Payload-Contract.

## Lokale Gates

```bash
node --check tools/rmt-language/vnext-tooling.js
node --check tests/rmt-language/rmt_vnext_tooling_suite.js
node -e "const suite=require('./tests/rmt-language/rmt_vnext_tooling_suite'); const result=suite.runRmtVNextToolingSuite({rootDir:process.cwd()}); process.exit(result.ok ? 0 : 1);"
```

Der globale Runner fuehrt `rmt-vnext-tooling` und `rmt-editor-packaging` als
Release-Gates aus. Die VS-Code-Bridge wird ueber
`node scripts/run_xtend_tests.js rmt-editor-packaging --json` gegen aktive
Dokument-CodeActions, Safe-Fix-All und blockierte Kernel-Boundary-Handoffs
geprueft.

## Naechster Handoff

`RMT-VNEXT-PRIM-07` ist abgeschlossen. Weitere Editor-Arbeit kann auf dieser
Bridge aufsetzen, etwa echte LanguageClient-Verpackung oder UI-spezifische
Preview-Panels; der vNext-Primitive-Authoring-Pfad selbst ist release-gated.
