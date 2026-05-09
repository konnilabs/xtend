# XTend Epic 14 RMT Tooling Release Gates

- Status: Accepted
- Datum: 8. Mai 2026
- Workpackage: `WP-E14-15`
- Contract: `xtend.epic14.rmt-tooling.v1`
- Gate Record Contract: `xtend.epic14.rmt-tooling-gate.record.v1`
- Report Contract: `xtend.epic14.rmt-tooling-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic14-rmt-tooling --json`
- Package Script: `npm run test:epic14-rmt-tooling`
- Boundary: `no-rmt-kernel-import-of-xtend-types`

## Zweck

`WP-E14-15` macht das in Epic 14 aufgebaute RMT Tooling releasefaehig. Das Paket erzeugt keine neue RMT-Semantik, sondern buendelt Parser, Semantic Graph, Linter, CLI, Completion, Navigation, LSP, Code Actions, Agent Report, Editor Packaging, Regression Matrix und Doku in einer stabilen Gate-Oberflaeche.

Damit kann RMT Tooling in drei Modi betrieben werden:

| Modus | Befehl | Zweck |
|-------|--------|-------|
| Optionaler PR-Gate | `npm run test:pr:rmt` | schneller Zusatzlauf fuer RMT-nahe Pull Requests |
| Optionaler PR-Report | `npm run test:pr:rmt:report` | maschinenlesbares PR-Artefakt fuer RMT Tooling |
| Release-Gate | `npm run test:rmt-tooling` | kompletter RMT-Tooling-Bundle-Gate |
| Release-Report | `npm run test:rmt-tooling:report` | maschinenlesbares Release-Artefakt fuer RMT Tooling |
| Self-Gate | `node scripts/run_xtend_tests.js epic14-rmt-tooling --json` | prueft Package-Surface, Scripts, Exports, Scaffold Config und Referenzen |

## Gate-Schnitt

Der Release-Gate umfasst:

- `rmt-source-model`
- `rmt-parser`
- `rmt-semantic-graph`
- `rmt-linter-rules`
- `rmt-linter-cli`
- `rmt-completions`
- `rmt-navigation`
- `rmt-language-server`
- `rmt-code-actions`
- `rmt-agent-report`
- `rmt-editor-packaging`
- `rmt-language-regression`
- `rmt-tooling-docs`

Der optionale PR-Gate ist bewusst kleiner:

- `rmt-linter-cli`
- `rmt-language-server`
- `rmt-language-regression`
- `rmt-tooling-docs`

So bleibt der Default-PR-Pfad stabil, waehrend RMT-nahe Aenderungen ohne neue CI-Architektur eine eigene schnelle Kontrolllinie erhalten.

## Package Surface

Der Contract erwartet, dass folgende Tooling-Surfaces exportiert bleiben:

- `./rmt-language/source-model`
- `./rmt-language/parser`
- `./rmt-language/format-adapter`
- `./rmt-language/semantic-graph`
- `./rmt-language/diagnostics`
- `./rmt-language/completions`
- `./rmt-language/hover`
- `./rmt-language/symbols`
- `./rmt-language/definitions`
- `./rmt-language/code-actions`
- `./rmt-language-server`
- `./rmt-language-server/protocol`
- `./rmt-linter/cli`
- `./rmt-linter/reporter`
- `./rmt-language/snippets`
- `./rmt-editor/vscode`
- `./catalog/epic14-rmt-tooling`

## CI-Handoff

`npm test` und `npm run test:release:full:report` bleiben die globale Full-Release-Linie. `npm run test:rmt-tooling` wird zusaetzlich in `xtend.releaseGates` registriert, damit Release-Owner und spaetere CI-Workflows die RMT-Sprachwerkzeuge separat als Produktoberflaeche pruefen koennen.

Der Gate selbst bleibt lokal, deterministisch und netzwerkfrei. Externe Editor-Marktplatz-Publikation, Marketplace-Packaging und produktive Formatter-Freigabe bleiben ausserhalb dieses Pakets.
