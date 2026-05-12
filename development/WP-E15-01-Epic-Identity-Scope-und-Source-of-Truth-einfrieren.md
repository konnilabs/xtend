# WP-E15-01 - Epic-Identity, Scope und Source-of-Truth einfrieren

- Status: `completed`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Epic Contract: `xtend.rmt.vnext-syntax.v1`
- WP Contract: `xtend.epic15.wp01.vnext-syntax-scope-source-of-truth.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Primaerer Dateityp: `.rmt`
- Zielzustand: `rmt-vnext-syntax-contract-ready`
- Gate: Dokumentationsreview gegen Epic 14, Epic 05 und bestehende RMT-Guides

## Ziel

`WP-E15-01` macht Epic 15 operativ startbar. Das Paket friert fest, dass RMT vNext eine neue Authoring-Syntax ist, aber keine zweite Runtime, kein Host-spezifischer Produktpfad und keine Abkehr vom JSON-kompatiblen Core-Format.

Die wichtigste Entscheidung:

- Menschen schreiben vNext `.rmt`.
- Parser und Compiler erzeugen Core-Records.
- Runtime, Adapter, Linter, LSP und AI-Agenten arbeiten gegen Core, AST, Source Maps und stabile Diagnostics.

## Umgesetzt

- Epic 15 als eigenstaendiges Syntax-Epic mit Contract `xtend.rmt.vnext-syntax.v1` klassifiziert
- Header in `development/EPIC_E15_RMT_vNext_Syntax.md` um Status, Datum, Zielreife, Boundary, Dateityp, Compiler-Ziel und Bezug erweitert
- vNext-MVP-Scope und Out-of-Scope-Liste eingefroren
- Source-of-Truth-Matrix fuer Development-Contracts, RMT-Language-Schicht, Linter, LSP, Schema, Runtime-Bundles, Docs und Tests definiert
- Kompatibilitaetsentscheidung dokumentiert: vNext ist additiv, Legacy JSON bleibt lesbar und Migration bleibt opt-in
- `WP-E15-02` als naechstes startbares Paket markiert
- `WP-E15-03` fachlich vorbereitet, aber weiterhin vom Grammar-MVP abhaengig gehalten

## Scope-Entscheidung

In Scope fuer das vNext MVP:

- `template`, `surface`, `lane` und Lifecycle-Operationen
- Core-Format-vNext-Mapping als JSON-kompatibles Compiler-Ziel
- AST, Source Maps und Diagnostics fuer Tooling
- Parser und Compiler fuer native `.rmt` vNext-Dateien
- deklaratives `when` Expression-Subset
- `slot` Composition ueber Component Adapter
- statische Imports und deterministischer Module Graph
- Events, Actions und Data Sources als referenzielle Contracts
- Trust Boundaries, Sanitizing und Security Policies
- Streaming- und Incremental-Rendering-Records
- Compatibility und Migration fuer bestehende RMT-Dokumente

Out of Scope fuer das vNext MVP:

- imperative Skriptbloecke, Funktionsdefinitionen oder Eval
- JSX-, HTML- oder allgemeine Template-Engine-Kompatibilitaet
- Host-spezifische Runtime-Imports im RMT-Kernel
- automatische Migration historischer Dokumente ohne Opt-in
- Editor-spezifische Analyse neben der gemeinsamen RMT-Language-Schicht
- produktiver Formatter als Blocker fuer Parser- und Compiler-MVP

## Source-of-Truth

| Artefaktklasse | Rolle |
|----------------|-------|
| `development/EPIC_E15_RMT_vNext_Syntax.md` | Epic-Plan, WP-Backlog, Scope und Handoff |
| `development/WP-E15-*.md` | Workpackage-Contracts und Abnahmen |
| `tools/rmt-language/` | Source Model, Parser, AST, Compiler, Diagnostics und Tooling-Fakten |
| `tools/rmt-linter/` | CLI-/CI-Adapter fuer Diagnostics und Reports |
| `tools/rmt-language-server/` | LSP-Adapter auf derselben Sprachebene |
| `xtendrmt/rmt.schema.json` | Schema-Output und Regression-Referenz |
| `xtendrmt/rmt-core.*` | Runtime-/Core-Bundle und Regression-Referenz |
| `docs/xtendrmt-native-authoring.md` | produktiver Guide fuer bestehende native JSON-nahe RMT-Dokumente |
| `docs/xtendrmt-app-dsl.md` | aktuelle App-DSL- und Core-Domain-Referenz |
| `docs/rmt-dsl-authoring-polish.md` | Vorarbeit fuer Authoring-Ergonomie und Aliasdiagnostik |
| `tests/rmt/`, `tests/fixtures/`, `tests/references/` | Contract-, Golden-, Compatibility- und Referenzgates |

## Dokumentationsreview

| Referenz | Ergebnis fuer Epic 15 |
|----------|-----------------------|
| Epic 14 RMT Linter und Language Server | vNext nutzt dieselbe Tooling-Grenze: `tools/rmt-language` ist Analysequelle, CLI und LSP sind Adapter |
| Epic 05 RMT Bridge und natives Routing | vNext respektiert Adapter Registry, Components, Routes, Schedules und host-neutrale Ausfuehrung |
| `XTendRMT-Upstream-Handoff-Spezifikation` | Build-Artefakte in `xtendrmt/` bleiben Output und Regression-Referenz, nicht alleinige Architekturquelle |
| `XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken` | Migration bleibt additiv und opt-in; XTend ist First-Class Host, aber nicht Pflicht-Host |
| `docs/xtendrmt-native-authoring.md` | bestehende native JSON-nahe `.rmt` Dokumente bleiben produktiv gueltig |
| `docs/xtendrmt-app-dsl.md` | vNext muss auf vorhandene Core-Domains mappen oder Deltas explizit versionieren |
| `docs/rmt-dsl-authoring-polish.md` | Authoring-Ergonomie ist erlaubt, aber Kernel-Boundary und Diagnostics bleiben Pflicht |

## Definition-of-Done-Check

| Kriterium | Ergebnis |
|-----------|----------|
| Epic-Nummer ist eindeutig | erfuellt: Epic 15 |
| Contract ist benannt | erfuellt: `xtend.rmt.vnext-syntax.v1` |
| In-Scope und Out-of-Scope sind getrennt | erfuellt |
| Source-of-Truth ist festgelegt | erfuellt |
| Migrationsziel ist eindeutig | erfuellt: additiv, opt-in, Legacy bleibt lesbar |
| Kernel-Boundary ist bestaetigt | erfuellt: `no-rmt-kernel-import-of-host-runtime-types` |
| `WP-E15-02` ist startbar | erfuellt |
| `WP-E15-03` ist strukturell vorbereitet | erfuellt, wartet auf Grammar-MVP |

## Verifikation

Das WP-Gate ist ein Dokumentationsreview. Ein Runtime- oder Parser-Test ist fuer dieses Paket noch nicht erforderlich, weil Parser, Compiler und Fixtures erst ab `WP-E15-02` bis `WP-E15-05` entstehen.

Referenzpfad-Gate:

```bash
node scripts/run_xtend_tests.js references --json
```

Ergebnis:

- Status: `passed`
- Suites: `1`
- Passes: `7472`
- Failures: `0`
- Warnings: `0`

## Handoff

`WP-E15-01` ist abgeschlossen. `WP-E15-02` kann den Syntax Contract und das Grammar MVP definieren.

Die naechste Umsetzung soll bewusst klein bleiben:

- Token- und Keyword-Regeln
- Kommentar- und String-Regeln
- Blockstruktur fuer `template`, `surface` und `lane`
- Lifecycle-Operations als erste ausfuehrungsfreie Statements
- positive und negative Syntaxbeispiele

Noch nicht Teil von `WP-E15-02`:

- produktiver Parser
- Core-Compiler
- Runtime-Ausfuehrung
- LSP-Integration
- automatische Migration
