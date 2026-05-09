# WP-E14-06 - CLI `xt rmt lint` und Reporter integrieren

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.rmt.linter.cli.v1`
- Report Schema: `xtend.rmt.linter.report.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-linter-cli --json`
- Package Script: `npm run test:rmt-linter-cli`
- Zielzustand: `rmt-linter-cli-ready`

## Ziel

`WP-E14-06` macht den nativen RMT-Linter lokal und CI-faehig ausfuehrbar.

Die CLI stellt die Short-Form bereit:

```bash
xt rmt lint app.rmt
```

und nutzt dieselbe Bin-Surface wie `xtend` und `xtend-scaffold`, da alle drei Aliasse auf `xtend-builder/scaffold.js` zeigen.

## Umgesetzt

- `tools/rmt-linter/cli.js` als duenne CLI-Schicht angelegt
- `xtend-builder/lib/cli.js` um `rmt lint` erweitert
- `xt rmt lint <file-or-dir>` integriert
- `xt rmt lint <glob> --json` integriert
- `--fail-on error|warning|info|hint` integriert
- `--root <dir>` fuer Workspace-relative Targets integriert
- Text-Reporter fuer Menschen umgesetzt
- JSON-Reporter fuer CI und AI-Agenten umgesetzt
- Exit-Code-Policy umgesetzt:
  - `0` wenn der Report nach `failOn` passed
  - `1` bei blockierenden Diagnosen oder ungueltigen Targets
- Datei-, Directory- und einfacher Glob-Support umgesetzt
- Native `.rmt` und Fallback `.rmt.json` werden automatisch gefunden
- Explizite `.json` Targets bleiben als Edge-Case-Fallback lintbar
- `tests/rmt-language/rmt_linter_cli_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` und `package.json` um `rmt-linter-cli` erweitert

## Reporter-Shape

Der CLI-Report nutzt weiter `xtend.rmt.linter.report.v1`, ergaenzt aber die CLI-Oberflaeche:

- `cliSchema`
- `workpackage`
- `status`
- `ok`
- `failOn`
- `files`
- `fileReports`
- `diagnostics`
- `errorCount`
- `warningCount`
- `infoCount`
- `hintCount`

Damit ist der Report direkt CI-kompatibel, ohne dass spaetere LSP- oder CLI-Schichten Graph-Interna serialisieren muessen.

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| `xt rmt lint` ist verfuegbar | erfuellt |
| JSON-Reporter ist verfuegbar | erfuellt: `--json` |
| Text-Reporter ist verfuegbar | erfuellt |
| Exit Codes sind definiert | erfuellt |
| Directory Support ist vorhanden | erfuellt |
| Glob Support ist vorhanden | erfuellt |
| CI kann Report konsumieren | erfuellt: deterministisches JSON |
| CLI dupliziert keine Rule-Logik | erfuellt: nutzt `lintRmtSource(...)` |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-linter-cli --json
npm run test:rmt-linter-cli -- --json
node xtend-builder/scaffold.js rmt lint xtendrmt/rmt-first-demo-app.rmt --json
```

## Handoff

`WP-E14-06` ist abgeschlossen. `WP-E14-07` kann nun Completion Provider fuer Domains, Adapter, Tags, Routes und Schedules aufbauen.

Completion darf den CLI-Reporter nicht nutzen, sondern soll direkt auf Semantic Graph und Catalog-Hints aus `tools/rmt-language` zugreifen.
