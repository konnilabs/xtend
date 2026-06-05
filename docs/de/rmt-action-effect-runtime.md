# RMT Action Effect Runtime

RMT Actions und Effects verbinden deklarative UI Records mit State Changes, Resource Queries und Host Effects. Die Runtime-Oberfläche ist bewusst schmal: Actions benennen, was passieren darf, Effects benennen, welcher Adapter es ausführen darf, und Policies blockieren freie Ausführung.

## Öffentliche Bausteine

| Record | Rolle |
| --- | --- |
| `dataSources` | deklarieren Fixture-, injected, REST-, SSR- oder Host-Daten mit Owner und Adapter Policy |
| `resources` | binden Data Sources an Lifecycle, Cache, Loading, Error und Release State |
| `actions` | aktualisieren State, starten eine Resource Query oder rufen einen Effect über eine benannte Policy auf |
| `effects` | beschreiben Host-Operationen mit Adapter Refs, Allow-Lists und Result State |
| `events` | routen Browser- oder RMT-Source-Events zu Actions |
| `schedules` | ordnen sichtbare, Resource-, Accessibility- oder Diagnostics-Arbeit Budgets zu |

Derselbe Vertrag wird von Data-Display- und Command/Search-Recipes genutzt. Ein Dashboard kann eine Resource aktualisieren; eine Command Palette kann einen registrierten Command ausführen; beides kommt ohne imperative Host-Verkabelung in der RMT-Quelle aus.

Compatibility Anchors für ältere Runtime-Checks:

```txt
runtime contract: xtend.epic18.rmt-action-effect-runtime.v1
DataSources: fixture, rest, ssr, host
Resource Ownership: resources release by action owner or scope
next workpackage: WP-E18-09
```

## State- und Resource-Actions

State Updates sollten Target und typisierte Payload-Quelle benennen. Resource Queries sollten die Resource benennen und eine Owner Policy verlangen.

```json
{
  "actions": [
    {
      "id": "action.orders.refresh",
      "kind": "resource-query",
      "resource": "resource.orders",
      "policy": "resource-owner-required"
    },
    {
      "id": "action.orders.select",
      "kind": "state-update",
      "target": "state.orders.selection",
      "payload": "$event.key"
    }
  ]
}
```

Resources tragen eigene Loading- und Error-States. Templates können daher Loading-, Empty- und Error-Flächen rendern, ohne hostseitige Conditionals einzuführen.

## Effect Policy

Effects sind Host-Grenzen. Ein Command Effect muss Host Adapter, erforderliche Policy, erlaubte Command-IDs und Ziel-State für das Ergebnis benennen.

```json
{
  "actions": [
    {
      "id": "action.command.execute",
      "kind": "effect",
      "effect": "effect.command.route",
      "payload": "$event.commandId",
      "policy": "registered-command-required"
    }
  ],
  "effects": [
    {
      "id": "effect.command.route",
      "kind": "host-command",
      "adapterRef": "adapter.commandRouter",
      "policy": "effect-policy-required",
      "allowedCommands": ["cmd-open-audit", "cmd-run-gate"],
      "resultState": "state.command.result"
    }
  ]
}
```

Die Runtime muss nicht registrierte Command-Ausführung und Command-Ausführung ohne Action Ref ablehnen. Das ist Teil des öffentlichen Sicherheitsvertrags, keine optionale Host-Präferenz.

## Command/Search-Sicherheit

Command/Search Recipes ergänzen vier Regeln:

- `commandSources` setzen `actionRefRequired: true`, wenn sie registrierte Commands offenlegen.
- Search Selection läuft über eine Action wie `action.command.execute`, nicht direkt zu einem Host Callback.
- Host Command Effects halten eine Allow-List in `allowedCommands`.
- Focus-Recovery-Effects wie `effect.command.focusRestore` benennen Target und Policy.

Diese Regeln halten die Command-Oberfläche auditierbar, auch wenn die UI Popover, Shortcut und async Search Resource nutzt.

## Data-Display-Sicherheit

Data-Display Recipes nutzen Actions für Selection und Sorting:

- `event.collection.select` aktualisiert `state.orders.selection`.
- `event.collection.sort` aktualisiert `state.orders.sort`.
- Resource Query Work bleibt auf der `resource` Scheduler Lane.
- Render Work bleibt auf der `visible` Scheduler Lane.

Claims für große Datenmengen sollten zusätzlich Frame-Budgets wie `maxItemsPerFrame` auf `collectionViews` offenlegen.

## Öffentlicher Vertrag

RMT Action Effect Runtime ist der öffentliche Runtime-Vertrag für `docs/de/rmt-action-effect-runtime.md`. Stabiles Verhalten bedeutet, dass Records, Policies und negative Claims über lokale Fixtures prüfbar sind.

Quellen:

- `tests/fixtures/rmt-owned-data-display-primitives.rmt`
- `tests/fixtures/rmt-owned-command-search-primitives.rmt`
- `tests/fixtures/rmt-owned-recipe-extension.rmt`
- `tests/fixtures/native-first/rmt-owned-contract-budget-runtime-parity-fixtures.json`

Nachweise:

```bash
node scripts/run_xtend_tests.js rmt-action-effect-runtime --json
node scripts/run_xtend_tests.js rmt-owned-command-search-primitives rmt-owned-recipe-extension --json
node scripts/run_xtend_tests.js rmt-owned-contract-budget-runtime-parity references --json
```

Erwartetes Signal: Actions und Effects bleiben policy-gebunden, source-map-fähig und frei von unregistrierter Host-Ausführung.

Weiterlesen:

- [RMT Event Routing Runtime](./rmt-event-routing-runtime.md)
- [RMT Surface Resource Graph Runtime](./rmt-surface-resource-graph-runtime.md)
- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
