# WP-E14-10 - Code Actions und Quick Fixes fuer sichere Reparaturen bauen

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.code-action-provider.v1`
- Report Schema: `xtend.rmt.code-action-report.v1`
- Action Schema: `xtend.rmt.code-action.v1`
- Edit Schema: `xtend.rmt.workspace-edit.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-code-actions --json`
- Package Script: `npm run test:rmt-code-actions`
- Zielzustand: `rmt-code-actions-ready`

## Ziel

`WP-E14-10` macht haeufige RMT-Autorierungsfehler reparierbar, ohne dass der LSP Server oder die CLI eigene Fix-Logik erfinden muessen.

Die Code Actions entstehen direkt aus den bestehenden Linter-Diagnosen und Repair-Hints. Textuelle Reparaturen werden als minimale Workspace-Edits erzeugt. Operationen ausserhalb des Dokuments, zum Beispiel Dateiumbenennung von `.rmt.json` nach `.rmt`, bleiben explizite Commands.

## Umgesetzt

- `tools/rmt-language/code-actions.js` angelegt
- `createRmtCodeActionProvider(...)` und `getRmtCodeActions(...)` bereitgestellt
- Quick Fixes umgesetzt fuer:
  - fehlende Schedule-Referenzen
  - fehlende Template-Referenzen
  - `.rmt.json` / `.json` Fallback-Dateien
  - unbekannte Fabric/RMT Lanes
  - unbekannte Hydration Policies
  - fehlende Route `documentTitle`
  - fehlende Schedule `endpointName`
- deterministische Deduplizierung von identischen Fixes umgesetzt
- LSP-Diagnostic-Filterung umgesetzt
- `textDocument/codeAction` im RMT Language Server aktiviert
- `codeActionProvider` in den LSP Capabilities auf `quickfix` gesetzt
- `tests/rmt-language/rmt_code_actions_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-code-actions` erweitert

## Architekturentscheidung

Der Code-Action-Provider liegt in `tools/rmt-language`.

Der Language Server mappt nur:

- LSP Diagnostics -> Code-Action-Filter
- RMT Code Actions -> LSP CodeAction Shape
- RMT Workspace Edits -> LSP WorkspaceEdit Shape

Der Server enthaelt keine eigene Reparaturlogik. Dadurch koennen CLI, AI-Agenten und LSP denselben Quick-Fix-Kern verwenden.

## Safe-Edit-Policy

| Reparaturtyp | Umsetzung |
|--------------|-----------|
| fehlende Schedule | Einfuegen eines Schedule-Stubs in `schedules` |
| fehlendes Template | Einfuegen eines DOM-Descriptor-Template-Stubs in `templates` |
| unbekannte Lane | Ersetzen des betroffenen String-Werts durch `visible` |
| unbekannte Hydration Policy | Ersetzen des betroffenen String-Werts durch `runtime_render` |
| fehlender Route-Titel | Anhaengen von `documentTitle` an den Route Record |
| fehlender Schedule Endpoint | Anhaengen von `endpointName` an den Schedule Record |
| `.rmt.json` Fallback | Command `xtend.rmt.renameFileExtension`, kein Textedit |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Quick Fixes sind deterministisch | erfuellt |
| Workspace-Edits sind minimal und dokumentlokal | erfuellt |
| Dateiumbenennung ist ein expliziter Command | erfuellt |
| LSP `textDocument/codeAction` ist aktiviert | erfuellt |
| Code Actions koennen nach LSP-Diagnostics gefiltert werden | erfuellt |
| keine Runtime-/Netzwerkpflicht | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-code-actions --json
npm run test:rmt-code-actions -- --json
```

## Handoff

`WP-E14-10` ist abgeschlossen. `WP-E14-11` kann nun den AI-Agent-Report und Repair-Hint Contract stabilisieren.

Die naechste Schicht soll Code Actions nicht neu modellieren, sondern die vorhandenen Actions mit Confidence, Impact, Related Diagnostics und No-Op-Erklaerungen agentenfreundlich serialisieren.
