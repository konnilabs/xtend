# XTendRMT vNext Grammar Contract

- Status: `accepted by WP-E15-02`
- Datum: 12. Mai 2026
- Epic: `EPIC_E15_RMT_vNext_Syntax`
- Contract: `xtend.rmt.vnext.grammar.v1`
- Boundary: `no-rmt-kernel-import-of-host-runtime-types`
- Zielzustand: `rmt-vnext-grammar-mvp-ready`
- Folgecontract: `xtend.rmt.core-format.vnext.v1`

## Zweck

Dieses Dokument friert die erste RMT-vNext-Authoring-Grammatik ein. Es ist der Contract fuer `WP-E15-03` Core Format vNext, AST und Schema Mapping sowie fuer `WP-E15-04` Lexer/Parser MVP.

Die Grammatik beschreibt nur die menschenlesbare Authoring-Syntax. Runtime-Semantik, Core-Node-Shape und Schema-Mapping werden im Folgepaket festgelegt.

## Sprachgrenzen

RMT vNext bleibt deklarativ.

Erlaubt:

- deklarative Dokumentstruktur
- statische Imports
- benannte Templates, Surfaces und Lanes
- Lifecycle- und Stream-Statements
- deklarative Conditions
- Slot Composition
- Event-zu-Action-Referenzen
- Data-Source-Referenzen
- Trust- und Sanitizing-Policies

Nicht erlaubt:

- `if`, `for`, `while`, `switch`, `try`, `catch`
- Funktionsdefinitionen
- freie Funktionsaufrufe in Conditions
- Inline-JavaScript, Inline-HTML als Sprachelement oder Eval
- dynamische Imports
- versteckte Runtime-Ausfuehrung durch Identifier-Namen

## Lexikalisches Modell

| Element | Entscheidung |
|---------|--------------|
| Encoding | UTF-8 Text |
| Primaerer Dateityp | `.rmt` |
| Whitespace | trennt Tokens, ist sonst bedeutungslos |
| Statement-Ende | Newline, Semikolon oder Blockende |
| Semikolons | optional nach einfachen Statements erlaubt, vom Formatter nicht bevorzugt |
| Trailing Commas | nicht erlaubt; MVP besitzt keine Listen- oder Objektliteral-Syntax |
| Line Comment | `// comment` bis Zeilenende |
| Block Comment | `/* comment */`, nicht verschachtelt |
| Strings | nur doppelt quotierte Strings mit JSON-kompatiblen Escapes |
| Single Quotes | nicht Teil des MVP |
| Zahlen | nichtnegative dezimale Integer |
| Booleans | `true`, `false` nur in Conditions |
| Null | `null` nur in Conditions |

Kommentare werden vom Parser ignoriert, duerfen Source Ranges aber nicht verschieben oder Diagnostics unbrauchbar machen.

## Identifier

Bare Identifier:

```text
[A-Za-z_][A-Za-z0-9_-]*
```

Qualified Identifier:

```text
Identifier ("." Identifier)*
```

Beispiele:

- `docs`
- `docs.page`
- `docs-header`
- `modal.settings`
- `route.visible.render`

Escaped Identifier:

```text
`any value without unescaped backtick`
```

Escaped Identifier sind fuer reservierte Woerter oder spaeter importierte Host-Namen erlaubt. Neue Beispiele sollen sie nur nutzen, wenn ein Bare Identifier nicht moeglich ist.

## Reservierte Woerter

Diese Woerter sind ausserhalb von Strings und escaped Identifiers reserviert:

```text
template surface lane weight
mount hydrate suspend resume invalidate dispose prewarm recycle detach reattach
stream from endpoint sse worker
when slot import on action
trust boundary sanitize
true false null
```

Imperative Kontrollwoerter sind bewusst nicht Teil der Sprache und sollen als spezifische Diagnose abgelehnt werden:

```text
if else for while switch case try catch finally function return await async class new eval
```

## Dokumentstruktur

RMT vNext Dokumente bestehen aus statischen Imports und Deklarationen.

```text
Document      := DocumentItem*
DocumentItem  := ImportDecl | TemplateDecl | SurfaceDecl
```

Top-Level Lifecycle-Statements sind im MVP nicht erlaubt. Operationen muessen in einer `lane` oder einem `slot` stehen.

## Imports

Imports sind statisch und verwenden Strings.

```text
ImportDecl := "import" String StatementEnd
```

Gueltig:

```rmt
import "./routes/*.rmt"
```

Ungueltig:

```rmt
import routesPath
import "./routes/" + env
```

## Templates

Templates gruppieren Surfaces.

```text
TemplateDecl      := "template" QualifiedIdentifier Block<TemplateItem>
TemplateItem      := ImportDecl | SurfaceDecl
```

Gueltig:

```rmt
template docs.page {
  surface root {
    lane critical {
      hydrate docs-header
    }
  }
}
```

## Surfaces

Surfaces gruppieren Lanes.

```text
SurfaceDecl      := "surface" QualifiedIdentifier Block<SurfaceItem>
SurfaceItem      := LaneDecl
```

Gueltig:

```rmt
surface modal.settings {
  lane critical {
    hydrate settings-form
  }
}
```

## Lanes

Lanes beschreiben Scheduling-Kontext. `weight` ist optional und muss ein Integer sein.

```text
LaneDecl      := "lane" QualifiedIdentifier LaneAttribute* Block<LaneItem>
LaneAttribute := "weight" Integer
LaneItem      := LifecycleStmt | StreamStmt
```

Gueltig:

```rmt
lane critical weight 10 {
  hydrate navigation
}
```

Ungueltig:

```rmt
lane critical weight "high" {
  hydrate navigation
}
```

## Lifecycle Statements

Lifecycle Statements deklarieren Absichten fuer ein Ziel.

```text
LifecycleStmt := LifecycleOp Target SourceClause? ConditionClause? PolicyBlock? StatementEnd?
LifecycleOp   := "mount" | "hydrate" | "suspend" | "resume" | "invalidate" | "dispose" | "prewarm" | "recycle" | "detach" | "reattach"
Target        := QualifiedIdentifier | EscapedIdentifier
```

Gueltig:

```rmt
hydrate docs-sidebar
suspend search-overlay
dispose stale-route
```

## Data Sources

Data Sources sind referenzielle Capabilities.

```text
SourceClause := "from" SourceKind QualifiedIdentifier
SourceKind   := "endpoint" | "sse" | "worker"
```

Gueltig:

```rmt
hydrate markdown-viewer from endpoint docs.parse
stream docs-content from sse docs.feed
```

Ungueltig:

```rmt
hydrate markdown-viewer from fetch("docs")
```

## Conditions

Conditions verwenden ein kleines deklaratives Expression-Subset.

```text
ConditionClause := "when" Expression
Expression      := OrExpr
OrExpr          := AndExpr ("||" AndExpr)*
AndExpr         := UnaryExpr ("&&" UnaryExpr)*
UnaryExpr       := "!" UnaryExpr | CompareExpr
CompareExpr     := Primary (CompareOp Primary)?
CompareOp       := "==" | "!=" | ">" | ">=" | "<" | "<="
Primary         := Path | String | Integer | "true" | "false" | "null" | "(" Expression ")"
Path            := QualifiedIdentifier
```

Gueltig:

```rmt
mount admin-panel when user.role == "admin"
hydrate docs-content when route.visible == true && user.blocked != true
```

Ungueltig:

```rmt
mount admin-panel when canAccess("admin")
mount admin-panel when user.role in ["admin"]
mount admin-panel when user.role ? "admin" : "guest"
```

## Slots

Slots sind nur innerhalb eines Policy Blocks einer Lifecycle- oder Stream-Anweisung erlaubt.

```text
PolicyBlock := Block<PolicyItem>
PolicyItem  := SlotDecl | EventBinding | TrustPolicy | SanitizePolicy
SlotDecl    := "slot" QualifiedIdentifier Block<SlotItem>
SlotItem    := LifecycleStmt | StreamStmt
```

Gueltig:

```rmt
mount x-card {
  slot body {
    hydrate dashboard
  }
}
```

## Events und Actions

Events binden Host-Events an deklarative Action-Referenzen.

```text
EventBinding := "on" QualifiedIdentifier "->" "action" QualifiedIdentifier ConditionClause? StatementEnd
```

Gueltig:

```rmt
mount search-box {
  on submit -> action search.open
}
```

Ungueltig:

```rmt
mount search-box {
  on submit -> search.open()
}
```

## Trust und Sanitizing

Security Policies sind explizite Records im Authoring-Text.

```text
TrustPolicy    := "trust" "boundary" String StatementEnd
SanitizePolicy := "sanitize" QualifiedIdentifier StatementEnd
```

Gueltig:

```rmt
hydrate markdown-viewer from endpoint docs.parse {
  trust boundary "xtend.security.sanitizing-boundary.v1"
  sanitize html
}
```

## Streaming

Stream Statements folgen derselben Source-, Condition- und Policy-Logik wie Lifecycle Statements.

```text
StreamStmt := "stream" Target SourceClause ConditionClause? PolicyBlock? StatementEnd?
```

Gueltig:

```rmt
stream docs-content from sse docs.feed
```

## Blockmodell

```text
Block<T> := "{" T* "}"
```

Leere Bloecke sind syntaktisch erlaubt. Semantische Mindestinhalte werden in `WP-E15-03` und spaeteren Linter-Regeln festgelegt.

## Gueltige MVP-Fixture

```rmt
import "./shared/*.rmt"

template docs.page {
  surface root {
    lane critical weight 10 {
      hydrate docs-header
      hydrate docs-content when route.visible == true
    }

    lane idle weight 1 {
      prewarm search-index
    }
  }

  surface modal.settings {
    lane critical {
      mount settings-card {
        slot body {
          hydrate settings-form from endpoint settings.load
        }

        on submit -> action settings.save
      }
    }
  }
}

surface overlay.docs-feed {
  lane normal {
    stream docs-content from sse docs.feed {
      trust boundary "xtend.security.sanitizing-boundary.v1"
      sanitize html
    }
  }
}
```

## Ungueltige MVP-Fixtures

Imperative Kontrolle:

```rmt
if (user.role == "admin") {
  render(adminPanel)
}
```

Dynamischer Import:

```rmt
import "./routes/" + tenant
```

Freier Funktionsaufruf:

```rmt
mount admin-panel when canAccess("admin")
```

Top-Level Operation:

```rmt
hydrate docs-header
```

Inline Runtime Code:

```rmt
hydrate chart {
  script "renderChart()"
}
```

## Grammar Review Matrix

| Konzept | Gueltiges Beispiel vorhanden | Ungueltiges Beispiel vorhanden |
|---------|------------------------------|--------------------------------|
| Imports | ja | ja |
| Templates | ja | indirekt ueber Top-Level-Regel |
| Surfaces | ja | indirekt ueber Blockmodell |
| Lanes | ja | ja |
| Lifecycle Operations | ja | ja |
| Conditions | ja | ja |
| Slots | ja | indirekt ueber PolicyBlock-Regel |
| Events | ja | ja |
| Data Sources | ja | ja |
| Trust Boundaries | ja | ja |
| Sanitizing | ja | ja |
| Streaming | ja | ja |
| Imperative Nicht-Ziele | nein | ja |

## Handoff an WP-E15-03

`WP-E15-03` muss aus dieser Grammatik ein Core-Format- und AST-Mapping ableiten.

Offene Folgeentscheidungen:

- exakte AST-Node-Namen und Core-JSON-Shape
- Source-Map-Format fuer Block- und Statement-Ranges
- semantische Mindestinhalte fuer leere Bloecke
- Diagnosecodes fuer Kontextfehler
- Migrationsmapping von bestehenden JSON-nahen RMT-Dokumenten auf vNext-Core

Nicht mehr offen fuer das MVP:

- `template`, `surface`, `lane`, Lifecycle, `when`, `slot`, `import`, `on`, `from`, `trust`, `sanitize` und `stream` sind Teil der Grammatik.
- Semikolons sind optional.
- Trailing Commas sind nicht erlaubt.
- Kommentare sind `//` und `/* */`.
- Conditions enthalten keine Funktionsaufrufe, keine Listenliterale und kein Eval.
