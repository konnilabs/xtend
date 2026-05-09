# WP-E14-08 - Hover, Document Symbols und Definition Provider implementieren

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.navigation-provider.v1`
- Hover Contract: `xtend.rmt.hover-provider.v1`
- Document Symbols Contract: `xtend.rmt.document-symbols-provider.v1`
- Definition Contract: `xtend.rmt.definition-provider.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-navigation --json`
- Package Script: `npm run test:rmt-navigation`
- Zielzustand: `rmt-navigation-ready`

## Ziel

`WP-E14-08` macht RMT-Dokumente navigierbar und erklaerbar.

Die Provider arbeiten direkt auf dem Semantic Graph aus `WP-E14-04` und den Completion-Katalogen aus `WP-E14-07`. Dadurch entstehen keine separaten Interpretationen fuer Hover, Symbols oder Definitionen.

## Umgesetzt

- `tools/rmt-language/hover.js` angelegt
- `tools/rmt-language/symbols.js` angelegt
- `tools/rmt-language/definitions.js` angelegt
- Hover fuer folgende Kontexte umgesetzt:
  - Top-Level-Domains
  - Domainfelder
  - Adapter-Referenzen
  - XTend Component Tags
  - Schedule Lanes
  - Hydration Policies
  - Template Modes
  - lokale Graph-Referenzen
- Document Symbols fuer `adapters`, `components`, `routes`, `schedules` und `templates` umgesetzt
- Go-to-Definition fuer lokale Referenzen umgesetzt:
  - Route -> Component
  - Route -> Template
  - Route -> Schedule
  - Component -> Adapter
  - Component/Template Slots -> Component/Template
  - Template Metadata -> Schedule
  - Hydration Endpoint Hint -> Schedule Endpoint
- Direct Lookup ueber `domain` und `id` ergaenzt
- syntax-defekte Quellen liefern kontrolliert `source_unavailable`
- `tests/rmt-language/rmt_navigation_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-navigation` erweitert

## Architekturentscheidung

Die Navigationsprovider sind reine Sprachebene.

Sie duerfen:

- Source Model Ranges nutzen
- Semantic Graph Indizes und Referenzen nutzen
- lokale Manifest- und Completion-Kataloge lesen

Sie duerfen nicht:

- XTend-Komponenten ausfuehren
- XRouter starten
- DOM materialisieren
- externe Netzwerkquellen laden

Der spaetere LSP-Server soll diese Provider nur adaptieren. Position-zu-Pointer-Mapping und LSP-spezifische Response-Formate bleiben Transportlogik, nicht Fachlogik.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Hover fuer Adapter, Tags, Lanes, Hydration und Template Modes ist vorhanden | erfuellt |
| Hover fuer lokale Referenzen zeigt Zielinformationen | erfuellt |
| Document Symbols bilden Domains und ID-Kinder ab | erfuellt |
| Go-to-Definition fuer Routen, Komponenten, Templates und Schedules ist vorhanden | erfuellt |
| Definition Targets enthalten Pointer und Range | erfuellt |
| Provider nutzen Semantic Graph statt eigener Semantik | erfuellt |
| keine Runtime-/Netzwerkpflicht | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-navigation --json
npm run test:rmt-navigation -- --json
```

## Handoff

`WP-E14-08` ist abgeschlossen. `WP-E14-09` kann nun den LSP Server MVP ueber stdio bereitstellen.

Der LSP Server soll Diagnostics, Completion, Hover, Document Symbols und Definitionen auf diese bestehenden Provider mappen und keine eigene RMT-Semantik implementieren.
