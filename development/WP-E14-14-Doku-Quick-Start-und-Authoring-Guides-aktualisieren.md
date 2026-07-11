# WP-E14-14 - Doku, Quick Start und Authoring-Guides aktualisieren

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.tooling-docs.v1`
- Report Schema: `xtend.rmt.tooling-docs-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-tooling-docs --json`
- Package Script: `npm run test:rmt-tooling-docs`
- Zielzustand: `rmt-tooling-docs-ready`

## Ziel

`WP-E14-14` macht das RMT Tooling fuer Entwickler sichtbar. Neue Entwickler sollen in der offiziellen Doku erkennen, dass native `.rmt` Dokumente, Linter, Language Server, Snippets, AI-Agent Repair Report und Regression Gates zusammen den Standard-Authoring-Pfad bilden.

## Umgesetzt

- `docs/rmt-linter.md` neu angelegt
- `docs/rmt-language-server.md` auf den aktuellen Tooling-Stand erweitert
- `docs/quick-start-guide.md` um `.rmt`, `xt rmt lint`, `--json`, `--agent` und LSP Start erweitert
- `docs/xtendrmt-native-authoring.md` um Authoring Tooling, Snippets und Regression Gate erweitert
- `docs/en/README.md` um Linter und Language Server verlinkt
- `docs/menu.json` um `rmt-linter` und `rmt-language-server` erweitert
- `tests/docs/rmt_tooling_docs_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-tooling-docs` erweitert

## Dokumentationspfad

Empfohlene Reihenfolge fuer neue Entwickler:

1. [Quick Start Guide](../docs/quick-start-guide.md)
2. [XTendRMT Native Authoring Guide](../docs/xtendrmt-native-authoring.md)
3. [RMT Linter und AI-Agent Repair Report](../docs/rmt-linter.md)
4. [RMT Language Server und Editor Setup](../docs/rmt-language-server.md)
5. [XTendRMT App-DSL Reference](../docs/xtendrmt-app-dsl.md)

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `.rmt` ist als Standardpfad sichtbar | erfuellt |
| Linter-Befehle sind dokumentiert | erfuellt |
| `--json` und `--agent` sind dokumentiert | erfuellt |
| LSP-Start und Editor-Setup sind dokumentiert | erfuellt |
| Snippet-Prefixes sind dokumentiert | erfuellt |
| Regression-Gates sind sichtbar | erfuellt |
| Docs-App-Menue enthaelt Linter und LSP | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-tooling-docs --json
npm run test:rmt-tooling-docs -- --json
```

## Handoff

`WP-E14-14` ist abgeschlossen. `WP-E14-15` kann nun Release-Gates, Package-Metadaten und CI-Handoff vorbereiten.

Das naechste Paket sollte die bestehenden Gates nicht neu erfinden, sondern `rmt-linter-cli`, `rmt-language-server`, `rmt-agent-report`, `rmt-editor-packaging`, `rmt-language-regression` und `rmt-tooling-docs` zu einer releasefaehigen Gate-Surface buendeln.
