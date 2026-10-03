# RMT Component Primitives und XTend UI

RMT Component Primitives beschreiben XTend-eigene UI-Flächen, ohne den RMT-Kernel an XTend-Component-Klassen zu koppeln. Der Record sagt dem Host, welcher Component Adapter, welche Parts, Slots, Templates und Scheduler-Signale nötig sind; die konkrete DOM-Implementierung bleibt hinter der Adaptergrenze.

## Öffentliche Oberfläche

Die aktuelle öffentliche Oberfläche umfasst drei component-orientierte Record-Familien:

| Familie | Records | Zweck |
| --- | --- | --- |
| Display Foundation | `components`, `templates`, `slots`, `sourceMap` | XTend-eigene Section-, Card-, Summary-, Status-, Progress- und Alert-Flächen über DOM Descriptors rendern |
| Data Display | `dataSources`, `resources`, `selectors`, `collectionViews` | datengetriebene Collections mit Key, Selection, Sorting und State Templates rendern |
| Command/Search | `surfaces`, `commandSources`, `searchSources`, `actions`, `effects` | Command Popovers und query-gebundene Ergebnislisten mit registrierten Actions rendern |

Der RMT-Kernel bleibt neutral: Er speichert IDs, Tags, Adapter-Namen, Attribute, Props und Source-Map-Einträge, importiert aber keine XTend-Component-Typen oder browserspezifischen Host-Typen.

## Minimale App Shell mit drei Primitives

Die JSON-Blöcke in den folgenden Abschnitten zeigen kompilierte Core Records. Sie sind **kein** `.rmt`-Quelltext. Wenn eine RMT App Shell verlangt wird, beginnt die Antwort mit `template` und verwendet die Authoring-Operatoren. Dieses minimale Beispiel besitzt genau drei sichtbare Component Primitives (`x-section`, `x-status`, `x-button`) und muss vor der Ausgabe mit dem RMT-Compiler geprüft werden:

```rmt
template app.shell {
  state app.shell type object preserve {
    initial {
      id "app-shell"
      title "XTend App Shell"
      text "Willkommen bei XTend"
    }
  }

  state app.status type object preserve {
    initial {
      id "app-status"
      text "Bereit"
      tone "success"
    }
  }

  state app.start type object preserve {
    initial {
      id "app-start"
      text "Start"
      tone "primary"
      disabled false
    }
  }

  selector app.shell from state app.shell { output AppShell }
  selector app.status from state app.status { output AppStatus }
  selector app.start from state app.start { output AppStart }

  action app.start {
    input label string
    reduce state.app.status.text = "Gestartet"
  }

  portal app.root root "#app" layer surface

  surface app.shell kind page component x-section {
    source selector app.shell
    key shell.id
    portal app.root
    bounds x 0 y 0 width 960 height 640
    lane visible weight 90 {
      hydrate app-shell from selector app.shell
    }
  }

  surface app.status kind card component x-status {
    source selector app.status
    key status.id
    portal app.root
    bounds x 24 y 96 width 420 height 96
    lane visible weight 80 {
      hydrate app-status from selector app.status
    }
  }

  surface app.start kind action component x-button {
    source selector app.start
    key start.id
    portal app.root
    bounds x 24 y 216 width 180 height 56
    lane visible weight 80 {
      mount app-start from selector app.start
    }
    on click "#app-start" -> action app.start {
      payload label from target.dataset.label
    }
  }
}
```

Für AI-Hosts gilt der überprüfbare Ablauf: zuerst `xtend_knowledge_search`, danach `xtend_rmt_compile_check` mit exakt dem auszugebenden Quelltext. Nur `ok: true` mit `status: "compiled"` bestätigt eine valide RMT App.

## Component Records

Ein Component Record ist ein öffentlicher Adaptervertrag, kein Versprechen über generiertes DOM. Der Host kann `x-section`, `x-cards`, `x-summary`, `x-status`, `x-progress`, `x-alert`, `x-button`, `x-popover`, `x-input`, `x-menu` und `x-icon` rendern, während RMT nur die adapterseitige Form beschreibt.

```json
{
  "components": [
    {
      "id": "component.collection.cards",
      "tag": "x-cards",
      "adapter": "xtend.component",
      "parts": ["root", "grid", "item"]
    }
  ],
  "templates": [
    {
      "id": "template.order-card",
      "renderMode": "dom_descriptor",
      "root": {
        "type": "component",
        "component": "component.collection.cards",
        "props": {
          "title": "$record.title",
          "status": "$record.status",
          "selected": "$selection.current"
        }
      }
    }
  ]
}
```

Template-Ausgabe muss DOM-Descriptor-Ausgabe bleiben. String-basierte HTML Row Renderer und manuelle Command Renderer sind blockiert.

## Collection Views

Nutze `collectionViews`, wenn Component Primitives über Records iterieren müssen. Die Collection View bindet einen Selector an Item Template, Empty-/Loading-/Error-Templates, Selection und Sorting State. Außerdem legt sie budgetrelevante Werte wie `maxItemsPerFrame` offen.

```json
{
  "resources": [
    {
      "id": "resource.orders",
      "dataSource": "datasource.orders",
      "lifecycle": "query",
      "cachePolicy": "owner-scoped"
    }
  ],
  "collectionViews": [
    {
      "id": "collection.orders",
      "source": "selector.visibleOrders",
      "key": "$record.id",
      "itemTemplate": "template.order-card",
      "selection": "state.orders.selection",
      "sorting": "state.orders.sort"
    }
  ]
}
```

Das ist eine eigene Data-Display-Oberfläche, keine vollständige Datagrid-Kompatibilitätsschicht. `x-table`, `x-tree` und `x-virtual-list` sind für spätere Runtime-Nachweise reserviert; Autoren sollten virtualisierte oder hierarchische Claims explizit begrenzen, bis Nachweise vorliegen.

## Command- und Search-Primitives

Command/Search-Primitives nutzen eine Surface plus registrierte Command- und Search-Records. Die Component-Schicht kann Trigger, Popover, Search Input und Result Menu rendern; die Command-Verträge bleiben RMT Records.

```json
{
  "surfaces": [
    {
      "id": "surface.command-search",
      "kind": "popover",
      "focusPolicy": "restore-on-close",
      "escape": "event.command.close"
    }
  ],
  "commandSources": [
    {
      "id": "command.global",
      "surface": "surface.command-search",
      "shortcut": "Mod+K",
      "actionRefRequired": true
    }
  ]
}
```

`x-command-palette`, `x-autocomplete` und `x-combobox` bleiben begrenzte physische Component-Claims. Öffentliche RMT Records beschreiben bereits Command Source, Search Source, Fokus und Action-/Effect-Policy; vollständige Rich-Widget-Parität wartet auf Runtime- und Browser-Nachweise.

## Authoring-Ablauf

1. Beginne mit einem Component Record und einem DOM Descriptor Template.
2. Ergänze Data Source, Resource und Selector, bevor du `collectionViews` hinzufügst.
3. Ergänze eine Popover Surface, bevor du `commandSources` oder `searchSources` hinzufügst.
4. Route Events über Actions und Effects; binde keine freie Host-Command-Ausführung an.
5. Ergänze Source-Map-Einträge für Records, die in Diagnostics nachvollziehbar sein müssen.

## Öffentlicher Vertrag

RMT Component Primitives und XTend UI ist der öffentliche Runtime-Vertrag für `docs/de/rmt-vnext-component-primitives.md`. Ein externer Host soll die genannten Records und Prüfungen ohne internes Projektwissen nachvollziehen können.

Quellen:

- `tests/fixtures/rmt-owned-data-display-primitives.rmt`
- `tests/fixtures/rmt-owned-command-search-primitives.rmt`
- `tests/fixtures/rmt-owned-recipe-extension.rmt`
- `tests/fixtures/native-first/rmt-owned-data-display-primitives-fixtures.json`
- `tests/fixtures/native-first/rmt-owned-command-search-primitives-fixtures.json`
- `tests/fixtures/native-first/rmt-owned-release-handoff-fixtures.json`

Nachweise:

```bash
node scripts/run_xtend_tests.js rmt-owned-data-display-primitives rmt-owned-command-search-primitives rmt-owned-recipe-extension --json
node scripts/run_xtend_tests.js rmt-stack-docs rmt-playground-docs rmt-linter-cli rmt-language-server --json
```

Erwartetes Signal: Component Primitives bleiben adaptergebunden, source-map-fähig, dependency-arm und frei von manuellen HTML Sinks.

Weiterlesen:

- [Native-First RMT Recipes](./native-first-rmt-recipes.md)
- [RMT Event Routing Runtime](./rmt-event-routing-runtime.md)
- [RMT DOM Descriptor Renderer](./rmt-dom-descriptor-renderer.md)
