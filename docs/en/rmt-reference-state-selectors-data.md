# RMT Reference: State, Selectors and Data

This page describes data sources, state and declarative derivations.

## Syntax

| Operator | Form | Allowed contexts | Parameters | Function | Diagnostics | Related operators |
| --- | --- | --- | --- | --- | --- | --- |
| <a id="type"></a>`type` | `state app.count type number` | `state`, `input` | type name | Declares the expected value type. | Missing types produce syntax diagnostics. | `state`, `input` |
| <a id="initial"></a>`initial` | `initial true` or `initial { text "Ready" }` | `state` | literal or initial block | Sets the initial value. | State blocks allow only initial values. | `preserve` |
| <a id="preserve"></a>`preserve` | `state app.status type object preserve` | `state`, `surface` | flag without value | Preserves state or surface state across lifecycle boundaries. | Wrong contexts produce context diagnostics. | `destroy releases` |
| <a id="from"></a>`from` | `from state app.status` | `selector`, `datasource`, operations, `payload` | source kind and reference | Binds a declarative source. | Source kind must be allowed. | `endpoint`, `selector`, `payload` |
| <a id="endpoint"></a>`endpoint` | `from endpoint "/api/items"` | `datasource`, operations | string or identifier | Binds host endpoint data. | Invalid source kinds are reported. | `method`, `contract` |
| <a id="sse"></a>`sse` | `stream feed from sse app.feed` | `stream` | stream identifier | Binds Server-Sent Events to streaming. | `stream` requires a source. | `stream` |
| <a id="worker"></a>`worker` | `prewarm index from worker search.prepare` | operations, `datasource` | worker identifier | Describes worker-based preparation. | Source kind must be static. | `prewarm` |
| <a id="fixture"></a>`fixture` | `fallback fixture app.sample` | `datasource`, operations | fixture identifier | Binds test or fallback data. | Unknown references are reported semantically. | `fallback` |
| <a id="resource-source"></a>`resource` | `from resource app.file` | operations, `resource` | resource identifier | Uses an owner-scoped resource as source. | Missing resources produce semantic diagnostics. | `resource`, `dispose` |
| <a id="where"></a>`where` | `where item.active == true` | `selector` | declarative expression | Filters selector results. | Function calls are not allowed. | `find`, `sort by` |
| <a id="find"></a>`find` | `find item.id == input.id` | `selector` | declarative expression | Selects one record. | Invalid expressions are parser diagnostics. | `where` |
| <a id="sort-by"></a>`sort by` | `sort by item.createdAt desc` | `selector` | path, direction | Sorts selector results stably. | Sort clause must be complete. | `output` |
| <a id="output"></a>`output` | `output MessageList` | `selector` | type name | Names the output contract. | Missing type produces syntax diagnostics. | `selector` |
| <a id="method"></a>`method` | `method GET` | `datasource` | HTTP method or identifier | Documents the host method. | Only valid in datasource blocks. | `endpoint` |
| <a id="contract"></a>`contract` | `contract "xtend.schema.v1"` | `datasource` | static string | Binds a data or endpoint schema. | Wrong context is reported. | `result` |
| <a id="result"></a>`result` | `result list` | `datasource` | result shape | Describes the expected result shape. | Datasource clause only. | `fallback` |
| <a id="fallback"></a>`fallback` | `fallback fixture app.empty` | `datasource`, remote surface | kind and reference | Declares a safe replacement path. | Missing reference is reported. | `fixture`, `fallback surface` |

## Allowed contexts

State clauses belong in `state`, selector clauses in `selector`, datasource clauses in `datasource`. Source kinds appear after `from` or `fallback`.

## Parameters

Identifiers reference records; strings describe external paths or contracts; directions such as `asc` and `desc` remain static.

## Description

RMT separates stored state, derived view models and host data sources. This lets the compiler understand dependencies without evaluating host JavaScript.

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

  selector openTickets from datasource tickets {
    where ticket.status == "open"
    find ticket.id == app.filter.text
    sort by ticket.createdAt desc
    output TicketList
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

The parser reports wrong clauses in each block. The semantic graph reports unknown state, selector, datasource, fixture or resource references.

## Related operators

`state`, `selector`, `datasource`, `action`, `hydrate`, `stream`, `when`.

## Related reading

The RMT reference index links state, selector, and data records to their lifecycle rules. [Related article](./rmt-reference.md)
