# EPIC E15 — RMT vNext Syntax & Lifecycle-Oriented DSL

## Status

Draft / Architecture Target

---

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

`WP-E15-01` ist startbar.

Alle weiteren Pakete sind bewusst von Scope-, Grammar- oder Core-Format-Entscheidungen abhängig, damit die vNext-Syntax nicht durch Ad-hoc-Parserverhalten festgeschrieben wird.

---

# Workpackage-Übersicht

| ID | Priorität | Status | Workstream | Titel | Abhängigkeiten |
|----|-----------|--------|------------|-------|----------------|
| `WP-E15-01` | P0 | ready | WS0 | Epic-Identity, Scope und Source-of-Truth einfrieren | - |
| `WP-E15-02` | P0 | next | WS1 | Syntax Contract und Grammar MVP definieren | `WP-E15-01` |
| `WP-E15-03` | P0 | blocked | WS1 | Core Format vNext, AST und Schema Mapping spezifizieren | `WP-E15-01`, `WP-E15-02` |
| `WP-E15-04` | P0 | blocked | WS1 | Lexer/Parser MVP für Templates, Surfaces, Lanes und Lifecycle Ops bauen | `WP-E15-02`, `WP-E15-03` |
| `WP-E15-05` | P0 | blocked | WS1 | Compiler DSL zu Core mit Source Maps und Diagnostics anbinden | `WP-E15-04` |
| `WP-E15-06` | P1 | blocked | WS2 | Lifecycle Semantik und Operation Contract härten | `WP-E15-03`, `WP-E15-05` |
| `WP-E15-07` | P1 | blocked | WS2 | Scheduling, Lanes, Chunking und Backpressure modellieren | `WP-E15-03`, `WP-E15-05` |
| `WP-E15-08` | P1 | blocked | WS2 | Surface-Orchestrierung und Host-neutral Surface Registry bauen | `WP-E15-03`, `WP-E15-05` |
| `WP-E15-09` | P1 | blocked | WS3 | Conditions und deklaratives Expression Subset definieren | `WP-E15-02`, `WP-E15-05` |
| `WP-E15-10` | P1 | blocked | WS3 | Slots, Composition und Component Binding integrieren | `WP-E15-05`, `WP-E15-06` |
| `WP-E15-11` | P1 | blocked | WS3 | Imports, Module Resolution und Package Boundaries implementieren | `WP-E15-05` |
| `WP-E15-12` | P1 | blocked | WS3 | Events, Actions und Data Sources anbinden | `WP-E15-05`, `WP-E15-09` |
| `WP-E15-13` | P1 | blocked | WS4 | Trust Boundaries, Sanitizing und Security Policies integrieren | `WP-E15-03`, `WP-E15-05` |
| `WP-E15-14` | P1 | blocked | WS4 | Streaming und Incremental Rendering Contract vorbereiten | `WP-E15-07`, `WP-E15-12`, `WP-E15-13` |
| `WP-E15-15` | P1 | blocked | WS5 | Tooling Update für Linter, LSP, Formatter und Snippets bauen | `WP-E15-04`, `WP-E15-05` |
| `WP-E15-16` | P2 | blocked | WS5 | Compatibility, Migration und Legacy JSON Roundtrip absichern | `WP-E15-05`, `WP-E15-15` |
| `WP-E15-17` | P2 | blocked | WS6 | Fixtures, Compiler Golden Tests, Fuzzing und Browser-Smokes erweitern | `WP-E15-06`, `WP-E15-14`, `WP-E15-16` |
| `WP-E15-18` | P2 | blocked | WS6 | Docs, Reference Demo, Release Gates und Handoff finalisieren | `WP-E15-15`, `WP-E15-17` |

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
- Status: `ready`
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

### WP-E15-02 - Syntax Contract und Grammar MVP definieren

- Priorität: `P0`
- Status: `next`
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

### WP-E15-03 - Core Format vNext, AST und Schema Mapping spezifizieren

- Priorität: `P0`
- Status: `blocked`
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

### WP-E15-04 - Lexer/Parser MVP für Templates, Surfaces, Lanes und Lifecycle Ops bauen

- Priorität: `P0`
- Status: `blocked`
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

### WP-E15-05 - Compiler DSL zu Core mit Source Maps und Diagnostics anbinden

- Priorität: `P0`
- Status: `blocked`
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

### WP-E15-06 - Lifecycle Semantik und Operation Contract härten

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-07 - Scheduling, Lanes, Chunking und Backpressure modellieren

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-08 - Surface-Orchestrierung und Host-neutral Surface Registry bauen

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-09 - Conditions und deklaratives Expression Subset definieren

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-10 - Slots, Composition und Component Binding integrieren

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-11 - Imports, Module Resolution und Package Boundaries implementieren

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-12 - Events, Actions und Data Sources anbinden

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-13 - Trust Boundaries, Sanitizing und Security Policies integrieren

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-14 - Streaming und Incremental Rendering Contract vorbereiten

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-15 - Tooling Update für Linter, LSP, Formatter und Snippets bauen

- Priorität: `P1`
- Status: `blocked`
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

### WP-E15-16 - Compatibility, Migration und Legacy JSON Roundtrip absichern

- Priorität: `P2`
- Status: `blocked`
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

### WP-E15-17 - Fixtures, Compiler Golden Tests, Fuzzing und Browser-Smokes erweitern

- Priorität: `P2`
- Status: `blocked`
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

### WP-E15-18 - Docs, Reference Demo, Release Gates und Handoff finalisieren

- Priorität: `P2`
- Status: `blocked`
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
