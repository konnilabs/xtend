# WP-E14-01 - RMT Tooling Scope, Architektur und Diagnosemodell einfrieren

- Status: `completed`
- Datum: 8. Mai 2026
- Epic: `EPIC-14-XTendRMT-DSL-Linter-und-Language-Server`
- Contract: `xtend.epic14.wp01.rmt-tooling-scope-architecture-diagnostics.v1`
- Architektur Contract: `xtend.rmt.dsl-tooling-architecture.v1`
- Diagnostic Catalog: `xtend.rmt.linter.diagnostic-catalog.v1`
- Lokaler Gate: `node scripts/run_xtend_tests.js references --json`
- Zielzustand: `rmt-tooling-scope-accepted`

## Ziel

`WP-E14-01` macht Epic 14 operativ startbar. Das Paket friert fest, wie RMT-Linter, RMT-Sprachkern und RMT Language Server aufgebaut werden sollen, ohne eine zweite Semantik neben dem RMT Format zu erzeugen.

Das Paket implementiert noch keinen Parser, keinen Linter und keinen LSP-Server. Es verhindert Technical Debt, indem die Grenzen vor der Implementierung festgelegt werden.

## Umgesetzt

- `development/XTendRMT-DSL-Tooling-Architektur.md` als Tooling-Architektur angelegt
- Diagnosekatalog `xtend.rmt.linter.diagnostic-catalog.v1` definiert
- Paketgrenzen fuer `tools/rmt-language`, `tools/rmt-linter` und `tools/rmt-language-server` festgelegt
- `.rmt` als primaerer Authoring-Dateityp bestaetigt
- `.rmt.json` und `.json` als reine Fallback-Dateitypen klassifiziert
- Kernel Boundary `no-rmt-kernel-import-of-xtend-types` fuer Tooling bestaetigt
- Folgepaket `WP-E14-02` auf Source Model und Range Mapping begrenzt
- Epic-Dokument auf Handoff nach `WP-E14-01` aktualisiert

## Architekturentscheidung

Die fachliche RMT-Analyse gehoert in eine gemeinsame Sprachkern-Schicht:

- `tools/rmt-language`

CLI und LSP sind Adapter:

- `tools/rmt-linter`
- `tools/rmt-language-server`

Diese Entscheidung ist wichtig, weil der Language Server spaeter nicht mit eigener Analyse-Logik neben dem CLI-Linter laufen darf. Diagnosen, Completions, Hover, Definitions und Code Actions muessen aus demselben Semantic Graph entstehen.

## Diagnoseentscheidung

Diagnosen erhalten stabile Codes, Severity, Range/JSON-Pointer und Repair-Hints.

Der erste Diagnosekatalog umfasst:

- Syntax
- Document Shape
- File Policy
- Domains
- Identity
- Adapter
- References
- Routing
- Templates
- Security
- Kernel Boundary
- Fabric/Lanes
- Hydration
- Scheduler
- A11y
- Migration

Besonders wichtig fuer die letzte Umstellung:

- `.rmt` ist der Normalpfad
- `.rmt.json` erzeugt spaeter `rmt.document.extension.fallback-used`
- der Fallback ist lesbar, aber nicht empfohlen

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Diagnosemodell ist stabil | erfuellt: `xtend.rmt.linter.diagnostic-catalog.v1` |
| Package-Grenzen sind benannt | erfuellt: `rmt-language`, `rmt-linter`, `rmt-language-server` |
| `.rmt` ist primaerer Authoring-Dateityp | erfuellt |
| `.rmt.json` ist nur Fallback | erfuellt |
| keine RMT-Kernelkopplung an XTend | erfuellt |
| `WP-E14-02` ist startbar | erfuellt |

## Verifikation

```bash
node scripts/run_xtend_tests.js references --json
```

## Handoff

`WP-E14-01` ist abgeschlossen. `WP-E14-02` kann das native `.rmt` Source Model und Range Mapping bauen.

Die naechste Implementierung soll bewusst klein bleiben:

- Text Snapshot
- Datei-URI
- Line/Character/Offset Mapping
- JSON-Pointer-Range-Grundlage
- Tests fuer `.rmt` Fixtures

Noch nicht Teil von `WP-E14-02`:

- vollstaendiger Linter
- CLI
- LSP-Server
- Code Actions
- Formatter
