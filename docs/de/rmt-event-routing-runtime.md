# RMT Event Routing Runtime

Deklarative Event-Routen verbinden UI-Events, RMT-Source-Events und Route-Lifecycle-Signale mit Actions. Sie sind die Brücke zwischen Native-First Component Records und der Action/Effect Runtime.

## Öffentliche Bausteine

- `events` benennen Source, Event Type und Action Target.
- Payload Contracts definieren, welche Werte die Action aus dem Event lesen darf.
- Event Governance hält `preventDefault`, Propagation, Capture, Passive, Once und Retargeting deklarativ.
- `sourceMap` Einträge verbinden Event- und Action-Records mit Diagnostics.
- Scheduler Lanes halten Feedback-, Resource- und sichtbare Arbeit nachvollziehbar.

Dasselbe Event-Modell verarbeitet Browser-Component-Events, Route-Enter-Events, Collection Selection und Command/Search Selection.

Compatibility Anchors für ältere Runtime-Checks:

```txt
runtime contract: xtend.epic18.rmt-event-routing-runtime.v2
next workpackage: WP-E18-10
```

## Payload Contracts

Jedes Action-Event braucht einen Payload Contract, wenn es Host-Daten an eine Action weitergibt. Der Contract beschreibt Pflichtfelder, einfache Typen und die Quelle des Payloads, zum Beispiel `event.target.value`, `detail`, `dataset`, `$event.key`, `$event.sort`, `$event.value`, `$event.index` oder `$event.commandId`.

Payloads bleiben klein. Actions sollten Key, Query, Sort Descriptor oder Command ID erhalten, nicht das vollständige Browser Event Object.

## Collection Events

Collection Events kommen aus `collectionViews`. Sie routen Selection und Sorting in State-Update-Actions.

```json
{
  "events": [
    {
      "id": "event.collection.select",
      "source": "collection.orders",
      "type": "select",
      "action": "action.orders.select"
    },
    {
      "id": "event.collection.sort",
      "source": "collection.orders",
      "type": "sort",
      "action": "action.orders.sort"
    }
  ],
  "actions": [
    {
      "id": "action.orders.select",
      "kind": "state-update",
      "target": "state.orders.selection",
      "payload": "$event.key"
    }
  ]
}
```

So bleibt Data Display deklarativ: Der Component Host kann Cards oder Rows rendern, aber Selection State und Sorting State bleiben in RMT sichtbar.

## Command/Search Events

Command/Search Events kommen aus einer Trigger Component, einer Popover Surface oder einem `searchSources` Record. Query, Active Index und Selection sind getrennte Routen.

```json
{
  "events": [
    {
      "id": "event.command.query",
      "source": "component.command.search",
      "type": "input",
      "action": "action.command.query"
    },
    {
      "id": "event.command.execute",
      "source": "search.commands",
      "type": "select",
      "action": "action.command.execute"
    }
  ],
  "actions": [
    {
      "id": "action.command.execute",
      "kind": "effect",
      "effect": "effect.command.route",
      "payload": "$event.commandId",
      "policy": "registered-command-required"
    }
  ]
}
```

Die Execute Route darf nicht direkt zu einem Host Callback springen. Sie erreicht einen policy-gebundenen Effect, und der Effect wendet die Registered-Command-Allow-List an.

## Event Governance

Event Governance hält Browser Events deklarativ. Nutze Record Policies für:

- `preventDefault`
- `stopPropagation`
- `stopImmediatePropagation`
- `capture`
- `passive`
- `once`
- `retarget`

Ein Host kann diese Policies anwenden, ohne ein Produkt-Event-Framework oder einen globalen Event Bus einzuführen.

## Authoring-Ablauf

1. Benenne die Event Source: Component, Route, Collection, Surface oder Search Source.
2. Benenne den Event Type mit dem kleinsten sinnvollen Payload.
3. Route zu einer Action, nicht zu Host Code.
4. Lege Host-Arbeit hinter einen Effect mit Policy und Adapter Refs.
5. Ergänze Source-Map-Einträge für Event- und Action-Records, die in Diagnostics genutzt werden.

## Öffentlicher Vertrag

RMT Event Routing Runtime ist der öffentliche Runtime-Vertrag für `docs/de/rmt-event-routing-runtime.md`. Ein Host soll Event-Routen, Payloads und Governance ohne internes Projektwissen prüfen können.

Quellen:

- `tests/fixtures/rmt-owned-data-display-primitives.rmt`
- `tests/fixtures/rmt-owned-command-search-primitives.rmt`
- `tests/fixtures/rmt-owned-recipe-extension.rmt`
- `xtendrmt/rmt-event-routing-runtime.js`

Nachweise:

```bash
node scripts/run_xtend_tests.js rmt-event-routing-runtime --json
node scripts/run_xtend_tests.js rmt-owned-data-display-primitives rmt-owned-command-search-primitives rmt-owned-recipe-extension --json
node scripts/run_xtend_tests.js rmt-linter-cli rmt-language-server references --json
```

Erwartetes Signal: Event Routes bleiben deklarativ, payload-begrenzt, source-map-fähig und policy-gebunden, bevor sie Host Effects erreichen.

Weiterlesen:

- [RMT Action Effect Runtime](./rmt-action-effect-runtime.md)
- [RMT Component Primitives und XTend UI](./rmt-vnext-component-primitives.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
