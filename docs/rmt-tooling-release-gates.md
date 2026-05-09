# RMT Tooling Release Gates

- Status: produktiv vorbereitet ab `WP-E14-15`
- Contract: `xtend.epic14.rmt-tooling.v1`
- Gate Record Contract: `xtend.epic14.rmt-tooling-gate.record.v1`
- Report Contract: `xtend.epic14.rmt-tooling-report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js epic14-rmt-tooling --json`

## Zweck

Die RMT Tooling Gates buendeln den nativen `.rmt` Authoring-Pfad fuer Pull Requests, Release-Kandidaten und AI-Agenten. Sie pruefen nicht die RMT Runtime, sondern die Sprachebene: Source Model, Parser, Semantic Graph, Linter, CLI, Completion, Navigation, LSP, Code Actions, Agent Report, Editor Packaging, Regression Fixtures und Dokumentation.

## Befehle

```bash
npm run test:rmt-linter
npm run test:rmt-language-server
npm run test:pr:rmt
npm run test:pr:rmt:report
npm run test:rmt-tooling
npm run test:rmt-tooling:report
node scripts/run_xtend_tests.js epic14-rmt-tooling --json
```

`npm run test:pr:rmt` ist ein optionaler Zusatzgate fuer RMT-nahe Pull Requests. Der globale PR-Gate bleibt dadurch schlank, kann aber bei DSL-, Linter-, LSP- oder Agent-Report-Aenderungen gezielt erweitert werden.

`npm run test:rmt-tooling` ist der Release-Bundle-Gate fuer Epic 14. Er laeuft ohne Netzwerk und nutzt ausschliesslich repo-lokale Fixtures, Docs und Tooling-Module.

## Release-Bundle

Das Release-Bundle umfasst:

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

## Package Surface

Die Package-Surface fuer RMT Tooling ist ueber `package.json` exportiert. Relevant fuer Tooling-Konsumenten sind insbesondere:

- `xtend/rmt-language/source-model`
- `xtend/rmt-language/parser`
- `xtend/rmt-language/diagnostics`
- `xtend/rmt-language/completions`
- `xtend/rmt-language/code-actions`
- `xtend/rmt-language-server`
- `xtend/rmt-linter/cli`
- `xtend/rmt-linter/reporter`
- `xtend/rmt-language/snippets`

Der Gate `epic14-rmt-tooling` prueft, dass diese Surface nicht unbemerkt driftet und dass `xtend.epic14RmtTooling` die aktiven Scripts, Suites und Handoff-Metadaten enthaelt.

## CI-Handoff

Die globale Full-Release-Linie bleibt:

```bash
npm run test:release:full:report
```

RMT Tooling ist zusaetzlich als eigener Release-Gate in `xtend.releaseGates` registriert:

```bash
npm run test:rmt-tooling
```

Damit koennen Release-Owner, CI-Systeme und AI-Agenten die RMT-Sprachwerkzeuge separat nachweisen, ohne den RMT Kernel mit XTend Runtime-Typen zu koppeln.
