# RMT Reference: State, Selectors und Data

Diese Seite beschreibt Datenquellen, State und deklarative Ableitungen.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="type"></a>`type` | `state app.count type number` | `state`, `input` | Typname | Deklariert den erwarteten Werttyp. | Fehlende Typen erzeugen Syntax-Diagnosen. | `state`, `input` |
| <a id="initial"></a>`initial` | `initial true` oder `initial { text "Ready" }` | `state` | Literal oder Initial-Block | Setzt den Anfangswert. | State-Blöcke erlauben nur Initial-Werte. | `preserve` |
| <a id="preserve"></a>`preserve` | `state app.status type object preserve` | `state`, `surface` | Flag ohne Wert | Erhält State oder Surface-Zustand über Lifecycle-Grenzen. | Falscher Kontext erzeugt Kontextdiagnosen. | `destroy releases` |
| <a id="from"></a>`from` | `from state app.status` | `selector`, `datasource`, Operationen, `payload` | Source-Art und Referenz | Bindet eine deklarative Quelle. | Source-Art muss erlaubt sein. | `endpoint`, `selector`, `payload` |
| <a id="endpoint"></a>`endpoint` | `from endpoint "/api/items"` | `datasource`, Operationen | String oder Identifier | Bindet Host-Endpoint-Daten. | Ungültige Source-Kinds werden gemeldet. | `method`, `contract` |
| <a id="sse"></a>`sse` | `stream feed from sse app.feed` | `stream` | Stream-Identifier | Bindet Server-Sent Events an Streaming. | `stream` verlangt eine Quelle. | `stream` |
| <a id="worker"></a>`worker` | `prewarm index from worker search.prepare` | Operationen, `datasource` | Worker-Identifier | Beschreibt Worker-basierte Vorbereitung. | Source-Art muss statisch sein. | `prewarm` |
| <a id="fixture"></a>`fixture` | `fallback fixture app.sample` | `datasource`, Operationen | Fixture-Identifier | Bindet Test- oder Fallbackdaten. | Unbekannte Referenzen werden semantisch gemeldet. | `fallback` |
| <a id="resource-source"></a>`resource` | `from resource app.file` | Operationen, `resource` | Resource-Identifier | Verwendet eine owner-scoped Resource als Quelle. | Fehlende Resource erzeugt Semantikdiagnosen. | `resource`, `dispose` |
| <a id="where"></a>`where` | `where item.active == true` | `selector` | deklarativer Ausdruck | Filtert Selector-Ergebnisse. | Nur der deklarative Aufruf `contains(value, search)` ist erlaubt. | `find`, `sort by` |
| <a id="find"></a>`find` | `find item.id == input.id` | `selector` | deklarativer Ausdruck | Wählt einen Datensatz. | Ungültige Ausdrücke werden parserseitig gemeldet. | `where` |
| <a id="sort-by"></a>`sort by` | `sort by item.createdAt desc` | `selector` | Pfad, Richtung | Sortiert Selector-Ergebnisse stabil. | Sort-Clause muss vollständig sein. | `output` |
| <a id="output"></a>`output` | `output MessageList` | `selector` | Typname | Benennt den Output-Contract. | Fehlender Typ erzeugt Syntaxdiagnose. | `selector` |
| <a id="method"></a>`method` | `method GET` | `datasource` | HTTP-Methode oder Identifier | Dokumentiert die Host-Methode. | Nur innerhalb von DataSource-Blöcken. | `endpoint` |
| <a id="contract"></a>`contract` | `contract "xtend.schema.v1"` | `datasource` | statischer String | Bindet ein Daten- oder Endpoint-Schema. | Falscher Kontext wird gemeldet. | `result` |
| <a id="result"></a>`result` | `result list` | `datasource` | Ergebnisform | Beschreibt die erwartete Ergebnisform. | Nur DataSource-Clause. | `fallback` |
| <a id="fallback"></a>`fallback` | `fallback fixture app.empty` | `datasource`, Remote Surface | Art und Referenz | Deklariert einen sicheren Ersatzpfad. | Fehlende Referenz wird gemeldet. | `fixture`, `fallback surface` |

## Allowed contexts

State-Clauses stehen in `state`, Selector-Clauses in `selector`, DataSource-Clauses in `datasource`. Source-Kinds stehen nach `from` oder `fallback`.

## Parameters

Identifier referenzieren Records; Strings beschreiben externe Pfade oder Contracts; Richtungen wie `asc` und `desc` bleiben statisch.

## Description

RMT trennt gespeicherten Zustand, abgeleitete Sichtmodelle und Host-Datenquellen. Dadurch kann der Compiler Abhängigkeiten erkennen, ohne Host-JavaScript auszuwerten.

`where` und `find` werden beim Kompilieren in strukturierte Runtime-Regeln übersetzt. Bereits erzeugte Artefakte mit reinen Text-Clauses müssen neu kompiliert werden. Erlaubt sind Literale, Pfade, Klammern, `!`, `&&`, `||`, `==`, `!=`, `>`, `>=`, `<`, `<=` und `contains(value, search)`. `item` und `record` bezeichnen das aktuelle Listenelement; `state` und `selector` referenzieren deklarierte Records. `input` liest die Parameter von `modelReader.select(id, params)`. Strings bleiben Literale, auch wenn sie wie State-Pfade aussehen.

Mehrere `where`-Clauses filtern gemeinsam. `find` liefert das erste passende Element oder `null`, auch bei gültigen Treffern wie `0`, `false` oder `""`. Pro Selector sind höchstens ein `find` und ein `sort` erlaubt. `sort by item.name` verwendet standardmäßig `asc`; `record.name` und der direkte Feldpfad `name` sind ebenfalls zulässig. Die bestehende Runtime sortiert stabil anhand der Stringdarstellung der Feldwerte, ohne die Quellliste zu verändern. Für eine Auswahl aus einer sortierten Liste einen zweiten Selector mit `from selector ...` und `find` verwenden. SSR-Ziele prüfen die tatsächlich unterstützten Ausdrucksoperationen; insbesondere `find` und `sort` bleiben im portablen PHP-Ziel abgewiesen.

## Examples

```rmt
template reference.data {
  state app.filter type object preserve {
    initial {
      text "open"
    }
  }

  datasource tickets from endpoint "/api/tickets" {
    method GET
    contract "xtend.ticket-list.v1"
    result list
    fallback fixture tickets.empty
  }

  state app.rows type array initial []

  selector openTickets from state app.rows {
    where item.status == "open"
    sort by item.createdAt desc
    output TicketList
  }

  selector selectedTicket from selector openTickets {
    find item.id == state.app.filter.text
    output Ticket
  }

  portal app.root root "#app" layer surface
  surface list kind region component x-summary {
    portal app.root
    lane visible weight 70 {
      hydrate ticket.list from selector openTickets
    }
  }
}
```

## Diagnostics

Der Parser meldet falsche Clauses im jeweiligen Block. Der Semantic Graph meldet unbekannte State-, Selector-, DataSource-, Fixture- oder Resource-Referenzen.

## Related operators

`state`, `selector`, `datasource`, `action`, `hydrate`, `stream`, `when`.

## Weiterführend

Der RMT-Referenzindex verknüpft State-, Selector- und Data-Records mit ihren Lifecycle-Regeln. [Verwandter Artikel](./rmt-reference.md)
