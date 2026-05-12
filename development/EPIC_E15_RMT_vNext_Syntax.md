# XTend Epic 15 - RMT vNext Syntax & Lifecycle-Oriented DSL

- Status: `completed / vNext Release Handoff accepted`
- Datum: 12. Mai 2026
- Typ: Epic / Syntax-Contract und Implementierungsplan
- Contract: `xtend.rmt.vnext-syntax.v1`
- WP-E15-01 Contract: `xtend.epic15.wp01.vnext-syntax-scope-source-of-truth.v1`
- WP-E15-02 Contract: `xtend.rmt.vnext.grammar.v1`
- WP-E15-03 Contract: `xtend.rmt.core-format.vnext.v1`
- WP-E15-04 Contract: `xtend.rmt.vnext-parser.v1`
- WP-E15-05 Contract: `xtend.rmt.vnext-compiler.v1`
- WP-E15-06 Contract: `xtend.rmt.vnext-lifecycle.v1`
- WP-E15-07 Contract: `xtend.rmt.vnext-scheduler-policy.v1`
- WP-E15-08 Contract: `xtend.rmt.vnext-surface-registry.v1`
- WP-E15-09 Contract: `xtend.rmt.vnext-condition-contract.v1`
- WP-E15-10 Contract: `xtend.rmt.vnext-composition.v1`
- WP-E15-11 Contract: `xtend.rmt.vnext-import-resolver.v1`
- WP-E15-12 Contract: `xtend.rmt.vnext-event-action-contract.v1`
- WP-E15-13 Contract: `xtend.rmt.vnext-security-policy-contract.v1`
- WP-E15-14 Contract: `xtend.rmt.vnext-streaming-contract.v1`
- WP-E15-15 Contract: `xtend.rmt.vnext-tooling-adapter.v1`
- WP-E15-16 Contract: `xtend.rmt.vnext-compatibility-matrix.v1`
- WP-E15-17 Contract: `xtend.rmt.vnext-regression-gate.v1`
- WP-E15-18 Contract: `xtend.rmt.vnext-release-handoff.v1`
- Zielreife: `rmt-vnext-release-ready`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Primaerer Dateityp: `.rmt`
- Compiler-Ziel: JSON-kompatibles RMT Core Format
- Legacy-Kompatibilitaet: bestehende JSON-nahe `.rmt` und `.rmt.json` Dokumente bleiben opt-in migrierbar
- Bezug:
  - `development/EPIC-14-XTendRMT-DSL-Linter-und-Language-Server.md`
  - `development/WP-E14-01-RMT-Tooling-Scope-Architektur-und-Diagnosemodell-einfrieren.md`
  - `development/XTendRMT-DSL-Tooling-Architektur.md`
  - `development/XTendRMT-vNext-Grammar-Contract.md`
  - `development/XTendRMT-vNext-Core-Format-Contract.md`
  - `development/XTendRMT-vNext-Lifecycle-Operation-Contract.md`
  - `development/XTendRMT-vNext-Scheduler-Policy-Contract.md`
  - `development/XTendRMT-vNext-Surface-Registry-Contract.md`
  - `development/XTendRMT-vNext-Condition-Expression-Contract.md`
  - `development/XTendRMT-vNext-Composition-Component-Binding-Contract.md`
  - `development/XTendRMT-vNext-Import-Resolver-Contract.md`
  - `development/XTendRMT-vNext-Event-Action-DataSource-Contract.md`
  - `development/XTendRMT-vNext-Security-Policy-Contract.md`
  - `development/XTendRMT-vNext-Streaming-Contract.md`
  - `development/XTendRMT-vNext-Tooling-Adapter-Contract.md`
  - `development/XTendRMT-vNext-Compatibility-Migration-Contract.md`
  - `development/XTendRMT-vNext-Fixture-Regression-Gate-Contract.md`
  - `development/XTendRMT-vNext-Release-Handoff-Contract.md`
  - `development/WP-E15-01-Epic-Identity-Scope-und-Source-of-Truth-einfrieren.md`
  - `development/WP-E15-02-Syntax-Contract-und-Grammar-MVP-definieren.md`
  - `development/WP-E15-03-Core-Format-vNext-AST-und-Schema-Mapping-spezifizieren.md`
  - `development/WP-E15-04-Lexer-Parser-MVP-fuer-Templates-Surfaces-Lanes-und-Lifecycle-Ops-bauen.md`
  - `development/WP-E15-05-Compiler-DSL-zu-Core-mit-Source-Maps-und-Diagnostics-anbinden.md`
  - `development/WP-E15-06-Lifecycle-Semantik-und-Operation-Contract-haerten.md`
  - `development/WP-E15-07-Scheduling-Lanes-Chunking-und-Backpressure-modellieren.md`
  - `development/WP-E15-08-Surface-Orchestrierung-und-Host-neutral-Surface-Registry-bauen.md`
  - `development/WP-E15-09-Conditions-und-deklaratives-Expression-Subset-definieren.md`
  - `development/WP-E15-10-Slots-Composition-und-Component-Binding-integrieren.md`
  - `development/WP-E15-11-Imports-Module-Resolution-und-Package-Boundaries-implementieren.md`
  - `development/WP-E15-12-Events-Actions-und-Data-Sources-anbinden.md`
  - `development/WP-E15-13-Trust-Boundaries-Sanitizing-und-Security-Policies-integrieren.md`
  - `development/WP-E15-14-Streaming-und-Incremental-Rendering-Contract-vorbereiten.md`
  - `development/WP-E15-15-Tooling-Update-fuer-Linter-LSP-Formatter-und-Snippets-bauen.md`
  - `development/WP-E15-16-Compatibility-Migration-und-Legacy-JSON-Roundtrip-absichern.md`
  - `development/WP-E15-17-Fixtures-Compiler-Golden-Tests-Fuzzing-und-Browser-Smokes-erweitern.md`
  - `development/WP-E15-18-Docs-Reference-Demo-Release-Gates-und-Handoff-finalisieren.md`
  - `docs/rmt-vnext-authoring.md`
  - `docs/rmt-vnext-migration-notes.md`
  - `docs/rmt-vnext-release-handoff.md`
  - `xtendrmt/rmt-vnext-reference-demo.rmt`
  - `xtendrmt/rmt-vnext-reference-demo.core.json`
  - `development/XTendRMT-Upstream-Handoff-Spezifikation.md`
  - `development/XTendRMT-Migrations-und-Framework-Agnostik-Leitplanken.md`
  - `docs/xtendrmt-native-authoring.md`
  - `docs/xtendrmt-app-dsl.md`
  - `docs/rmt-dsl-authoring-polish.md`
  - `xtendrmt/rmt.schema.json`
  - `tools/rmt-language/`
  - `tests/rmt/`

## Status

Epic 15 ist abgeschlossen. RMT vNext besitzt nun Syntax-Contract, Parser, Compiler, Semantikmodule, Tooling, Compatibility/Migration, Regression-Gates, Authoring-Dokumentation, Reference Demo, Core-Output und Release-Handoff.

Naechstes startbares Paket:

- keine weiteren Epic-15-Pakete

# Vision

RMT soll sich von einer primär JSON-orientierten Konfigurationssprache zu einer vollwertigen deklarativen Orchestrierungs-DSL entwickeln, die speziell für moderne Rendering-, Scheduling- und Hydration-Pipelines entworfen wurde.

Die Sprache soll nicht primär UI-Markup beschreiben, sondern:

- Rendering orchestrieren
- Lifecycles kontrollieren
- Surfaces verwalten
- Scheduling priorisieren
- Hydration steuern
- Trust Boundaries definieren
- Chunking und Backpressure ausdrücken
- Compute- und UI-Orchestrierung verbinden

RMT soll langfristig die zentrale deklarative Sprache des XTend-Ökosystems werden.

---

# Scope Freeze nach WP-E15-01

Epic 15 fuehrt keine zweite Runtime und keinen neuen Host-spezifischen Produktpfad ein. Das Epic definiert und implementiert eine menschenfreundliche Authoring-Syntax, die deterministisch in das bestehende RMT-Prinzip aus Core-Format, Tooling-Schicht, Adapter-Contracts und host-neutraler Runtime uebersetzt wird.

## In Scope fuer das vNext MVP

- Authoring-Syntax fuer `template`, `surface`, `lane` und Lifecycle-Operationen
- Core-Format-vNext-Mapping als JSON-kompatibles Compiler-Ziel
- AST, Source Maps und Diagnostics fuer Linter, LSP und AI-Agent-Reports
- Parser und Compiler fuer native `.rmt` vNext-Dateien
- deklaratives `when` Expression-Subset ohne Runtime-Eval
- `slot` Composition als Orchestrierung ueber Component Adapter
- statische `import` Aufloesung mit deterministischem Module Graph
- `on ... -> action ...` und `from ...` als referenzielle Contracts
- Trust-Boundary- und Sanitizing-Policies fuer unsichere Datenfluesse
- Streaming- und Incremental-Rendering-Records als Capability-basierte Core-Nodes
- Legacy-Kompatibilitaet und Migration fuer bestehende JSON-nahe RMT-Dokumente

## Out of Scope fuer das vNext MVP

- imperative Skriptbloecke, Funktionsdefinitionen oder freies Eval
- JSX-, HTML- oder Template-Engine-Kompatibilitaet als Sprachziel
- Host-spezifische Runtime-Imports im RMT-Kernel
- automatische Migration aller historischen Dokumente ohne Opt-in
- Editor-spezifische Analyse ausserhalb der gemeinsamen RMT-Language-Schicht
- produktiver Formatter als Blocker fuer Parser- und Compiler-MVP
- neue XTend-, XRouter-, React-, Vue- oder DOM-Sonderlogik im Kernel

## Source-of-Truth-Matrix

| Artefaktklasse | Fuehrende Rolle in Epic 15 | Schutzregel |
|----------------|----------------------------|-------------|
| `development/EPIC_E15_RMT_vNext_Syntax.md` | Epic-Plan, WP-Backlog, Scope und Handoff | darf Zielbild und Arbeitsplanung fuehren, aber keine Parserdetails als einzige Quelle verstecken |
| `development/WP-E15-*.md` | einzelne Workpackage-Contracts und Abnahmen | jedes abgeschlossene WP benennt Gate, Artefakte und Folgepaket |
| `tools/rmt-language/` | gemeinsame Sprachebene fuer Source Model, Parser, AST, Compiler, Diagnostics und Tooling-Fakten | Linter, CLI und LSP duerfen keine zweite Semantik daneben aufbauen |
| `tools/rmt-linter/` | CLI-/CI-Adapter fuer Diagnosen und Reports | nutzt `tools/rmt-language/`, fuehrt keine Host-Runtime aus |
| `tools/rmt-language-server/` | LSP-Adapter fuer Completion, Hover, Symbols, Definitions und Code Actions | nutzt dieselben Parser-, Compiler- und Semantic-Graph-Fakten wie CLI |
| `xtendrmt/rmt.schema.json` | Schema-Output und Regression-Referenz fuer Core-Format-Kompatibilitaet | bleibt synchronisiert, ist aber nicht alleinige Architekturquelle |
| `xtendrmt/rmt-core.*` | gebuendelter Runtime-/Core-Output und Regression-Referenz | Build-Artefakt, nicht Ort fuer dauerhafte Syntaxentscheidungen |
| `docs/xtendrmt-native-authoring.md` | produktiver Guide fuer bestehende native JSON-nahe App-DSL | bleibt gueltig; vNext Authoring wird additiv dokumentiert |
| `docs/xtendrmt-app-dsl.md` | Referenz fuer aktuelle Core-/App-Domains | vNext muss auf diese Domains mappen oder Deltas explizit versionieren |
| `docs/rmt-dsl-authoring-polish.md` | Vorarbeit fuer Authoring-Ergonomie und Aliasdiagnostik | Ideen duerfen uebernommen werden, Kernel-Boundary bleibt verbindlich |
| `tests/rmt/` und `tests/fixtures/` | lokale Contract-, Parser-, Compatibility- und Golden-Test-Gates | neue Syntax braucht positive und negative Fixtures |
| `tests/references/` | Referenzpfad- und Dokumentationsgates | haelt Docs, Development-Contracts und Beispiele auffindbar |

## Kompatibilitaetsentscheidung

RMT vNext ist additiv.

- Bestehende JSON-nahe `.rmt` Dokumente bleiben lesbar.
- `.rmt.json` und reine `.json` Dokumente bleiben Fallback- und Migrationspfade, aber nicht der bevorzugte neue Authoring-Stil.
- vNext Authoring kompiliert in Core-Records; Runtime-Hosts konsumieren Core, nicht DSL-Text.
- Migration erfolgt bewusst pro Datei, Root, Package oder App; es gibt keine stille globale Umstellung.
- Legacy- und vNext-Fixtures muessen im selben Tooling-Gate nebeneinander pruefbar bleiben.

---

# Architekturziel

## Kernprinzip

RMT besitzt zukünftig zwei Schichten:

### 1. RMT Core Format

Maschinenlesbares, AST-stabiles Kernformat.

Eigenschaften:

- JSON-kompatibel
- serialisierbar
- schema-validierbar
- AI-freundlich
- transportfähig
- deterministisch

Beispiel:

```json
{
  "schema": "xtend.rmt.template.v2",
  "template": "docs.page",
  "surface": "root"
}
```

Das Core-Format dient als:

- Compiler-Ziel
- Runtime-Input
- Persistenzformat
- Streamingformat
- SSR-/Hydration-Payload
- Worker-Kommunikationsformat

---

### 2. RMT Authoring Syntax

Menschenlesbare DSL für Entwickler.

Eigenschaften:

- deklarativ
- lifecycle-orientiert
- scheduling-aware
- lesbar
- modular
- komponentenagnostisch

Beispiel:

```rmt
template docs.page {
  surface root {
    lane critical {
      hydrate docs-header
    }

    lane normal {
      hydrate docs-content
    }
  }
}
```

Die DSL wird vollständig in das Core-Format kompiliert.

---

# Strategische Ziele

## 1. Lifecycle First

Der Lifecycle von Komponenten soll ein First-Class-Konzept werden.

RMT soll Lifecycle-Zustände explizit orchestrieren können:

- mount
- hydrate
- suspend
- resume
- invalidate
- dispose
- prewarm
- recycle
- detach
- reattach

Beispiel:

```rmt
hydrate docs-sidebar
suspend search-overlay
dispose stale-route
```

---

## 2. Scheduling sichtbar machen

Scheduling ist Kernbestandteil des RMT-Kernels und muss syntaktisch sichtbar werden.

RMT soll ausdrücken können:

- Prioritäten
- Chunk-Gewichtung
- Idle-Tasks
- Critical Rendering
- Deferred Hydration
- Background Rendering
- Streaming-Hydration

Beispiel:

```rmt
lane critical weight 10 {
  hydrate navigation
}

lane idle weight 1 {
  prewarm search-index
}
```

---

## 3. Surface-Orchestrierung

RMT soll UI-Surfaces nativ verwalten können.

Mögliche Surface-Typen:

- modal
- panel
- dock
- overlay
- window
- sidebar
- sheet
- workspace
- portal

Beispiel:

```rmt
surface modal.settings {
  lane critical {
    hydrate settings-form
  }
}
```

---

## 4. Trust Boundaries & Security

Security-by-Design soll direkt in die DSL integriert werden.

RMT soll deklarativ ausdrücken:

- Sanitizing
- Trust Boundaries
- Isolation
- Sandboxing
- CSP-Kontexte
- Escaping-Policies

Beispiel:

```rmt
hydrate markdown-viewer from endpoint docs.parse {
  trust boundary "xtend.security.sanitizing-boundary.v1"
  sanitize html
}
```

---

## 5. Streaming & Incremental Rendering

RMT soll Streaming nativ unterstützen.

Ziel:

- SSR-Streaming
- SSE-Streaming
- Worker-Streaming
- Chunked Hydration
- Incremental Rendering
- Progressive Composition

Beispiel:

```rmt
stream docs-content from sse.docs.feed
```

---

## 6. Komponentenagnostische Architektur

RMT darf niemals hart an ein bestimmtes UI-Framework gekoppelt werden.

RMT muss kompatibel bleiben mit:

- XTend.UI
- VanillaJS
- Web Components
- Vue
- React
- Angular
- Solid
- zukünftigen UI-Systemen

Der RMT-Kernel soll niemals wissen, was konkret gerendert wird.

---

# Sprachprinzipien

## Deklarativ statt imperativ

RMT beschreibt Absichten, keine Ablaufsteuerung.

Gut:

```rmt
hydrate dashboard
```

Nicht erwünscht:

```rmt
if (...) {
  render(...)
}
```

---

## Lesbarkeit vor Cleverness

Die Syntax soll klar und explizit bleiben.

Ziel:

- wartbar
- AI-lesbar
- enterprise-tauglich
- onboarding-freundlich

---

## AST-Stabilität

Jede Syntaxform muss deterministisch in eine stabile AST-Struktur überführbar sein.

Keine:

- impliziten SideEffects
- versteckten Ausführungsmodelle
- dynamischen Eval-Konstrukte

---

## Schemafähigkeit

RMT-Dateien sollen:

- validierbar
- typisierbar
- analysierbar
- dokumentierbar

sein.

---

# Geplante Sprachkonzepte

## Templates

```rmt
template docs.page {

}
```

---

## Surfaces

```rmt
surface root {

}
```

---

## Lanes

```rmt
lane critical weight 10 {

}
```

---

## Lifecycle Operations

```rmt
mount component
hydrate component
suspend component
dispose component
```

---

## Conditions

```rmt
mount admin-panel when user.role == "admin"
```

---

## Slots

```rmt
mount x-card {
  slot body {
    hydrate dashboard
  }
}
```

---

## Imports

```rmt
import "./routes/*.rmt"
```

---

## Events

```rmt
on click -> action search.open
```

---

# Nicht-Ziele

RMT soll NICHT werden:

- JSX-Klon
- HTML-Ersatz
- Template-Engine für statische Webseiten
- imperatives Script-System
- allgemeine Programmiersprache

RMT ist eine Orchestrierungs-DSL.

---

# Langfristige Vision

RMT soll langfristig:

- Rendering orchestrieren
- Compute orchestrieren
- Streaming orchestrieren
- Multi-Surface-Apps orchestrieren
- Browser-Worker koordinieren
- SSR/Hydration vereinheitlichen
- lokale AI-/WASM-Compute-Pipelines integrieren können

Das Ziel ist eine universelle deklarative Runtime-Orchestrierungsschicht für moderne WebApps.

---

# Technische Leitlinie

RMT orientiert sich konzeptionell stärker an:

- Render Pipelines
- Betriebssystem-Schedulern
- Streaming-Runtimes
- Declarative UI Orchestration
- Reactive Scheduling

und weniger an klassischen HTML-Templating-Systemen.

---

# Ergebnisziel

Die neue RMT-Syntax soll:

- die Fähigkeiten des RMT-Kernels sichtbar machen
- Lifecycles explizit kontrollierbar machen
- Scheduling deklarativ ausdrücken
- Security integrieren
- Streaming nativ unterstützen
- große Enterprise-Oberflächen orchestrieren können
- gleichzeitig AI-freundlich und menschenlesbar bleiben

---

# Prüfung und Ableitung notwendiger Schritte

Das Epic beschreibt bereits ein starkes Zielbild, ist aber ohne weitere Zerlegung noch nicht umsetzungsreif. Für die vNext-Syntax müssen vor der Runtime-Implementierung folgende Schritte explizit geklärt und versioniert werden:

- Epic-Identität, vNext-Scope und Abgrenzung zu Epic 14 festlegen
- kanonisches Core-Format als Compiler-Ziel definieren
- konkrete Grammatik, Token-Regeln und reservierte Keywords festlegen
- AST-Modell, Source Maps und Range Mapping für Tooling stabilisieren
- Parser, Compiler und Normalisierung getrennt bauen
- Runtime-Semantik für Lifecycle, Scheduling, Surfaces und Streaming host-neutral halten
- Conditions auf ein kleines deklaratives Expression-Subset begrenzen
- Imports und Modulauflösung ohne dynamische Ausführung definieren
- Trust Boundaries als Policy-Records statt freier Runtime-Logik modellieren
- Legacy-JSON- und bestehende `.rmt` Dokumente migrierbar halten
- Linter, Language Server, Formatter, Snippets und AI-Reports an die neue Syntax anbinden
- Golden Tests, negative Syntaxfixtures, Fuzzing und Browser-Smokes als Release-Gates aufbauen

Kritische Leitplanke:

- RMT vNext bleibt eine deklarative Orchestrierungs-DSL.
- Das Core-Format bleibt JSON-kompatibel und transportfähig.
- Die Authoring-Syntax darf keine versteckte imperative Laufzeit erzeugen.
- Der RMT-Kernel importiert weiterhin keine XTend-, XRouter-, React-, Vue- oder DOM-spezifischen Runtime-Typen.

## Definition of Ready

Ein Workpackage darf gestartet werden, wenn:

- sein Vorgänger-Contract akzeptiert ist
- betroffene Source-, Schema-, Test-, Tooling- und Dokumentationspfade bekannt sind
- der erwartete Output als versionierter Contract oder Artefakt benannt ist
- bestehende RMT-Dokumente nicht unbeabsichtigt gebrochen werden
- ein prüfbares Gate und eine Definition of Done vorliegen

## Priorisierungslogik

- `P0`: schafft Sprachcontract, Parser-/Compiler-Fundament oder Core-Format-Stabilität
- `P1`: implementiert Runtime-Semantik, Composition, Security, Streaming oder Tooling
- `P2`: härtet Migration, Tests, Doku, Demos, Release-Gates und Handoff

## Statuslogik

- `ready`: kann sofort gestartet werden
- `next`: ist fachlich als nächstes sinnvoll, benötigt aber einen Vorgänger
- `blocked`: wartet auf benannte Abhängigkeiten
- `in_progress`: ist in Bearbeitung
- `completed`: Contract, Artefakt und Gate sind akzeptiert

## Nächste startbare Workpackages

Keine weiteren Epic-15-Workpackages sind startbar.

Epic 15 ist mit `WP-E15-18` abgeschlossen.

Der erreichte Zielzustand ist `rmt-vnext-release-ready`.

Folgearbeiten sind als separate Epic-Kandidaten benannt: Runtime Adapter, Formatter/Writer API, Workspace Project Index und Editor Distribution.

---

# Workpackage-Übersicht

| ID | Priorität | Status | Workstream | Titel | Abhängigkeiten |
|----|-----------|--------|------------|-------|----------------|
| `WP-E15-01` | P0 | completed | WS0 | Epic-Identity, Scope und Source-of-Truth einfrieren | - |
| `WP-E15-02` | P0 | completed | WS1 | Syntax Contract und Grammar MVP definieren | `WP-E15-01` |
| `WP-E15-03` | P0 | completed | WS1 | Core Format vNext, AST und Schema Mapping spezifizieren | `WP-E15-01`, `WP-E15-02` |
| `WP-E15-04` | P0 | completed | WS1 | Lexer/Parser MVP für Templates, Surfaces, Lanes und Lifecycle Ops bauen | `WP-E15-02`, `WP-E15-03` |
| `WP-E15-05` | P0 | completed | WS1 | Compiler DSL zu Core mit Source Maps und Diagnostics anbinden | `WP-E15-04` |
| `WP-E15-06` | P1 | completed | WS2 | Lifecycle Semantik und Operation Contract härten | `WP-E15-03`, `WP-E15-05` |
| `WP-E15-07` | P1 | completed | WS2 | Scheduling, Lanes, Chunking und Backpressure modellieren | `WP-E15-03`, `WP-E15-05` |
| `WP-E15-08` | P1 | completed | WS2 | Surface-Orchestrierung und Host-neutral Surface Registry bauen | `WP-E15-03`, `WP-E15-05` |
| `WP-E15-09` | P1 | completed | WS3 | Conditions und deklaratives Expression Subset definieren | `WP-E15-02`, `WP-E15-05` |
| `WP-E15-10` | P1 | completed | WS3 | Slots, Composition und Component Binding integrieren | `WP-E15-05`, `WP-E15-06` |
| `WP-E15-11` | P1 | completed | WS3 | Imports, Module Resolution und Package Boundaries implementieren | `WP-E15-05` |
| `WP-E15-12` | P1 | completed | WS3 | Events, Actions und Data Sources anbinden | `WP-E15-05`, `WP-E15-09` |
| `WP-E15-13` | P1 | completed | WS4 | Trust Boundaries, Sanitizing und Security Policies integrieren | `WP-E15-03`, `WP-E15-05` |
| `WP-E15-14` | P1 | completed | WS4 | Streaming und Incremental Rendering Contract vorbereiten | `WP-E15-07`, `WP-E15-12`, `WP-E15-13` |
| `WP-E15-15` | P1 | completed | WS5 | Tooling Update für Linter, LSP, Formatter und Snippets bauen | `WP-E15-04`, `WP-E15-05` |
| `WP-E15-16` | P2 | completed | WS5 | Compatibility, Migration und Legacy JSON Roundtrip absichern | `WP-E15-05`, `WP-E15-15` |
| `WP-E15-17` | P2 | completed | WS6 | Fixtures, Compiler Golden Tests, Fuzzing und Browser-Smokes erweitern | `WP-E15-06`, `WP-E15-14`, `WP-E15-16` |
| `WP-E15-18` | P2 | completed | WS6 | Docs, Reference Demo, Release Gates und Handoff finalisieren | `WP-E15-15`, `WP-E15-17` |

## Workstreams

| Workstream | Zweck |
|------------|-------|
| WS0 | Scope, Versionierung, Source-of-Truth und Epic-Handoff |
| WS1 | Grammatik, AST, Core Format, Parser und Compiler |
| WS2 | Lifecycle-, Scheduler- und Surface-Runtime-Semantik |
| WS3 | Composition, Conditions, Imports, Events und Data Sources |
| WS4 | Security, Trust Boundaries, Streaming und Incremental Rendering |
| WS5 | Tooling, Migration, Formatter und Backward Compatibility |
| WS6 | Testmatrix, Demos, Dokumentation, Release-Gates und Handoff |

---

# Workpackages im Detail

### WP-E15-01 - Epic-Identity, Scope und Source-of-Truth einfrieren

- Priorität: `P0`
- Status: `completed`
- Ziel:
  - Epic 15 als eigenständiges Syntax-Epic mit klarer Abgrenzung zu Epic 14 und bestehenden RMT-Contracts stabilisieren
- Scope:
  - Contract-Name `xtend.rmt.vnext-syntax.v1`
  - vNext-MVP und Post-MVP trennen
  - führende Source-Verzeichnisse für Sprache, Parser, Schema, Tooling und Tests festlegen
  - Kompatibilitätsziel für bestehende JSON-nahe `.rmt` Dokumente beschreiben
- Zielartefakte:
  - aktualisierter Epic-Header mit Contract, Zielreife und Boundary
  - Source-of-Truth-Matrix für `xtendrmt/`, `tools/rmt-language/`, `tests/` und `docs/`
  - MVP-Scope-Liste für erste implementierbare Syntax
- Gate:
  - Dokumentationsreview gegen Epic 14, Epic 05 und bestehende RMT-Guides
- Definition of Done:
  - Epic-Nummer, Contract, In-Scope, Out-of-Scope und Migrationsziel sind eindeutig
  - `WP-E15-02` und `WP-E15-03` können ohne Strukturunklarheit starten

## Handoff nach WP-E15-01

`WP-E15-01` ist abgeschlossen und akzeptiert den Contract `xtend.epic15.wp01.vnext-syntax-scope-source-of-truth.v1`.

Erledigt:

- Epic 15 besitzt einen verbindlichen Header mit Contract `xtend.rmt.vnext-syntax.v1`, Zielreife, Boundary, Dateityp- und Kompatibilitaetsentscheidung.
- Der Scope ist als vNext-MVP und Out-of-Scope-Liste eingefroren.
- Die Source-of-Truth-Matrix trennt Epic-/WP-Contracts, Sprachebene, Linter, LSP, Schema-Output, Runtime-Bundles, Docs und Tests.
- RMT vNext bleibt additiv: bestehende JSON-nahe `.rmt` Dokumente bleiben lesbar, `.rmt.json` bleibt Fallback, neue vNext-Syntax kompiliert in Core-Records.
- Das Dokumentationsreview gegen Epic 14, Epic 05, Native Authoring Guide, App-DSL Reference und DSL Authoring Polish ist dokumentiert.
- `development/WP-E15-01-Epic-Identity-Scope-und-Source-of-Truth-einfrieren.md` haelt die Abnahme fest.

Naechstes primaeres Paket:

- `WP-E15-02` Syntax Contract und Grammar MVP definieren

`WP-E15-02` ist `ready`.

### WP-E15-02 - Syntax Contract und Grammar MVP definieren

- Priorität: `P0`
- Status: `completed`
- Ziel:
  - konkrete Authoring-Grammatik für die erste vNext-Ausbaustufe festlegen
- Scope:
  - Keywords, Identifier, Strings, Kommentare, Blöcke und Attribute
  - Syntax für `template`, `surface`, `lane`, Lifecycle-Ops, `when`, `slot`, `import`, `on`, `from`
  - reservierte Wörter und Escape-Regeln
  - negative Beispiele für nicht erlaubte imperative Syntax
- Zielartefakte:
  - Grammar-Spezifikation `xtend.rmt.vnext.grammar.v1`
  - valide und invalide Syntaxbeispiele
  - Entscheidung über optionale Semikolons, Trailing Commas und Kommentarformen
- Gate:
  - Grammar-Review mit mindestens je einem Beispiel pro geplantem Sprachkonzept
- Definition of Done:
  - Parser-MVP kann ohne interpretative Lücken gebaut werden
  - Syntax bleibt lesbar, deterministisch und AST-stabil

## Handoff nach WP-E15-02

`WP-E15-02` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.vnext.grammar.v1`.

Erledigt:

- `development/XTendRMT-vNext-Grammar-Contract.md` definiert das Grammar MVP fuer native vNext `.rmt` Authoring-Syntax.
- Lexikalisches Modell, Identifier, reservierte Woerter, Kommentare, Strings, Statement-Enden, Semikolons und Trailing-Comma-Entscheidung sind festgelegt.
- Syntaxformen fuer `import`, `template`, `surface`, `lane`, Lifecycle-Statements, `from`, `when`, `slot`, `on ... -> action`, `trust boundary`, `sanitize` und `stream` sind beschrieben.
- Conditions sind auf ein deklaratives Expression-Subset ohne Funktionsaufrufe, Listenliterale, Ternary, Eval oder Runtime-Code begrenzt.
- Gueltige und ungueltige Beispiele decken alle geplanten MVP-Sprachkonzepte ab.
- `development/WP-E15-02-Syntax-Contract-und-Grammar-MVP-definieren.md` haelt die Abnahme fest.

Naechstes primaeres Paket:

- `WP-E15-03` Core Format vNext, AST und Schema Mapping spezifizieren

`WP-E15-03` ist `ready`.

### WP-E15-03 - Core Format vNext, AST und Schema Mapping spezifizieren

- Priorität: `P0`
- Status: `completed`
- Ziel:
  - das JSON-kompatible Compiler-Ziel vor Implementierungsdetails stabilisieren
- Scope:
  - Core-Format-Version, Document-Kind und Top-Level-Domains
  - AST-Nodes für Templates, Surfaces, Lanes, Operations, Conditions, Slots, Imports, Events und Policies
  - Mapping von Authoring-Syntax auf JSON Pointer
  - Schema-Fähigkeit und Roundtrip-Grenzen
- Zielartefakte:
  - Contract `xtend.rmt.core-format.vnext.v1`
  - Schema-Delta zu bestehendem `rmt.schema.json`
  - AST-Beispiel pro Syntaxkonzept
- Gate:
  - JSON-Schema-Probe mit minimaler und komplexer Fixture
- Definition of Done:
  - jede MVP-Syntaxform hat eine eindeutige Core-Repräsentation
  - `WP-E15-04` kann gegen stabile Node-Typen parsen

## Handoff nach WP-E15-03

`WP-E15-03` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.core-format.vnext.v1`.

Erledigt:

- `development/XTendRMT-vNext-Core-Format-Contract.md` definiert das JSON-kompatible Core-Ziel fuer vNext.
- Stable AST Node Types fuer Dokument, Imports, Templates, Surfaces, Lanes, Lifecycle, Streams, Sources, Conditions, Slots, Events und Security Policies sind festgelegt.
- Core-Domains fuer `imports`, `templates`, `surfaces`, `lanes`, `operations`, `slots`, `events`, `dataSources`, `securityPolicies` und `sourceMap` sind beschrieben.
- Source-Map-Regeln verbinden `sourceRef`, AST Pointer, Core JSON Pointer und zero-based Ranges.
- Schema-Deltas zu `xtendrmt/rmt.schema.json` sind als additive vNext-Erweiterung dokumentiert.
- Minimal- und Complex-Core-Fixtures sind im Contract enthalten und als JSON parsebar geprueft.
- `development/WP-E15-03-Core-Format-vNext-AST-und-Schema-Mapping-spezifizieren.md` haelt die Abnahme fest.

Naechstes primaeres Paket:

- `WP-E15-04` Lexer/Parser MVP fuer Templates, Surfaces, Lanes und Lifecycle Ops bauen

`WP-E15-04` ist `ready`.

### WP-E15-04 - Lexer/Parser MVP für Templates, Surfaces, Lanes und Lifecycle Ops bauen

- Priorität: `P0`
- Status: `completed`
- Ziel:
  - native vNext-Authoring-Syntax in einen stabilen Syntaxbaum überführen
- Scope:
  - Tokenizer
  - Parser für Template-, Surface-, Lane- und Lifecycle-Grundformen
  - Syntaxdiagnostics mit Line/Column und Recoverability
  - keine Runtime-Ausführung
- Zielartefakte:
  - Parser-Modul in der RMT-Language-Schicht
  - MVP-Fixtures für gültige und ungültige vNext-Dateien
  - Syntaxdiagnosekatalog für Parserfehler
- Gate:
  - Parser-Unit-Tests für positive und negative Fixtures
- Definition of Done:
  - MVP-Dateien können deterministisch geparst werden
  - Fehler enthalten verwertbare Positionen für Linter und LSP

## Handoff nach WP-E15-04

`WP-E15-04` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.vnext-parser.v1`.

Erledigt:

- `tools/rmt-language/vnext-parser.js` stellt den nativen vNext Lexer/Parser bereit.
- Der Parser erzeugt `RmtVNextDocument` ASTs mit stabilen Node Types, AST Pointern und Source Ranges.
- Templates, Surfaces, Lanes, Lifecycle Statements, Stream Statements, Data Sources, Conditions, Slots, Events, Trust Boundaries und Sanitizing Policies sind im MVP parsebar.
- Syntax- und Kontextfehler liefern Diagnostics mit Line/Column-Ranges.
- Der bestehende JSON-nahe Epic-14-Parser bleibt unveraendert.
- Positive und negative vNext-Fixtures liegen unter `tests/rmt-language/fixtures/`.
- `tests/rmt-language/rmt_vnext_parser_suite.js`, `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-vnext-parser`.
- `development/WP-E15-04-Lexer-Parser-MVP-fuer-Templates-Surfaces-Lanes-und-Lifecycle-Ops-bauen.md` haelt die Abnahme fest.

Naechstes primaeres Paket:

- `WP-E15-05` Compiler DSL zu Core mit Source Maps und Diagnostics anbinden

`WP-E15-05` ist `ready`.

### WP-E15-05 - Compiler DSL zu Core mit Source Maps und Diagnostics anbinden

- Priorität: `P0`
- Status: `completed`
- Ziel:
  - Authoring-Syntax vollständig in das Core-Format kompilieren
- Scope:
  - AST zu Core-Format-Transform
  - Source Maps von Core-Nodes zurück auf `.rmt` Bereiche
  - Normalisierung und Diagnoseaggregation
  - deterministische Ausgabe für Golden Tests
- Zielartefakte:
  - Compiler-Modul `vNext DSL -> Core`
  - Source-Map-Contract
  - Golden Fixture Set
- Gate:
  - Golden-Compiler-Test: gleiche Eingabe erzeugt byte-stabiles Core-JSON
- Definition of Done:
  - Runtime und Tooling können ausschließlich mit Core-Format weiterarbeiten
  - Source Maps reichen für Linter, LSP und AI-Reports

## Handoff nach WP-E15-05

`WP-E15-05` ist abgeschlossen und akzeptiert den Contract `xtend.rmt.vnext-compiler.v1`.

Erledigt:

- `tools/rmt-language/vnext-compiler.js` kompiliert vNext-AST in das Core-Format `xtend.rmt.core-format.vnext.v1`.
- Der Compiler erzeugt deterministische Core-Domains fuer `imports`, `templates`, `surfaces`, `lanes`, `operations`, `slots`, `events`, `dataSources`, `securityPolicies` und `sourceMap`.
- Source Maps verbinden `sourceRef`, AST Pointer, Core JSON Pointer und Source Ranges.
- Parser-Diagnostics werden in Compiler-Ergebnisse aggregiert; ungueltige Syntax erzeugt kein Core-Dokument.
- `serializeRmtVNextCore(...)` liefert byte-stabile Golden-Compiler-Ausgabe.
- `tests/rmt-language/rmt_vnext_compiler_suite.js`, `package.json` und `scripts/run_xtend_tests.js` kennen den Gate `rmt-vnext-compiler`.
- `development/WP-E15-05-Compiler-DSL-zu-Core-mit-Source-Maps-und-Diagnostics-anbinden.md` haelt die Abnahme fest.

Naechstes primaeres Paket:

- `WP-E15-09` Conditions und deklaratives Expression Subset definieren

`WP-E15-06` ist `completed`.

### WP-E15-06 - Lifecycle Semantik und Operation Contract härten

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - Lifecycle-Operationen semantisch prüfbar und adapterfähig machen
- Scope:
  - `mount`, `hydrate`, `suspend`, `resume`, `invalidate`, `dispose`, `prewarm`, `recycle`, `detach`, `reattach`
  - erlaubte Zieltypen und Operation-Result-Formate
  - Idempotenz, Fehlerdiagnostics und Adapter-Grenzen
- Zielartefakte:
  - Lifecycle Operation Contract
  - Semantikmatrix für Operation, Ziel, Phase und Adapter-Capability
  - Testfixtures für gültige und ungültige Operationen
- Gate:
  - Contract-Test gegen host-neutrale Adapter-Stubs
- Definition of Done:
  - Lifecycle-Befehle bleiben deklarativ
  - fehlende Adapterfähigkeiten erzeugen Diagnostics statt impliziter Fallbacks
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Lifecycle-Operation-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-06-Lifecycle-Semantik-und-Operation-Contract-haerten.md`
  - Modul: `tools/rmt-language/vnext-lifecycle.js`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-lifecycle --json`
  - Package Export: `./rmt-language/vnext-lifecycle`
  - Handoff: `WP-E15-07` bleibt startbar, `WP-E15-10` ist durch Lifecycle Contract entblockt

### WP-E15-07 - Scheduling, Lanes, Chunking und Backpressure modellieren

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - Scheduling in der Syntax sichtbar machen, ohne den Kernel an einen konkreten Scheduler zu koppeln
- Scope:
  - Lane-Namen, Prioritäten, Gewichtung und Budgets
  - Chunking- und Backpressure-Metadaten
  - Mapping zu bestehenden Fabric-/Scheduler-Konzepten
  - Konflikt- und Budgetdiagnostics
- Zielartefakte:
  - Scheduler Policy Contract für vNext
  - Lane- und Weight-Schema
  - Tests für Prioritäts- und Budgetnormalisierung
- Gate:
  - Scheduler-Policy-Tests mit Core-Format-Ausgabe
- Definition of Done:
  - Lanes sind validierbar und referenzierbar
  - Runtime-Hosts können Scheduling-Policies interpretieren, ohne DSL-Text zu parsen
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Scheduler-Policy-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-07-Scheduling-Lanes-Chunking-und-Backpressure-modellieren.md`
  - Modul: `tools/rmt-language/vnext-scheduler.js`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-scheduler --json`
  - Package Export: `./rmt-language/vnext-scheduler`
  - Handoff: `WP-E15-08` bleibt startbar; `WP-E15-14` bleibt bis `WP-E15-12` und `WP-E15-13` blocked

### WP-E15-08 - Surface-Orchestrierung und Host-neutral Surface Registry bauen

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - Surfaces als eigenständige Orchestrierungsziele modellieren
- Scope:
  - Surface IDs und Typen wie `root`, `modal`, `panel`, `overlay`, `workspace`, `portal`
  - Beziehungen zwischen Surfaces, Lanes und Operations
  - Surface Registry als host-neutraler Snapshot
  - Konflikte bei doppelten oder unbekannten Surfaces
- Zielartefakte:
  - Surface Contract vNext
  - Registry-Snapshot-Format
  - Fixture für Multi-Surface-App
- Gate:
  - Surface-Registry- und Normalisierungstests
- Definition of Done:
  - Surfaces sind ohne DOM-Kopplung beschreibbar
  - Operationen können eindeutig einer Surface zugeordnet werden
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Surface-Registry-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-08-Surface-Orchestrierung-und-Host-neutral-Surface-Registry-bauen.md`
  - Modul: `tools/rmt-language/vnext-surfaces.js`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-surfaces --json`
  - Package Export: `./rmt-language/vnext-surfaces`
  - Handoff: `WP-E15-09` bleibt startbar; `WP-E15-10` kann Surface Registry fuer Component Binding nutzen

### WP-E15-09 - Conditions und deklaratives Expression Subset definieren

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - `when` Bedingungen ausdrücken, ohne RMT zur Programmiersprache zu machen
- Scope:
  - Pfadzugriffe, Literale, Vergleichsoperatoren und boolesche Verknüpfungen
  - keine Funktionsaufrufe, kein Eval, keine Seiteneffekte
  - Typisierung und Diagnose unbekannter Pfade
  - Core-Repräsentation für Conditions
- Zielartefakte:
  - Expression-Subset-Contract
  - Parser- und Compiler-Erweiterung für `when`
  - negative Fixtures für imperative oder dynamische Konstrukte
- Gate:
  - Condition-Parser- und Core-Mapping-Tests
- Definition of Done:
  - Conditions sind deterministisch analysierbar
  - unerlaubte Ausdrücke werden früh diagnostiziert
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Condition-Expression-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-09-Conditions-und-deklaratives-Expression-Subset-definieren.md`
  - Modul: `tools/rmt-language/vnext-conditions.js`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-conditions --json`
  - Package Export: `./rmt-language/vnext-conditions`
  - Handoff: `WP-E15-10` bleibt startbar; `WP-E15-12` ist durch typisierte Conditions entblockt

### WP-E15-10 - Slots, Composition und Component Binding integrieren

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - verschachtelte Composition deklarativ und komponentenagnostisch abbilden
- Scope:
  - `slot` Blöcke
  - Component-Refs und lokale Aliasnamen
  - Nested Operations innerhalb von Composition-Blöcken
  - Abgleich mit bestehendem Component Contract
- Zielartefakte:
  - Composition AST/Core Nodes
  - Slot-Binding-Contract
  - Fixture für verschachtelte Komponentenstruktur
- Gate:
  - Compiler-Golden-Test für Slots und Nested Operations
- Definition of Done:
  - Composition bleibt Orchestrierung, nicht HTML-Markup
  - Component Binding funktioniert über Adapter-Contracts
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Composition-Component-Binding-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-10-Slots-Composition-und-Component-Binding-integrieren.md`
  - Modul: `tools/rmt-language/vnext-composition.js`
  - Fixture: `tests/rmt-language/fixtures/vnext-composition-valid.rmt`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-composition --json`
  - Package Export: `./rmt-language/vnext-composition`
  - Handoff: `WP-E15-11` bleibt startbar; `WP-E15-12` kann Component Bindings fuer Event/Data-Source-Zuordnung nutzen

### WP-E15-11 - Imports, Module Resolution und Package Boundaries implementieren

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - RMT-Dateien modularisieren, ohne dynamische Codeausführung einzuführen
- Scope:
  - statische `import` Pfade und erlaubte Glob-Formen
  - zyklische Importdiagnostics
  - Package Boundaries und Root-Verzeichnisse
  - deterministische Merge-/Composition-Regeln
- Zielartefakte:
  - Import Resolver Contract
  - Module Graph Snapshot
  - Tests für lokale Dateien, Globs, Zyklen und fehlende Dateien
- Gate:
  - Module-Graph-Test mit stabiler Auflösungsreihenfolge
- Definition of Done:
  - Imports sind statisch analysierbar
  - Bundler, CLI und LSP nutzen dieselbe Auflösungslogik
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Import-Resolver-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-11-Imports-Module-Resolution-und-Package-Boundaries-implementieren.md`
  - Modul: `tools/rmt-language/vnext-import-resolver.js`
  - Fixtures: `tests/rmt-language/fixtures/vnext-modules*/`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-imports --json`
  - Package Export: `./rmt-language/vnext-import-resolver`
  - Handoff: `WP-E15-12` bleibt startbar; `WP-E15-15` kann denselben Module Graph fuer LSP/Bundler nutzen

### WP-E15-12 - Events, Actions und Data Sources anbinden

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - Events und Datenquellen deklarativ beschreiben, ohne imperative Handler in die Sprache zu holen
- Scope:
  - `on ... -> action ...`
  - `from endpoint ...`, `from sse ...`, `from worker ...`
  - Action-Refs, Payload-Shape und Capability Requirements
  - Diagnose unbekannter Actions oder Data Sources
- Zielartefakte:
  - Event/Action Contract
  - Data Source Contract
  - Fixtures für Endpoint-, SSE- und Worker-Quellen
- Gate:
  - Contract-Tests mit Adapter-Stubs und ungültigen Referenzen
- Definition of Done:
  - Event-Bindings sind referenziell prüfbar
  - Data Sources bleiben deklarative Capabilities
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Event-Action-DataSource-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-12-Events-Actions-und-Data-Sources-anbinden.md`
  - Modul: `tools/rmt-language/vnext-events.js`
  - Fixture: `tests/rmt-language/fixtures/vnext-events-valid.rmt`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-events --json`
  - Package Export: `./rmt-language/vnext-events`
  - Handoff: `WP-E15-13` bleibt startbar; `WP-E15-14` bleibt bis Security Policies blockiert

### WP-E15-13 - Trust Boundaries, Sanitizing und Security Policies integrieren

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - Security-by-Design als eigene DSL- und Core-Domain stabilisieren
- Scope:
  - `trust boundary`
  - `sanitize html`
  - CSP-, Isolation-, Sandbox- und Escaping-Policies
  - Pflichtdiagnostics für unsichere HTML-/Streaming-/Endpoint-Pfade
- Zielartefakte:
  - Security Policy Contract vNext
  - Schema-Records für Trust Boundaries
  - negative Fixtures für fehlende oder widersprüchliche Policies
- Gate:
  - Security-Policy-Linter-Tests
- Definition of Done:
  - Security ist explizit und auditierbar
  - unsichere Datenflüsse werden nicht still normalisiert
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Security-Policy-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-13-Trust-Boundaries-Sanitizing-und-Security-Policies-integrieren.md`
  - Modul: `tools/rmt-language/vnext-security.js`
  - Fixtures: `tests/rmt-language/fixtures/vnext-security-*.rmt`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-security --json`
  - Package Export: `./rmt-language/vnext-security`
  - Handoff: `WP-E15-14` ist durch Security Policies entblockt

### WP-E15-14 - Streaming und Incremental Rendering Contract vorbereiten

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - Streaming, Chunked Hydration und Incremental Rendering in Core- und Runtime-Contracts vorbereiten
- Scope:
  - `stream ... from ...`
  - Chunk-Metadaten, Completion-Signale und Fehlerpfade
  - Zusammenspiel mit Scheduling, Data Sources und Trust Boundaries
  - SSR-, SSE-, Worker- und Hydration-Varianten als Capabilities
- Zielartefakte:
  - Streaming Contract vNext
  - Core-Repräsentation für Stream Operations
  - Fixture für progressive Composition
- Gate:
  - Stream-Core-Mapping-Tests und host-neutrale Runtime-Probe
- Definition of Done:
  - Streaming ist deklarativ beschreibbar
  - Backpressure und Security-Policy bleiben sichtbar
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Streaming-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-14-Streaming-und-Incremental-Rendering-Contract-vorbereiten.md`
  - Modul: `tools/rmt-language/vnext-streaming.js`
  - Fixture: `tests/rmt-language/fixtures/vnext-streaming-progressive.rmt`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-streaming --json`
  - Package Export: `./rmt-language/vnext-streaming`
  - Handoff: `WP-E15-15` ist durch Streaming Contract entblockt

### WP-E15-15 - Tooling Update für Linter, LSP, Formatter und Snippets bauen

- Priorität: `P1`
- Status: `completed`
- Ziel:
  - Epic-14-Tooling auf native vNext-Syntax erweitern
- Scope:
  - Parser Adapter im Linter und Language Server
  - Completion, Hover, Symbols und Definition Provider für neue Keywords und Nodes
  - Formatter- oder Pretty-Print-Strategie
  - AI-Agent-Reports mit Source Maps
- Zielartefakte:
  - vNext-fähige RMT-Language-Schicht
  - Diagnosecodes für neue Syntaxbereiche
  - Snippets und Authoring-Patterns
- Gate:
  - Linter- und LSP-Regression gegen Legacy- und vNext-Fixtures
- Definition of Done:
  - IDE-Feedback funktioniert für vNext-Dateien
  - bestehende Epic-14-Funktionen bleiben für Legacy-Dokumente nutzbar
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Tooling-Adapter-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-15-Tooling-Update-fuer-Linter-LSP-Formatter-und-Snippets-bauen.md`
  - Modul: `tools/rmt-language/vnext-tooling.js`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-tooling --json`
  - Package Export: `./rmt-language/vnext-tooling`
  - Handoff: `WP-E15-16` ist durch vNext Tooling entblockt

### WP-E15-16 - Compatibility, Migration und Legacy JSON Roundtrip absichern

- Priorität: `P2`
- Status: `completed`
- Ziel:
  - bestehende RMT-Nutzung nicht brechen und kontrollierte Migration ermöglichen
- Scope:
  - Legacy JSON/Core zu vNext Authoring oder vNext Core
  - Warnungen statt harter Fehler für kompatible Altformen
  - Roundtrip-Grenzen dokumentieren
  - Migrationsreport für AI-Agenten und CLI
- Zielartefakte:
  - Migration Guide Contract
  - Compatibility Matrix
  - Roundtrip-Tests
- Gate:
  - Legacy-Fixtures aus Docs, Demo-App und Tests bleiben parse-/normalisierbar
- Definition of Done:
  - Migration ist opt-in und nachvollziehbar
  - inkompatible Fälle werden präzise diagnostiziert
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Compatibility-Migration-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-16-Compatibility-Migration-und-Legacy-JSON-Roundtrip-absichern.md`
  - Modul: `tools/rmt-language/vnext-compatibility.js`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-compatibility --json`
  - Package Export: `./rmt-language/vnext-compatibility`
  - Handoff: `WP-E15-17` ist durch Compatibility Matrix und Roundtrip-Gate entblockt

### WP-E15-17 - Fixtures, Compiler Golden Tests, Fuzzing und Browser-Smokes erweitern

- Priorität: `P2`
- Status: `completed`
- Ziel:
  - vNext-Syntax gegen Regressionen, Parser-Kanten und Runtime-Smokes absichern
- Scope:
  - positive und negative Syntaxfixtures
  - Golden Tests für Core-Ausgabe
  - Fuzzing für Parser-Recovery
  - Browser-Smokes für Surface, Lifecycle, Scheduler, Security und Streaming
- Zielartefakte:
  - Fixture-Matrix
  - Test-Gates im bestehenden Test-Runner
  - Browsernahe Referenzprobe
- Gate:
  - `node scripts/run_xtend_tests.js` mit vNext-spezifischem Gate
- Definition of Done:
  - Parser, Compiler, Tooling und Runtime-Proben sind regressionsgesichert
  - negative Fixtures verhindern unbeabsichtigte Sprachfeatures
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Fixture-Regression-Gate-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-17-Fixtures-Compiler-Golden-Tests-Fuzzing-und-Browser-Smokes-erweitern.md`
  - Modul: `tools/rmt-language/vnext-regression.js`
  - Fixture Matrix: `tests/rmt-language/fixtures/vnext-fixture-matrix.json`
  - Browser Smoke: `tests/browser/fixtures/rmt-vnext-reference-smoke.html`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-regression --json`
  - Package Export: `./rmt-language/vnext-regression`
  - Handoff: `WP-E15-18` ist durch Fixture Matrix, Golden Hashes, Fuzzing und Browser-Probe entblockt

### WP-E15-18 - Docs, Reference Demo, Release Gates und Handoff finalisieren

- Priorität: `P2`
- Status: `completed`
- Ziel:
  - vNext-Syntax produktnah dokumentieren und releasefähig übergeben
- Scope:
  - Authoring Guide
  - Migration Notes
  - Reference Demo mit Templates, Surfaces, Lanes, Conditions, Slots, Security und Streaming
  - Release-Gate-Matrix und Handoff an nachfolgende Runtime-/Tooling-Epics
- Zielartefakte:
  - `docs/` Guide für RMT vNext Syntax
  - Referenz-`.rmt` Datei und Core-JSON-Output
  - Epic-Abschlussreview mit Rest-Risiken
- Gate:
  - Docs-, Reference-, Compiler- und Browser-Gates sind grün oder mit Owner-Entscheid dokumentiert
- Definition of Done:
  - Entwickler können vNext-Syntax anhand der Docs schreiben
  - Release-Gates und Handoff sind vollständig
  - Folgearbeiten sind als separate Epics oder WPs benannt
- Ergebnis:
  - Contract-Dokument: `development/XTendRMT-vNext-Release-Handoff-Contract.md`
  - Workpackage-Dokument: `development/WP-E15-18-Docs-Reference-Demo-Release-Gates-und-Handoff-finalisieren.md`
  - Authoring Guide: `docs/rmt-vnext-authoring.md`
  - Migration Notes: `docs/rmt-vnext-migration-notes.md`
  - Release Handoff: `docs/rmt-vnext-release-handoff.md`
  - Modul: `tools/rmt-language/vnext-release.js`
  - Gate: `node scripts/run_xtend_tests.js rmt-vnext-release --json`
  - Package Export: `./rmt-language/vnext-release`
  - Reference Demo: `xtendrmt/rmt-vnext-reference-demo.rmt`
  - Reference Core Output: `xtendrmt/rmt-vnext-reference-demo.core.json`
  - Abschluss: Epic 15 ist im Zustand `rmt-vnext-release-ready`

## Epic-15 Abschlussreview

Epic 15 ist abgeschlossen und akzeptiert den Contract `xtend.rmt.vnext-release-handoff.v1`.

Akzeptierte Zielreife:

- vNext Authoring-Syntax fuer Templates, Surfaces, Lanes, Lifecycle, Conditions, Slots, Events, Data Sources, Security und Streaming
- deterministischer Compiler in `xtend.rmt.core-format.vnext.v1`
- Tooling Adapter fuer Linter, LSP, Formatter-Preview, Snippets und Agent Reports
- Compatibility- und Migration-Reports fuer Legacy JSON
- Regression-Gate mit Fixture Matrix, Golden Hashes, Fuzzing und Browser-Probe
- oeffentliche Docs, Reference Demo und Release-Handoff

Akzeptierte Folgearbeiten:

- `rmt-vnext-runtime-adapters`
- `rmt-vnext-formatter-writer`
- `rmt-vnext-project-index`
- `rmt-vnext-editor-distribution`
