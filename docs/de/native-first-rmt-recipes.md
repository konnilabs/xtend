# Native-First RMT Recipes

RMT Recipes beschreiben vollständige XTend-UIs ohne manuelle Host-Shell. Die aktuelle Recipe-Oberfläche umfasst Route Shells, Surfaces, Slots, Data Display, Command/Search, Actions, Effects, Resources, Event Routing, Scheduler Lanes und DOM Descriptor Rendering.

Dieser Guide zeigt, welche Records App-Autoren nutzen, wenn ein Dashboard, eine Command Palette oder ein gemischter App-Flow Native-First bleiben soll.

## Recipe-Grundsatz

Eine Native-First Recipe ist gültig, wenn sie diese Regeln erfüllt:

- Die UI entsteht aus RMT Records und nicht aus imperativem Host-Rendering.
- DOM-Ausgabe läuft über DOM Descriptor Records und XTend-eigene Component Adapter.
- Events werden über deklarative Routes, Actions, Commands oder Search Records verbunden.
- Data Sources und Resources besitzen Lifecycle-, Owner- und Cleanup-Regeln.
- Overlay-Surfaces halten Fokus, Escape und Stack-Verhalten deklarativ.
- Produktclaims bleiben begrenzt, wenn Browser-Nachweise oder Runtime-Parität noch offen sind.

Relevante Contracts:

- `xtend.native-first.rmt-complete-ui-recipe-fixtures.v1`
- `xtend.native-first.rmt-action-effect-data-resource-primitives.v1`
- `xtend.native-first.rmt-renderer-dom-descriptor-proofs.v1`
- `xtend.native-first.docs-authoring-guides.v1`
- `xtend.rmt-ui-maximality-owned-data-display-primitives.v1`
- `xtend.rmt-ui-maximality-owned-command-search-primitives.v1`
- `xtend.rmt-ui-maximality-owned-recipe-extension.v1`
- `xtend.rmt-ui-maximality-owned-release-handoff.v1`

## Recipe-Typen

| UI | RMT-Bausteine | Native-First Erwartung |
| --- | --- | --- |
| App Shell | Routes, Surfaces, Regions, Slots | keine manuelle Host-Shell, klare Fokus- und Scheduler-Regeln |
| Dashboard | `dataSources`, `resources`, `selectors`, `collectionViews`, Templates | eigene Data-Display-Primitives vor externer Grid-Runtime |
| Command/Search | `commandSources`, `searchSources`, Popover Surface, Effects | registrierte Commands, Action Refs und Effect Policy |
| Form | Form Binding, Validation, Submit Action, Error State | Browser-Form-APIs zuerst, deklarative Actions statt Inline-Code |
| Overlay | Surface, Portal, Dialog, Popover, Focus Policy | eigene Overlay- und Fokus-Primitives, Escape- und Cleanup-Regeln |
| Media | Resource Query, Preview, Fallback, Caption | sichere URLs, klare Lade- und Fehlerzustände |

## Dashboard und Data Display

Nutze `collectionViews`, wenn eine Recipe datengetriebene Cards, Listen oder tabellenähnliche Flächen rendert. Eine Collection View benennt den Selector für Records, den stabilen Key, das Item Template, Empty-/Loading-/Error-Templates, Selection State, Sorting State und ein Scheduler Budget.

```json
{
  "collectionViews": [
    {
      "id": "collection.orders",
      "source": "selector.visibleOrders",
      "layoutMode": "list-grid",
      "key": "$record.id",
      "itemTemplate": "template.order-card",
      "emptyTemplate": "template.collection.empty",
      "loadingTemplate": "template.collection.loading",
      "errorTemplate": "template.collection.error",
      "selection": "state.orders.selection",
      "sorting": "state.orders.sort",
      "maxItemsPerFrame": 50
    }
  ]
}
```

Das eigene Data-Display-Paket belegt aktuell Display Foundation und Collection-View-Records. Vollständige Datagrid-Parität, kopierte Framework-Table-APIs und Default-Virtualisierung bleiben außerhalb des öffentlichen Claims, bis passende Browser- und Runtime-Nachweise vorliegen.

## Command und Search

Nutze `commandSources` für registrierte Commands und `searchSources` für query-gebundene Ergebnislisten. Eine Command/Search Recipe sollte Surface, Trigger, Shortcut, registrierte Action Refs, Query State, Resource, Selector, Active Index, Selection State und zugängliche Ergebnissemantik offenlegen.

```json
{
  "commandSources": [
    {
      "id": "command.global",
      "surface": "surface.command-search",
      "shortcut": "Mod+K",
      "actionRefRequired": true
    }
  ],
  "searchSources": [
    {
      "id": "search.commands",
      "queryState": "state.command.query",
      "resource": "resource.commands",
      "selector": "selector.visibleCommands",
      "minQueryLength": 1,
      "debounceMs": 120,
      "activeIndexState": "state.command.activeIndex",
      "selectionState": "state.command.selection"
    }
  ]
}
```

Commands führen keine freien Strings aus. Selection läuft über `action.command.execute`, die Action verlangt einen registrierten Command, und der Effect benennt Adapter sowie Allow-List.

## Vollständiger App-Flow

Die Complete Recipe Extension verbindet Route, Dashboard Region und Command-Search-Popover:

- `route.dashboard` betritt `surface.dashboard`.
- `resource.orders` speist `selector.visibleOrders`, der `collection.orders` speist.
- `surface.command-search` besitzt `resource.commands` und gibt sie beim Schließen der Surface frei.
- `event.command.execute` erreicht `action.command.execute`, die `effect.command.route` erreicht.
- Scheduler Lanes bleiben explizit: sichtbares Rendering, Resource Query und Accessibility Feedback.

Damit kann ein Dashboard Data Display und Command/Search nutzen, ohne ein zweites UI-Framework oder einen manuellen HTML Row Renderer einzuführen.

## Öffentliche Grenzen

Diese Claims werden durch die aktuellen öffentlichen Recipes bewusst nicht gemacht:

- vollständige Datagrid-Parität
- Kompatibilität mit Framework-Table- oder Framework-Command-APIs
- Default-Verhalten für virtualisierte Listen ohne Browser-Nachweis
- Ausführung nicht registrierter Commands
- Command-Ausführung ohne Action Ref
- manuelle HTML Renderer für Rows oder Commands

## Nachweise

```bash
node scripts/run_xtend_tests.js rmt-complete-ui-recipes --json
node scripts/run_xtend_tests.js rmt-owned-data-display-primitives rmt-owned-command-search-primitives rmt-owned-recipe-extension --json
node scripts/run_xtend_tests.js rmt-renderer-dom-descriptor-proofs native-first-docs-authoring references --json
```

Erwartetes Signal: Recipe Records bleiben an RMT Core Records, DOM Descriptor Rendering, Trusted-DOM-Regeln, Action-/Effect-Policy und Budget-Pflichten gebunden.

Weiterlesen:

- [RMT Component Primitives und XTend UI](./rmt-vnext-component-primitives.md)
- [RMT Action Effect Runtime](./rmt-action-effect-runtime.md)
- [RMT Surface Resource Graph Runtime](./rmt-surface-resource-graph-runtime.md)
