# WP-E15-05 - Compiler DSL zu Core mit Source Maps und Diagnostics anbinden

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Parser Contract: `xtend.rmt.vnext-parser.v1`
- Core Contract: `xtend.rmt.core-format.vnext.v1`
- Compiler Contract: `xtend.rmt.vnext-compiler.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Lokaler Gate: `node scripts/run_xtend_tests.js rmt-vnext-compiler --json`
- Package Script: `npm run test:rmt-vnext-compiler`
- Zielzustand: `rmt-vnext-core-compiler-ready`

## Ziel

`WP-E15-05` bindet den vNext-Parser an das JSON-kompatible Core-Format an. Das Paket kompiliert `.rmt` Authoring-Text ueber den AST in Core-Domains, erzeugt Source Maps und aggregiert Diagnostics. Es fuehrt noch keine Runtime-Ausfuehrung, Adapter-Validation, Import-Aufloesung oder semantische Host-Pruefung aus.

## Umgesetzt

- `tools/rmt-language/vnext-compiler.js` als AST-to-Core-Compiler angelegt
- Core-Schema `xtend.rmt.core-format.vnext.v1` als Compiler-Ziel umgesetzt
- `compileRmtVNextSource(...)`, `compileRmtVNextAst(...)`, `createRmtVNextCompiler(...)` und `serializeRmtVNextCore(...)` bereitgestellt
- deterministische Core-Domains fuer `imports`, `templates`, `surfaces`, `lanes`, `operations`, `slots`, `events`, `dataSources`, `securityPolicies` und `sourceMap` erzeugt
- stabile IDs fuer Templates, Surfaces, Lanes, Operations, Slots, Events, Sources und Security Policies generiert
- Conditions in kleine Core-Expression-Trees kompiliert
- Source Maps mit `sourceRef`, AST Pointer, Core JSON Pointer und Source Ranges erzeugt
- Parser- und File-Policy-Diagnostics in Compiler-Ergebnisse aggregiert
- ungueltige Syntax stoppt die Compilation und erzeugt kein Core-Dokument
- Golden-Gate fuer byte-stabile Core-JSON-Ausgabe angelegt
- `tests/rmt-language/rmt_vnext_compiler_suite.js` als Gate-Suite angelegt
- `scripts/run_xtend_tests.js` um `rmt-vnext-compiler` erweitert
- `package.json` um Export, Metadaten und Script fuer den vNext-Compiler erweitert
- Epic-Backlog aktualisiert: `WP-E15-05` completed, `WP-E15-06` ready

## Implementierungsentscheidung

Der Compiler ist eine eigene Sprachebene:

- `tools/rmt-language/vnext-compiler.js`

Er nutzt den Parser:

- `tools/rmt-language/vnext-parser.js`

Der Compiler importiert keine Host-Runtimes und erzeugt keine Execution Plans. Runtime-nahe Semantik bleibt den Folgepaketen vorbehalten:

- `WP-E15-06` Lifecycle
- `WP-E15-07` Scheduling
- `WP-E15-08` Surfaces
- `WP-E15-09` Conditions
- `WP-E15-11` Imports
- `WP-E15-13` Security
- `WP-E15-14` Streaming

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Runtime und Tooling koennen mit Core-Format weiterarbeiten | erfuellt: Compiler erzeugt vNext Core-Dokumente |
| Source Maps reichen fuer Linter, LSP und AI-Reports | erfuellt: `sourceRef`, AST Pointer, Core Pointer und Ranges |
| Golden-Compiler-Test ist vorhanden | erfuellt: Minimal- und Complex-Fixture kompilieren byte-stabil |
| Diagnostics werden aggregiert | erfuellt: Parser- und Fallback-Diagnostics bleiben sichtbar |
| ungueltige Syntax erzeugt kein Core-Dokument | erfuellt |
| bestehender vNext-Parser bleibt gruen | erfuellt |
| bestehender JSON-RMT-Parser bleibt gruen | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js rmt-vnext-compiler --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `65`
- Failures: `0`
- Warnings: `0`

Zusaetzliche Regression-Gates:

```bash
node scripts/run_xtend_tests.js rmt-vnext-parser --json
node scripts/run_xtend_tests.js rmt-parser --json
node scripts/run_xtend_tests.js references --json
```

Ergebnisse:

- `rmt-vnext-parser`: `passed`, `57` Passes, `0` Failures, `0` Warnings
- `rmt-parser`: `passed`, `84` Passes, `0` Failures, `0` Warnings
- `references`: `passed`, `7472` Passes, `0` Failures, `0` Warnings
- `package.json` JSON parse: `passed`

## Handoff

`WP-E15-05` ist abgeschlossen. `WP-E15-06` kann Lifecycle Semantik und Operation Contract haerten.

Die naechsten Pakete koennen ab jetzt auf Core-Domains statt Authoring-Text arbeiten:

- `operations[]`
- `lanes[]`
- `surfaces[]`
- `slots[]`
- `events[]`
- `dataSources[]`
- `securityPolicies[]`
- `sourceMap[]`

Noch nicht Teil von `WP-E15-06`:

- Scheduling-Budgets
- Surface Registry Runtime
- Import-Aufloesung
- Event-/Action-Execution
- Streaming Runtime
- LSP-Integration
