# WP-E14-07 - Completion Provider fuer RMT-Domains, Adapter, Tags, Routes und Schedules bauen

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.completion-provider.v1`
- Report Schema: `xtend.rmt.completion-report.v1`
- Item Schema: `xtend.rmt.completion-item.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-completions --json`
- Package Script: `npm run test:rmt-completions`
- Zielzustand: `rmt-completions-ready`

## Ziel

`WP-E14-07` macht RMT-Dokumente fuer IDEs, AI-Agenten und spaetere LSP-Clients vervollstaendigbar.

Der Provider arbeitet direkt in `tools/rmt-language` und nutzt:

- Semantic Graph aus `WP-E14-04`
- lokale `components/manifest.json`
- statische RMT-Domainkataloge
- Schedule-Lane-, Hydration- und Template-Mode-Kataloge

Er fuehrt keine Runtime aus und benoetigt kein Netzwerk.

## Umgesetzt

- `tools/rmt-language/completions.js` angelegt
- `createRmtCompletionProvider(...)` und `getRmtCompletions(...)` bereitgestellt
- Completion-Kontext-Inferenz ueber `pointer`, `domain`, `field` und expliziten `context` umgesetzt
- Completion-Kontexte umgesetzt:
  - `top-level`
  - `manifest-fields`
  - `adapter-fields`
  - `component-fields`
  - `route-fields`
  - `route-metadata-fields`
  - `schedule-fields`
  - `template-fields`
  - `adapter-ids`
  - `component-tags`
  - `component-ids`
  - `template-ids`
  - `schedule-ids`
  - `route-ids`
  - `route-paths`
  - `schedule-endpoints`
  - `schedule-lanes`
  - `hydration-policies`
  - `template-modes`
- Prefix-Filterung umgesetzt
- deterministische Sortierung umgesetzt
- statische Top-Level-Completions auch bei syntax-defekter Quelle verfuegbar gemacht
- `tests/rmt-language/rmt_completion_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-completions` erweitert

## Architekturentscheidung

Der Completion Provider ist kein CLI-Reporter und keine Linter-Schicht.

Das Modul gibt einen maschinenlesbaren Completion Report aus, haelt aber seine fachliche Quelle im Semantic Graph:

- Referenzen kommen aus `graph.listCompletions(...)`
- Tags kommen aus `components/manifest.json` plus `graph.catalogHints.componentTags`
- Route Paths, Schedule Endpoints und Lanes kommen aus Graph Catalog-Hints
- Template Modes und Hydration Policies kommen aus lokalen RMT-Katalogen

Damit bleibt die spaetere LSP-Integration duenn und muss keine eigene Completion-Analyse implementieren.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Top-Level-Domain Completion ist vorhanden | erfuellt |
| Domainfeld Completion ist vorhanden | erfuellt |
| Adapter ID Completion ist vorhanden | erfuellt |
| Component Tag Completion aus lokalem Manifest ist vorhanden | erfuellt |
| Component/Template/Schedule/Route Referenz Completion nutzt Semantic Graph | erfuellt |
| Route Path und Schedule Endpoint Completion ist vorhanden | erfuellt |
| Lane, Hydration Policy und Template Mode Completion ist vorhanden | erfuellt |
| Prefix-Filterung ist vorhanden | erfuellt |
| Ausgabe ist deterministisch | erfuellt |
| keine Runtime-/Netzwerkpflicht | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-completions --json
npm run test:rmt-completions -- --json
```

## Handoff

`WP-E14-07` ist abgeschlossen. `WP-E14-08` kann nun Hover, Document Symbols und Definition Provider aufbauen.

Die naechste Schicht soll Completion nicht duplizieren, sondern fuer Hover und Definition weiter Semantic Graph, Source Model und die neuen Completion-Catalogs nutzen.
